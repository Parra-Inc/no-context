# No Context - Vercel Setup Guide

## Prerequisites

- A [Vercel](https://vercel.com) account
- The No Context GitHub repository connected to Vercel
- A Vercel Pro plan (recommended for 60s function timeout)

---

## 1. Create a Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `no-context` GitHub repository
3. Framework preset will auto-detect **Next.js**
4. Click **Deploy** (the first deploy will likely fail until environment variables are configured)

---

## 2. Enable Vercel Blob Storage

Vercel Blob is used to store generated quote images.

1. Go to your project in the Vercel dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** and select **Blob**
4. Name it (e.g., `nocontext-images`)
5. Click **Create**
6. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your project's environment variables

### Local Development

For local development, copy the `BLOB_READ_WRITE_TOKEN` from the Vercel dashboard:

1. Go to **Storage** > your Blob store > **Settings**
2. Copy the read-write token
3. Add it to your `.env.local`:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```

Alternatively, use the Vercel CLI to pull environment variables:

```bash
vercel env pull .env.local
```

---

## 3. Environment Variables

Configure the following in **Settings** > **Environment Variables**:

| Variable                             | Description                                            |
| ------------------------------------ | ------------------------------------------------------ |
| `DATABASE_URL`                       | PostgreSQL connection string (e.g., from Neon)         |
| `REDIS_URL`                          | Redis connection string (e.g., from Upstash)           |
| `NEXTAUTH_URL`                       | Your production URL (e.g., `https://nocontextbot.com`) |
| `NEXTAUTH_SECRET`                    | Random secret for NextAuth session encryption          |
| `SLACK_CLIENT_ID`                    | From Slack app settings                                |
| `SLACK_CLIENT_SECRET`                | From Slack app settings                                |
| `SLACK_SIGNING_SECRET`               | From Slack app settings                                |
| `SLACK_APP_ID`                       | From Slack app settings                                |
| `ANTHROPIC_API_KEY`                  | Anthropic API key for Claude (quote detection)         |
| `OPENAI_API_KEY`                     | OpenAI API key for DALL-E (image generation)           |
| `STRIPE_SECRET_KEY`                  | Stripe secret key                                      |
| `STRIPE_PUBLISHABLE_KEY`             | Stripe publishable key                                 |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side)                   |
| `NEXT_PUBLIC_APP_URL`                | Your production URL                                    |
| `TOKEN_ENCRYPTION_KEY`               | 64-character hex string for Slack token encryption     |
| `BLOB_READ_WRITE_TOKEN`              | Auto-added when Blob Storage is connected              |

Stripe price IDs (`STRIPE_PRICE_*`) must also be configured per your Stripe product setup.

---

## 4. Database Setup

1. Create a PostgreSQL database (recommended: [Neon](https://neon.tech))
2. Add the `DATABASE_URL` to Vercel environment variables
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## 5. Deployment Checklist

- [ ] GitHub repo connected to Vercel
- [ ] Blob Storage created and connected
- [ ] All environment variables configured
- [ ] Database migrated (`prisma migrate deploy`)
- [ ] Slack app URLs updated to production domain:
  - Event Subscriptions URL: `https://your-domain.com/api/slack/events`
  - Slash Command URL: `https://your-domain.com/api/slack/commands`
  - Interactivity URL: `https://your-domain.com/api/slack/interactions`
  - OAuth Redirect URL: `https://your-domain.com/api/slack/callback`
- [ ] Stripe webhook endpoint configured for production URL
- [ ] Test a full flow: post a quote in Slack, verify image appears in thread and gallery
