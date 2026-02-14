# No Context - Slack Developer Setup Guide

## Overview

This document covers everything you need to do in the Slack developer ecosystem to get No Context up and running — both for local development and production.

---

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"** (not from manifest — we'll configure manually for clarity)
4. App Name: `No Context` (or `No Context Dev` for your dev instance)
5. Pick a development workspace to install into
6. Click **"Create App"**

> **Important**: Create TWO apps — one for development and one for production. They'll have different OAuth redirect URLs and event subscription URLs.

---

## Step 2: Configure Basic Info

On the **Basic Information** page:

1. **App Credentials** — Note these values (you'll need them as env vars):
   - `SLACK_CLIENT_ID`
   - `SLACK_CLIENT_SECRET`
   - `SLACK_SIGNING_SECRET`
2. **Display Information**:
   - App name: `No Context`
   - Short description: "Turns your #no-context quotes into AI-generated art"
   - App icon: Upload a 512x512 app icon (design TBD)
   - Background color: Pick a brand color

---

## Step 3: Configure OAuth & Permissions

Navigate to **OAuth & Permissions**:

### Redirect URLs

Add your OAuth callback URL:

- **Dev**: `http://localhost:3000/api/auth/callback/slack`
- **Prod**: `https://app.nocontextbot.com/api/auth/callback/slack`

> You may need separate redirect URLs for the Slack install flow vs. NextAuth sign-in. If so:
>
> - Install flow: `https://app.nocontextbot.com/api/slack/callback`
> - NextAuth sign-in: `https://app.nocontextbot.com/api/auth/callback/slack`

### Bot Token Scopes

Add these scopes under **Bot Token Scopes**:

| Scope              | Why                                           |
| ------------------ | --------------------------------------------- |
| `channels:history` | Read messages in channels the bot is added to |
| `channels:read`    | List channels and get channel info            |
| `chat:write`       | Post image replies in threads                 |
| `files:write`      | Upload generated images                       |
| `reactions:write`  | Add processing/limit emoji reactions          |
| `team:read`        | Get workspace name and icon                   |
| `users:read`       | Get poster's display name                     |

### User Token Scopes

None needed — we only use the bot token.

---

## Step 4: Configure Event Subscriptions

Navigate to **Event Subscriptions**:

1. **Enable Events**: Toggle ON
2. **Request URL**:
   - **Dev**: Use ngrok or similar tunnel → `https://your-tunnel.ngrok.io/api/slack/events`
   - **Prod**: `https://app.nocontextbot.com/api/slack/events`
   - Slack will send a challenge request to verify — your endpoint must respond with the challenge value
3. **Subscribe to Bot Events**:
   - `message.channels` — Messages posted in public channels
   - `app_home_opened` — User opens the App Home tab
   - `app_uninstalled` — App is uninstalled from a workspace

---

## Step 5: Configure Interactivity & Shortcuts

Navigate to **Interactivity & Shortcuts**:

1. **Enable Interactivity**: Toggle ON
2. **Request URL**:
   - **Dev**: `https://your-tunnel.ngrok.io/api/slack/interactions`
   - **Prod**: `https://app.nocontextbot.com/api/slack/interactions`

---

## Step 6: Configure Slash Commands

Navigate to **Slash Commands**:

Create one slash command:

| Field                             | Value                                                             |
| --------------------------------- | ----------------------------------------------------------------- | ----- | ----- | -------- |
| Command                           | `/nocontext`                                                      |
| Request URL                       | `https://app.nocontextbot.com/api/slack/commands` (or ngrok for dev) |
| Short Description                 | Manage No Context settings and usage                              |
| Usage Hint                        | `[status                                                          | style | pause | resume]` |
| Escape channels, users, and links | Yes                                                               |

---

## Step 7: Configure App Home

Navigate to **App Home**:

1. **Home Tab**: Enable
2. **Messages Tab**: Disable (we don't need DM functionality)
3. **Bot name**: `No Context`

---

## Step 8: Install to Development Workspace

1. Navigate to **Install App** in sidebar
2. Click **"Install to Workspace"**
3. Authorize the requested permissions
4. You'll receive a **Bot User OAuth Token** — this is the token stored in `Workspace.slackBotToken`
5. Note the token starts with `xoxb-`

---

## Step 9: Set Up Local Development (ngrok)

For local development, you need a public URL that tunnels to your local server:

```bash
# Install ngrok (if not installed)
brew install ngrok

# Start your Next.js dev server
npm run dev  # runs on localhost:3000

# In another terminal, start ngrok
ngrok http 3000
```

ngrok gives you a URL like `https://abc123.ngrok.io`. Update these in your Slack app settings:

- Event Subscriptions Request URL: `https://abc123.ngrok.io/api/slack/events`
- Interactivity Request URL: `https://abc123.ngrok.io/api/slack/interactions`
- Slash Command Request URL: `https://abc123.ngrok.io/api/slack/commands`

> **Note**: The ngrok URL changes each time you restart (unless you have a paid plan with reserved domains). You'll need to update the Slack app settings each time.

---

## Step 10: Environment Variables

Create a `.env.local` file with:

```env
# Slack App
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_BOT_TOKEN=xoxb-your-dev-bot-token  # only for single-workspace dev
SLACK_APP_ID=your_app_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret

# Database
DATABASE_URL=postgresql://nocontext:nocontext@localhost:5432/nocontext

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key

# OpenAI (DALL-E)
OPENAI_API_KEY=sk-your-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Image Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your-token

# Encryption
TOKEN_ENCRYPTION_KEY=generate-a-32-byte-hex-key
```

---

## Step 11: Prepare for Slack App Directory (Production)

When ready to distribute publicly:

1. Navigate to **Manage Distribution** in your Slack app settings
2. Complete the checklist:
   - Remove hard-coded bot token (use OAuth flow instead)
   - Activate public distribution
   - Add a proper redirect URL
3. **Submit for Review**:
   - App description and screenshots
   - Privacy policy URL
   - Support URL
   - Category: "Productivity" or "Fun"
   - Review typically takes 1-2 weeks

### App Directory Listing Requirements

- Long description (up to 4000 chars)
- 3+ screenshots showing the app in action
- Privacy policy at a public URL
- Support contact (email or URL)
- Landing page URL

---

## Development vs Production Checklist

| Item           | Dev                        | Production                           |
| -------------- | -------------------------- | ------------------------------------ |
| Slack App      | Separate "Dev" app         | Production app                       |
| OAuth redirect | `localhost:3000` via ngrok | `app.nocontextbot.com`                  |
| Event URL      | ngrok tunnel               | Production server                    |
| Bot token      | Single workspace token     | Per-workspace via OAuth              |
| Stripe keys    | `sk_test_` / `pk_test_`    | `sk_live_` / `pk_live_`              |
| Database       | Docker local Postgres      | Managed Postgres (Supabase/Neon/RDS) |
| Image storage  | Local or dev R2 bucket     | Production R2/S3 bucket              |

---

## Slack API Gotchas

1. **Event retries**: Slack retries event delivery if your server doesn't respond with 200 within 3 seconds. Always acknowledge immediately and process async.
2. **Signing secret verification**: Always verify the `X-Slack-Signature` header on incoming requests. Use `@slack/events-api` or manual HMAC verification.
3. **Bot self-messages**: The bot will receive its own messages as events. Filter by checking `event.bot_id` or comparing `event.user` to the bot's user ID.
4. **Channel membership**: The bot only receives `message.channels` events for channels it has been explicitly invited to. It does NOT receive events for all public channels by default.
5. **File uploads v2**: Use `files.uploadV2` (not the deprecated `files.upload`) for uploading images. The v2 API requires a different flow — you upload to a URL Slack provides.
6. **Rate limits**: `chat.postMessage` is limited to ~1/sec per channel. Image generation is slow enough that this shouldn't be an issue, but implement a queue just in case.
7. **Token storage**: Bot tokens (starting with `xoxb-`) are long-lived and do not expire. Store them encrypted. They are revoked only when the app is uninstalled.
