# No Context - Database Schema Spec

## Overview

PostgreSQL with Prisma ORM. Docker Compose for local development.

---

## Models

### Workspace

Represents a Slack workspace that has installed the app.

```prisma
model Workspace {
  id                String   @id @default(cuid())
  slackTeamId       String   @unique
  slackTeamName     String
  slackTeamIcon     String?  // URL to workspace icon
  slackBotToken     String   // encrypted at rest
  slackBotUserId    String   // bot's own user ID (to filter self-messages)
  installedByUserId String   // Slack user ID of installer
  isActive          Boolean  @default(true)
  defaultStyleId    String   @default("watercolor")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  channels      Channel[]
  subscription  Subscription?
  quotes        Quote[]
  customStyles  CustomStyle[]
}
```

### Subscription

Stripe subscription linked to a workspace.

```prisma
model Subscription {
  id                     String             @id @default(cuid())
  workspaceId            String             @unique
  workspace              Workspace          @relation(fields: [workspaceId], references: [id])
  stripeCustomerId       String             @unique
  stripeSubscriptionId   String?            @unique
  stripePriceId          String?
  tier                   SubscriptionTier   @default(FREE)
  status                 SubscriptionStatus @default(ACTIVE)
  monthlyQuota           Int                @default(3)
  currentPeriodStart     DateTime?
  currentPeriodEnd       DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  trialEndsAt            DateTime?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
}

enum SubscriptionTier {
  FREE
  STARTER
  TEAM
  BUSINESS
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  UNPAID
}
```

### Channel

A connected Slack channel being monitored.

```prisma
model Channel {
  id             String        @id @default(cuid())
  workspaceId    String
  workspace      Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  slackChannelId String
  channelName    String
  isActive       Boolean       @default(true)
  isPaused       Boolean       @default(false)
  styleId        String?       // per-channel style override, null = use workspace default
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  quotes Quote[]

  @@unique([workspaceId, slackChannelId])
}
```

### Quote

A detected quote and its generated image.

```prisma
model Quote {
  id              String      @id @default(cuid())
  workspaceId     String
  workspace       Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  channelId       String
  channel         Channel     @relation(fields: [channelId], references: [id], onDelete: Cascade)
  slackMessageTs  String      // Slack message timestamp (unique ID)
  slackUserId     String      // who posted the quote
  slackUserName   String      // display name at time of posting
  quoteText       String      // the extracted quote text
  attributedTo    String?     // who the quote is attributed to, if detected
  styleId         String      // art style used
  imageUrl        String?     // URL to generated image (S3/R2)
  imagePrompt     String?     // the full prompt sent to image generation
  status          QuoteStatus @default(PENDING)
  aiConfidence    Float?      // quote detection confidence score
  processingError String?     // error message if generation failed
  isFavorited     Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([workspaceId, slackMessageTs])
  @@index([workspaceId, createdAt])
  @@index([workspaceId, status])
}

enum QuoteStatus {
  PENDING      // detected, waiting for image generation
  PROCESSING   // image generation in progress
  COMPLETED    // image generated and posted
  FAILED       // image generation failed
  SKIPPED      // quota exceeded or other skip reason
}
```

### CustomStyle

User-defined art styles (Team+ tiers).

```prisma
model CustomStyle {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name        String
  description String    // the style prompt (max 200 chars)
  createdBy   String    // Slack user ID
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([workspaceId, name])
}
```

### UsageRecord

Monthly usage tracking for quota enforcement.

```prisma
model UsageRecord {
  id          String   @id @default(cuid())
  workspaceId String
  periodStart DateTime // first day of the billing month
  periodEnd   DateTime // last day of the billing month
  quotesUsed  Int      @default(0)
  quotaLimit  Int      // snapshot of the quota at period start
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([workspaceId, periodStart])
  @@index([workspaceId, periodStart])
}
```

---

## Docker Compose (Local Dev)

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: nocontext
      POSTGRES_PASSWORD: nocontext
      POSTGRES_DB: nocontext
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Key Indexes & Constraints

- `Workspace.slackTeamId` — unique, fast lookup on every Slack event
- `Quote(workspaceId, slackMessageTs)` — unique, prevents duplicate processing
- `Quote(workspaceId, createdAt)` — gallery pagination
- `UsageRecord(workspaceId, periodStart)` — unique, fast quota checks
- `Channel(workspaceId, slackChannelId)` — unique, channel lookup

## Encryption

- `Workspace.slackBotToken` must be encrypted at rest
- Use application-level encryption (e.g., AES-256-GCM) with a key from environment variables
- Never log or expose tokens in error messages

## Migrations Strategy

- Use Prisma Migrate for schema changes
- All migrations committed to version control
- Production migrations run via CI/CD pipeline
