# Testing Setup Guide

## Overview

Both databases have been seeded with test data to help you test the integration between your main app and slackhog.

## Seeded Data

### PostgreSQL Database (Main App)

**Test User:**

- Email: `test@example.com`
- Slack ID: `U001`

**Workspace:**

- Name: Dev Test Workspace
- Slack Team ID: `T001DEV`
- Bot Token: `xoxb-test-token`
- Bot User ID: `UBOT001`
- Subscription: TEAM tier (100 monthly quota, 10 max channels)

**Channels:**

- `#general` (C000000001)
- `#random` (C000000002)
- `#art-requests` (C000000003)
- `#dev-team` (C000000004)

**Art Styles:**

- 22 built-in styles (watercolor, picasso, van gogh, monet, etc.)

### Slackhog Database (SQLite)

**Users:**

- Alice Johnson (@alice, U001)
- Bob Smith (@bob, U002)
- Charlie Davis (@charlie, U003)
- No Context Bot (@no-context-bot, UBOT001)

**Channels:**

- `#general` - General discussion
- `#random` - Random chatter and off-topic discussions
- `#art-requests` - Request and share AI-generated artwork
- `#dev-team` - Private channel for the development team (private)

**Messages:**

- 9 test messages distributed across channels
- Realistic conversation flow for testing

## URLs

- **Main App**: http://localhost:3000
- **Slackhog GUI**: http://localhost:9002
- **MailHog**: http://localhost:8026
- **Database (PostgreSQL)**: `localhost:5433`

## How to Re-seed

### Main Database

```bash
pnpm prisma db seed
```

### Slackhog Database

Option 1 - Via API (preferred):

```bash
curl -X POST http://localhost:9002/api/seed
```

Option 2 - Via Docker:

```bash
docker exec no-context-bot-slackhog-1 sh -c "cd /app && node -e 'require(\"./server.js\")'"
```

### Seed Both Databases

```bash
./scripts/seed-all.sh
```

## Testing Integration

1. **Start the main app**: `pnpm dev`
2. **Open slackhog**: http://localhost:9002
3. **Test message flow**:
   - Send a message via slackhog GUI
   - Watch your main app receive it via webhook
   - Generate an image
   - See it posted back to slackhog

## Database Alignment

The channel IDs and team IDs are aligned between both databases:

| Channel      | ID         | Description                 |
| ------------ | ---------- | --------------------------- |
| general      | C000000001 | Main discussion channel     |
| random       | C000000002 | Off-topic conversations     |
| art-requests | C000000003 | AI art generation requests  |
| dev-team     | C000000004 | Private development channel |

**Workspace:**

- Slack Team ID: `T001DEV`
- Bot Token: `xoxb-test-token`
- Bot User ID: `UBOT001`

## Troubleshooting

**Slackhog not showing messages?**

```bash
curl http://localhost:9002/api/messages/C000000001
```

**Need to reset everything?**

```bash
# Stop containers
docker-compose down

# Reset PostgreSQL
pnpm prisma db push --force-reset

# Restart and reseed
docker-compose up -d
pnpm prisma db seed
curl -X POST http://localhost:9002/api/seed
```

**Check container health:**

```bash
docker ps
docker logs no-context-bot-slackhog-1
```
