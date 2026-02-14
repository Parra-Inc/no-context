# No Context - Dashboard Spec

## Overview

The dashboard is a Next.js web app where workspace admins manage their No Context installation. It is authenticated via NextAuth using the "Sign in with Slack" OAuth flow (reusing the same Slack OAuth credentials).

**URL structure**: `app.nocontextbot.com` (or similar)

---

## Authentication

- **NextAuth** with Slack provider
- On sign-in, match the user's Slack workspace to an existing `Workspace` record
- If no workspace exists, redirect to installation flow ("Add to Slack" first)
- Session stores: workspace ID, user Slack ID, user name, user avatar
- Only the workspace installer or Slack workspace admins can access billing settings
- All workspace members can view the gallery

---

## Pages

### 1. Dashboard Home (`/dashboard`)

The main overview page after login.

```
┌─────────────────────────────────────────────────┐
│  [Workspace Icon] Acme Corp                     │
│  Plan: Team · 42 / 100 images used this month   │
│  ████████████░░░░░░░░ 42%                       │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 42       │ │ 3        │ │ 127      │        │
│  │ This Mo  │ │ Channels │ │ All Time │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
│  Recent Quotes                    [View All →]   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ img │ │ img │ │ img │ │ img │              │
│  │     │ │     │ │     │ │     │              │
│  │"..." │ │"..." │ │"..." │ │"..." │              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                  │
│  Connected Channels                              │
│  ┌─────────────────────────────────────┐        │
│  │ # no-context    Active   Watercolor │ [⚙]   │
│  │ # random-quotes Paused   Picasso    │ [⚙]   │
│  │ # overheard     Active   Van Gogh   │ [⚙]   │
│  └─────────────────────────────────────┘        │
│  [+ Add Channel]                                 │
└─────────────────────────────────────────────────┘
```

**Components:**

- Workspace header with icon and name (from Slack API)
- Usage progress bar (current month)
- Stats cards: this month, connected channels, all-time total
- Recent quotes grid (last 8, clickable)
- Connected channels list with per-channel status, style, and settings

### 2. Gallery (`/dashboard/gallery`)

A masonry grid or uniform grid of all generated quote images.

```
┌─────────────────────────────────────────────────┐
│  Gallery                                         │
│                                                  │
│  [Search quotes...]  [Filter: All Channels ▼]   │
│                      [Filter: All Styles ▼]      │
│                      [Sort: Newest First ▼]      │
│                                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐      │
│  │       │ │       │ │       │ │       │      │
│  │  img  │ │  img  │ │  img  │ │  img  │      │
│  │       │ │       │ │       │ │       │      │
│  │"quote"│ │"quote"│ │"quote"│ │"quote"│      │
│  │— name │ │— name │ │— name │ │— name │      │
│  │ ♡  ⬇  │ │ ♡  ⬇  │ │ ♡  ⬇  │ │ ♡  ⬇  │      │
│  └───────┘ └───────┘ └───────┘ └───────┘      │
│                                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐      │
│  │  ...  │ │  ...  │ │  ...  │ │  ...  │      │
│  └───────┘ └───────┘ └───────┘ └───────┘      │
│                                                  │
│  [Load More]                                     │
└─────────────────────────────────────────────────┘
```

**Features:**

- Search by quote text
- Filter by channel, art style, date range
- Sort by newest, oldest, favorites
- Favorite toggle (heart icon)
- Download button (original resolution PNG)
- Click to expand: full-size image, quote text, attribution, date, channel, style used
- Infinite scroll or "Load More" pagination

### 3. Quote Detail Modal/Page (`/dashboard/gallery/[id]`)

Clicking a quote in the gallery opens a detail view.

```
┌─────────────────────────────────────────────────┐
│  [← Back to Gallery]                    [✕]     │
│                                                  │
│  ┌───────────────────────────────────┐          │
│  │                                   │          │
│  │         [Generated Image]         │          │
│  │                                   │          │
│  └───────────────────────────────────┘          │
│                                                  │
│  "I don't think that's how microwaves work"     │
│  — Sarah · #no-context · Feb 12, 2026           │
│                                                  │
│  Style: Van Gogh / Post-Impressionist           │
│                                                  │
│  [♡ Favorite]  [⬇ Download]  [🔗 Share Link]   │
└─────────────────────────────────────────────────┘
```

### 4. Settings (`/dashboard/settings`)

#### General Tab

- Workspace info (read-only, from Slack)
- Default art style selector (dropdown with style previews)
- Manage connected channels (add/remove, per-channel style override, pause/resume)

#### Art Styles Tab (Team+ only)

- List of built-in styles with preview thumbnails
- Custom styles section: create, edit, delete custom style prompts
- Preview: enter a sample quote and see a generated preview (costs 1 quota unit)

#### Billing Tab

- Current plan and usage
- Upgrade/downgrade buttons → Stripe Checkout or Customer Portal
- Billing history (invoices from Stripe)
- Cancel subscription option
- "Manage Billing" button → Stripe Customer Portal

### 5. Onboarding (`/dashboard/onboarding`)

Shown after first install, guides user through setup:

1. **Welcome** — "No Context is installed! Let's set it up."
2. **Connect a channel** — Select from list of workspace channels, or type channel name
3. **Invite the bot** — Instructions to `/invite @NoContext` in the channel, with a "Verify" button
4. **Choose a style** — Art style picker with preview images
5. **Choose a plan** — Tier selector (Free selected by default, "Start 14-day Team trial" CTA)
6. **Done** — Redirect to dashboard home

---

## Navigation

Sidebar navigation:

- **Dashboard** (home)
- **Gallery**
- **Settings**
  - General
  - Art Styles
  - Billing

Top bar:

- Workspace name + icon
- User avatar + name
- Sign out

---

## Responsive Design

- Dashboard is desktop-first but must work on tablet
- Gallery grid: 4 columns desktop, 2 columns tablet, 1 column mobile
- Sidebar collapses to hamburger on mobile

## Tech Notes

- All pages are server-side rendered where possible (Next.js App Router)
- Gallery uses client-side pagination with `useInfiniteQuery` (React Query / SWR)
- Images served via CDN (Vercel Blob Storage with public access)
- Tailwind CSS for all styling
- Shadcn/ui component library for consistent UI components
