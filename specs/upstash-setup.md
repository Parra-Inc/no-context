# Upstash Setup Guide

This project uses **Upstash QStash** for async job queuing and **Upstash Redis** for caching (planned).

---

## 1. Create an Upstash Account

Sign up at [console.upstash.com](https://console.upstash.com).

---

## 2. Redis Database

### Create the Database

1. Go to **Redis** in the Upstash console
2. Click **Create Database**
3. Name: `no-context` (or your preferred name)
4. Region: Choose the region closest to your Vercel deployment (e.g., `us-east-1`)
5. Type: **Regional** (single-region is fine for most use cases)
6. Enable **TLS** (default)
7. Click **Create**

### Get the Credentials

On the database details page, find:

| Env Variable               | Where to Find                                     |
| -------------------------- | ------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | **REST API** section → `UPSTASH_REDIS_REST_URL`   |
| `UPSTASH_REDIS_REST_TOKEN` | **REST API** section → `UPSTASH_REDIS_REST_TOKEN` |

### Add to Environment

```env
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## 3. QStash

### Enable QStash

1. Go to **QStash** in the Upstash console
2. QStash is automatically available on your account — no separate creation needed

### Get the Credentials

On the QStash dashboard, find these values:

| Env Variable                 | Where to Find                                                             |
| ---------------------------- | ------------------------------------------------------------------------- |
| `QSTASH_URL`                 | Usually `https://qstash.upstash.io/v2/publish/` (default, rarely changed) |
| `QSTASH_TOKEN`               | **Request** tab → **QSTASH_TOKEN**                                        |
| `QSTASH_CURRENT_SIGNING_KEY` | **Signing Keys** tab → **Current Signing Key**                            |
| `QSTASH_NEXT_SIGNING_KEY`    | **Signing Keys** tab → **Next Signing Key**                               |

### Add to Environment

```env
QSTASH_URL=https://qstash.upstash.io/v2/publish/
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=sig_your-current-key
QSTASH_NEXT_SIGNING_KEY=sig_your-next-key
```

### Signing Keys Explained

QStash sends requests to your webhook endpoints and signs them so you can verify authenticity. The two signing keys support key rotation:

- **Current Signing Key** — Used to sign all outgoing requests
- **Next Signing Key** — Will become the current key on the next rotation

Both keys are needed because `verifySignatureAppRouter` from `@upstash/qstash/nextjs` checks against both to allow seamless rotation.

---

## 4. How QStash Is Used in This Project

QStash acts as an async job queue for image generation:

1. A Slack event triggers quote detection
2. The app enqueues an image generation job via `qstash.publishJSON()`
3. QStash delivers the job to `/api/queue/image-generation`
4. The handler verifies the QStash signature, then processes the job

**Key configuration in the publish call:**

- **Retries:** 2 attempts on failure (HTTP 500)
- **Deduplication:** Uses `img-gen-{imageGenerationId}` to prevent duplicate jobs
- **Target URL:** `{NEXT_PUBLIC_APP_URL}/api/queue/image-generation`

---

## 5. Local Development

QStash needs a publicly accessible URL to deliver messages. For local development you have two options:

### Option A: Use a tunnel (ngrok, Cloudflare Tunnel, etc.)

1. Start your dev server: `npm run dev`
2. Start a tunnel: `ngrok http 3000`
3. Set `NEXT_PUBLIC_APP_URL` to the tunnel URL in `.env`
4. QStash will deliver jobs to your local machine through the tunnel

### Option B: Skip QStash locally

Call the image generation handler directly during development instead of going through QStash. The QStash signature verification will fail locally unless you have a tunnel and valid signing keys configured.

---

## 6. Vercel / Production Setup

Add all six environment variables to your Vercel project:

```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
NEXT_PUBLIC_APP_URL        ← must be your production URL (e.g., https://your-app.vercel.app)
```

`QSTASH_URL` is typically only needed if you override the default endpoint.

---

## 7. Full Environment Variable Summary

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Upstash QStash
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=sig_current-key
QSTASH_NEXT_SIGNING_KEY=sig_next-key

# App URL (used by QStash to deliver jobs)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
