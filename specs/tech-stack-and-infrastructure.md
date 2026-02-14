# No Context - Tech Stack & Infrastructure Spec

## Tech Stack

| Layer             | Technology                            | Notes                                                  |
| ----------------- | ------------------------------------- | ------------------------------------------------------ |
| **Framework**     | Next.js 14+ (App Router)              | Single app serves marketing, dashboard, and API routes |
| **Language**      | TypeScript                            | Strict mode                                            |
| **Auth**          | NextAuth.js v5                        | Slack OAuth provider                                   |
| **Database**      | PostgreSQL 16                         | Via Docker locally, managed service in prod            |
| **ORM**           | Prisma                                | Schema-first, type-safe queries                        |
| **Styling**       | Tailwind CSS + shadcn/ui              | Utility-first with pre-built accessible components     |
| **Payments**      | Stripe                                | Checkout, Customer Portal, Webhooks                    |
| **AI - Text**     | Anthropic Claude API                  | Haiku for quote detection                              |
| **AI - Images**   | OpenAI DALL-E 3                       | Image generation (evaluate Replicate/SD later)         |
| **Image Storage** | Vercel Blob Storage                   | Built-in with Vercel, public CDN URLs                  |
| **Job Queue**     | BullMQ + Redis                        | Async image generation jobs                            |
| **Slack SDK**     | `@slack/web-api`, `@slack/events-api` | Official Slack SDKs                                    |
| **Hosting**       | Vercel                                | Next.js native hosting, edge functions                 |
| **Dev Tooling**   | Docker Compose                        | Postgres + Redis for local dev                         |

---

## Project Structure

```
no-context/
├── specs/                        # Product specs (this folder)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Marketing pages (public)
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/          # Dashboard pages (auth required)
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx      # Dashboard home
│   │   │   │   ├── gallery/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   ├── settings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── billing/
│   │   │   │   │   └── styles/
│   │   │   │   └── onboarding/
│   │   │   └── layout.tsx        # Dashboard layout with sidebar
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── slack/
│   │   │   │   ├── events/route.ts       # Slack Events API endpoint
│   │   │   │   ├── commands/route.ts     # Slash commands
│   │   │   │   ├── interactions/route.ts # Interactive components
│   │   │   │   ├── callback/route.ts     # OAuth install callback
│   │   │   │   └── install/route.ts      # Initiate OAuth install
│   │   │   ├── stripe/
│   │   │   │   └── webhook/route.ts      # Stripe webhook handler
│   │   │   └── quotes/
│   │   │       └── route.ts              # Gallery API (pagination, search)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── marketing/            # Marketing page components
│   │   ├── dashboard/            # Dashboard components
│   │   └── shared/               # Shared components
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # NextAuth config
│   │   ├── stripe.ts             # Stripe client + helpers
│   │   ├── slack.ts              # Slack client + helpers
│   │   ├── ai/
│   │   │   ├── quote-detector.ts # Claude quote classification
│   │   │   └── image-generator.ts# DALL-E image generation
│   │   ├── queue/
│   │   │   ├── worker.ts         # BullMQ worker for image generation
│   │   │   └── queue.ts          # Queue definition + job types
│   │   ├── storage.ts            # Vercel Blob upload helpers
│   │   ├── encryption.ts         # Token encryption/decryption
│   │   └── styles.ts             # Art style definitions
│   ├── hooks/                    # React hooks
│   └── types/                    # Shared TypeScript types
├── public/
│   ├── styles/                   # Art style preview images
│   └── marketing/                # Marketing assets
├── docker-compose.yml
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## API Routes Summary

| Route                       | Method          | Purpose                                              |
| --------------------------- | --------------- | ---------------------------------------------------- |
| `/api/auth/[...nextauth]`   | GET/POST        | NextAuth handlers                                    |
| `/api/slack/install`        | GET             | Redirect to Slack OAuth consent                      |
| `/api/slack/callback`       | GET             | Handle Slack OAuth callback, store tokens            |
| `/api/slack/events`         | POST            | Receive Slack events (messages, app_home, uninstall) |
| `/api/slack/commands`       | POST            | Handle `/nocontext` slash command                    |
| `/api/slack/interactions`   | POST            | Handle interactive components (modals, buttons)      |
| `/api/stripe/webhook`       | POST            | Handle Stripe webhook events                         |
| `/api/quotes`               | GET             | Paginated quote list for gallery (auth required)     |
| `/api/quotes/[id]`          | GET             | Single quote detail (auth required)                  |
| `/api/quotes/[id]/favorite` | POST            | Toggle favorite (auth required)                      |
| `/api/settings/channels`    | GET/POST/DELETE | Manage connected channels (auth required)            |
| `/api/settings/styles`      | GET/POST/DELETE | Manage custom styles (auth required)                 |

---

## Job Queue Architecture

The Slack event handler must respond within 3 seconds. Image generation takes 5-15 seconds. Solution: acknowledge the event immediately, enqueue a job, process asynchronously.

```
Slack Event → API Route → Validate + Detect Quote → Enqueue Job → Return 200

BullMQ Worker picks up job:
  1. Generate image (DALL-E)
  2. Upload to Vercel Blob
  3. Upload to Slack (files.uploadV2)
  4. Post thread reply
  5. Update database record
  6. Update emoji reactions
```

### Queue Config

- Concurrency: 5 workers
- Max retries: 1
- Job timeout: 60s
- Retention: completed jobs kept for 24h, failed jobs kept for 7d

### Vercel Consideration

Vercel serverless functions have a 60s timeout (Pro plan). The BullMQ worker needs a long-running process. Options:

1. **Vercel Cron + external worker**: Run the worker as a separate service (e.g., Railway, Fly.io)
2. **Inngest or Trigger.dev**: Serverless job queues designed for Vercel
3. **Simple approach**: Use Vercel's `waitUntil` for background processing (works for jobs under 60s)

**Recommendation**: Start with `waitUntil` for simplicity. If jobs regularly exceed 60s or need more reliability, migrate to Inngest or a standalone worker.

---

## Deployment

### Vercel (Primary)

- Connect GitHub repo
- Auto-deploy on push to `main`
- Environment variables configured in Vercel dashboard
- Preview deployments on PRs

### Database (Production)

Options (pick one):

- **Neon** — Serverless Postgres, generous free tier, good Prisma integration
- **Supabase** — Postgres + extras, free tier
- **Railway** — Simple managed Postgres

**Recommendation**: Neon for serverless compatibility with Vercel.

### Redis (Production)

- **Upstash** — Serverless Redis, pay-per-request, works well with Vercel
- Alternative: Railway Redis

### Image Storage

- **Vercel Blob Storage** — Built-in with Vercel, no extra accounts needed
- Public access with automatic CDN URLs
- Simple API via `@vercel/blob` package

---

## Environment Variables (Production)

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.nocontextbot.com

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_APP_ID=

# Auth
NEXTAUTH_URL=https://app.nocontextbot.com
NEXTAUTH_SECRET=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=

# Encryption
TOKEN_ENCRYPTION_KEY=
```

---

## Monitoring & Observability

- **Vercel Analytics** — Web vitals and performance
- **Sentry** — Error tracking (Next.js SDK)
- **Stripe Dashboard** — Payment monitoring
- **Slack App Metrics** — Available in Slack developer dashboard
- **Custom**: Log quote detection results, image generation times, and failure rates to a simple analytics table or external service (PostHog, Mixpanel)
