# No Context - Onboarding Spec

## Overview

Onboarding is a dedicated wizard flow that guides new workspace admins through initial setup after installing the Slack app. It runs at `/onboarding` in its own route group, completely separate from the dashboard — no sidebar, no navigation chrome. Users must complete onboarding before accessing the dashboard.

---

## Route Structure

- **Route**: `/onboarding`
- **Route group**: `(onboarding)` — isolated from the `(dashboard)` layout
- **Layout**: Centered card on a blank background, auth-gated
- **Page**: Client component with multi-step wizard

---

## Flow Triggers

### When onboarding is shown

1. User installs the Slack app → workspace is created via `/api/slack/callback` with `onboardingCompleted: false`
2. User signs in via NextAuth (Slack OIDC) → session includes `workspaceId`
3. Dashboard layout checks `workspace.onboardingCompleted` from the database
4. If `false` → redirect to `/onboarding`

### When onboarding is skipped

- If `workspace.onboardingCompleted` is `true` → user goes straight to `/dashboard`
- If a user navigates directly to `/onboarding` after completing it → redirected to `/dashboard`

---

## Steps

The wizard has **4 steps** with a progress bar at the top:

### Step 1: Welcome

```
┌─────────────────────────────────────┐
│                 🎨                   │
│                                     │
│     No Context is installed!        │
│                                     │
│  Let's get you set up in just       │
│  a few steps.                       │
│                                     │
│         [ Let's Go ]                │
└─────────────────────────────────────┘
```

- Simple greeting screen
- Single CTA button advances to next step

### Step 2: Invite Bot

```
┌─────────────────────────────────────┐
│  Invite the bot                     │
│                                     │
│  In a Slack channel you want        │
│  No Context to watch, type:         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ /invite @No Context           │  │
│  └───────────────────────────────┘  │
│                                     │
│  This allows the bot to see         │
│  messages in the channel. You can   │
│  always add more channels later     │
│  in Settings.                       │
│                                     │
│    [ I've Invited the Bot ]         │
└─────────────────────────────────────┘
```

- Instructional step — tells user to invite the bot in Slack
- This step comes **before** channel selection so the bot is a member of channels before we try to list them
- No server-side validation — user self-confirms

### Step 3: Connect Channel

```
┌─────────────────────────────────────┐
│  Connect a channel                  │
│                                     │
│  Select a channel where the bot     │
│  has been invited.                  │
│                                     │
│  [ # general                    ▼]  │
│                                     │
│       [ Connect Channel ]           │
│                                     │
│  --- or if no channels found ---    │
│                                     │
│  No channels found. Make sure       │
│  you've invited the bot to at       │
│  least one channel.                 │
│                                     │
│         [ ↻ Refresh ]               │
└─────────────────────────────────────┘
```

- Fetches real Slack channels from `GET /api/settings/slack-channels` (only channels where the bot is a member)
- Dropdown select — not a free-text input
- On submit, saves the channel via `POST /api/settings/channels` with `slackChannelId` and `channelName`
- Shows loading spinner while fetching
- Shows "Refresh" button if no channels are found (user may not have invited the bot yet)
- Shows error message if channel creation fails (e.g., channel limit reached)

### Step 4: Done

```
┌─────────────────────────────────────┐
│              ✓                       │
│                                     │
│       You're all set!               │
│                                     │
│  Start posting quotes and watch     │
│  the magic happen.                  │
│                                     │
│       [ Go to Dashboard ]           │
└─────────────────────────────────────┘
```

- Calls `POST /api/onboarding/complete` to set `workspace.onboardingCompleted = true`
- Redirects to `/dashboard` via `router.push`

---

## What Onboarding Does NOT Include

- **No style selection** — the default style is random; users can change it in Settings later
- **No plan selection** — all workspaces start on the FREE tier; upgrades happen in Settings > Billing

---

## Database

### Workspace model

```prisma
model Workspace {
  ...
  onboardingCompleted Boolean @default(false)
  ...
}
```

- New workspaces default to `onboardingCompleted: false`
- Set to `true` when user completes the wizard via `POST /api/onboarding/complete`

---

## API Endpoints

### `POST /api/onboarding/complete`

Marks the workspace as having completed onboarding.

- **Auth**: Requires authenticated session with `workspaceId`
- **Action**: Updates `workspace.onboardingCompleted = true`
- **Response**: `{ ok: true }`

### Reused endpoints

- `GET /api/settings/slack-channels` — lists Slack channels where bot is a member
- `POST /api/settings/channels` — creates a channel record in the database

---

## Route Guards

### Dashboard layout (`(dashboard)/layout.tsx`)

1. Check auth — redirect to `/signin` if not authenticated
2. Check `workspaceId` — redirect to `/onboarding` if missing
3. Query `workspace.onboardingCompleted` from DB — redirect to `/onboarding` if `false`

### Onboarding layout (`(onboarding)/layout.tsx`)

1. Check auth — redirect to `/signin` if not authenticated
2. If `workspaceId` exists, query `workspace.onboardingCompleted` — redirect to `/dashboard` if `true`

---

## UI Details

- **Progress bar**: 4 segments at the top of the card, filled purple up to the current step
- **Layout**: Centered vertically and horizontally, max-width `lg` (32rem), white card on `#fafaf8` background
- **Loading states**: Spinner icon (`Loader2`) on buttons during async operations
- **Error states**: Red text below the relevant form element
- **Components**: Uses `Card`, `CardContent`, `Button` from shadcn/ui

---

## Tech Notes

- Client component (`"use client"`) for interactive step navigation
- No external state management — local `useState` for step index, channel selection, loading, and errors
- Channel list fetched via `useEffect` when step 2 (Connect Channel) becomes active
- Onboarding completion triggers a full page navigation (`router.push`) to pick up fresh server-side session data
