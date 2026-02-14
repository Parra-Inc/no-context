# No Context - Slack App Integration Spec

## Overview

No Context is a Slack app distributed via the Slack App Directory. It uses Slack's Events API to listen for messages in designated channels and the Web API to reply with generated images.

## Slack App Configuration

### OAuth Scopes (Bot Token)

| Scope              | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `channels:history` | Read messages in public channels the bot is in            |
| `channels:read`    | List public channels and get channel info                 |
| `chat:write`       | Post messages (image replies) in channels                 |
| `files:write`      | Upload generated images to Slack                          |
| `reactions:write`  | Add emoji reactions (processing indicator, limit reached) |
| `team:read`        | Get workspace name and icon for dashboard                 |
| `users:read`       | Get user display names for quote attribution              |

### Event Subscriptions

| Event              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `message.channels` | Triggered when a message is posted in a public channel the bot is in |
| `app_home_opened`  | Triggered when a user opens the bot's App Home tab                   |

### Interactivity

- **Slash command**: `/nocontext` — Opens the settings/status modal
  - `/nocontext status` — Shows current month usage
  - `/nocontext style` — Shows/changes current art style
  - `/nocontext pause` — Temporarily pauses the bot in this channel
  - `/nocontext resume` — Resumes the bot
- **App Home Tab**: Displays quick status, link to dashboard, current plan info

## Message Flow

```
User posts in #no-context
        │
        ▼
Slack sends `message.channels` event to our endpoint
        │
        ▼
Validate: Is this channel connected? Is the workspace active?
        │
        ▼
Filter out: bot messages, thread replies, message edits,
           file-only messages, messages from No Context bot itself
        │
        ▼
Check: Has workspace exceeded monthly quota?
  ├── YES → React with :no-context-limit: emoji, skip
  │
  ▼ NO
Send message text to Claude for quote detection
        │
        ▼
Is it a valid out-of-context quote?
  ├── NO → Do nothing (silent)
  │
  ▼ YES
React with :art: emoji (processing indicator)
        │
        ▼
Generate image via image generation API
        │
        ▼
Upload image to Slack via files.upload
        │
        ▼
Reply in thread with the image + caption
        │
        ▼
Remove :art: reaction, add :white_check_mark:
        │
        ▼
Save record to database (quote text, image URL, style, user, timestamp)
```

## Installation Flow (OAuth)

1. User clicks "Add to Slack" on marketing page or dashboard
2. Redirected to Slack OAuth consent screen with requested scopes
3. User approves → Slack redirects to our callback URL with auth code
4. Backend exchanges code for bot token + workspace info
5. Store encrypted bot token, workspace ID, team name, team icon
6. Redirect user to dashboard onboarding:
   - Select which channel(s) to connect
   - Choose default art style
   - Start 14-day Team trial (or select plan)

## Channel Connection

- After install, the workspace admin visits the dashboard to select channels
- The bot must be **invited** to the channel (`/invite @NoContext`) for events to fire
- Dashboard shows a checklist: "Invite the bot to your channel" with verification
- We verify channel access by calling `conversations.info` — if bot is not a member, show instruction

## App Home Tab

When a user opens the No Context bot in Slack's sidebar:

```
┌─────────────────────────────────────┐
│  🎨 No Context                      │
│                                     │
│  Workspace: Acme Corp               │
│  Plan: Team ($29/mo)                │
│  Usage: 42 / 100 images this month  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Open Dashboard →           │    │
│  └─────────────────────────────┘    │
│                                     │
│  Connected Channels:                │
│  • #no-context (active)             │
│  • #random-quotes (paused)          │
│                                     │
│  Current Style: Impressionist       │
│                                     │
│  Recent Generations:                │
│  • "I don't think that's how..."    │
│  • "Wait, the meeting is TODAY?"    │
│  • "Just put it in the cloud"       │
└─────────────────────────────────────┘
```

## Rate Limiting & Resilience

- Respect Slack's rate limits (1 message/second per channel for chat.write)
- Queue image generation jobs — don't block the event handler
- Respond to Slack events within 3 seconds (acknowledge immediately, process async)
- Retry failed image uploads up to 3 times with exponential backoff
- If image generation fails, reply in thread with a text-only fallback: "Couldn't generate art for this one, but it's saved to your gallery!"

## Uninstall Handling

- Listen for `app_uninstalled` event
- Revoke stored tokens
- Mark workspace as inactive (don't delete data — they may reinstall)
- Cancel Stripe subscription via webhook or manual check
