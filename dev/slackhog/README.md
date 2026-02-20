# Slackhog 🐗

A lightweight Slack API simulator for local development. View webhook messages in real-time with a Slack-like UI.

## Features

- ✅ Slack-compatible API endpoints
- ✅ Real-time message updates via WebSocket
- ✅ SQLite persistence (survives restarts)
- ✅ Message reactions and threads
- ✅ Image attachments
- ✅ Shareable message URLs
- ✅ Docker Compose integration

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start Slackhog:**

   ```bash
   docker-compose up -d slackhog
   ```

2. **Open the UI:**
   Navigate to [http://localhost:9002](http://localhost:9002)

3. **Send a test message:**

   ```bash
   curl -X POST http://localhost:9002/api/chat/postMessage \
     -H "Authorization: Bearer xoxb-test-token" \
     -H "Content-Type: application/json" \
     -d '{
       "channel": "C000000001",
       "text": "Hello from Slackhog! 👋",
       "user": "U123456",
       "username": "Test User"
     }'
   ```

4. **Watch the message appear in real-time!**

### Local Development

1. **Install dependencies:**

   ```bash
   cd dev/slackhog
   pnpm install
   ```

2. **Start the dev server:**

   ```bash
   pnpm dev
   ```

3. **Open [http://localhost:9002](http://localhost:9002)**

## API Endpoints

### POST /api/chat/postMessage

Send a message to a channel.

**Headers:**

- `Authorization: Bearer xoxb-test-token`

**Body:**

```json
{
  "channel": "C000000001",
  "text": "Your message here",
  "user": "U123456",
  "username": "Display Name",
  "thread_ts": "1234567890.123456", // Optional: for thread replies
  "attachments": [
    // Optional
    {
      "title": "Attachment Title",
      "text": "Attachment text",
      "image_url": "https://example.com/image.png",
      "fallback": "Fallback text"
    }
  ]
}
```

### POST /api/reactions/add

Add a reaction to a message.

**Body:**

```json
{
  "channel": "C000000001",
  "timestamp": "1234567890.123456",
  "name": "thumbsup",
  "user": "U123456"
}
```

### POST /api/reactions/remove

Remove a reaction from a message.

**Body:**

```json
{
  "channel": "C000000001",
  "timestamp": "1234567890.123456",
  "name": "thumbsup",
  "user": "U123456"
}
```

### GET /api/messages/[channelId]

Get all messages in a channel.

### GET /api/channels

Get all channels.

## Environment Variables

```env
SLACK_BOT_TOKEN=xoxb-test-token
SLACK_SIGNING_SECRET=test_signing_secret
PORT=9002
```

## Message URLs

Every message has a shareable URL:

- Format: `http://localhost:9002/c/{channel_id}/p{ts_without_dot}`
- Example: `http://localhost:9002/c/C000000001/p1234567890123456`

Click the 🔗 icon next to any message to copy its URL.

## Data Persistence

Messages are stored in SQLite at `/app/data/slackhog.db` inside the container. This is mounted to a Docker volume, so data persists across restarts.

To reset the database:

```bash
docker-compose down
docker volume rm no-context_slackhog_data
docker-compose up -d slackhog
```

## WebSocket Events

The UI connects to `ws://localhost:9002/ws` for real-time updates.

**Client → Server:**

```json
{"type": "subscribe", "channel": "C000000001"}
{"type": "unsubscribe", "channel": "C000000001"}
```

**Server → Client:**

```json
{"type": "message.new", "channel": "C000000001", "message": {...}}
{"type": "reaction.added", "channel": "C000000001", "ts": "...", "reaction": "thumbsup", "user": "U123"}
{"type": "reaction.removed", "channel": "C000000001", "ts": "...", "reaction": "thumbsup", "user": "U123"}
```

## Integration with Your App

Point your Slack webhook URL to Slackhog:

```env
SLACK_WEBHOOK_URL=http://localhost:9002/api/chat/postMessage
SLACK_BOT_TOKEN=xoxb-test-token
```

Then send messages as you normally would:

```typescript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    channel: "C000000001",
    text: "Hello from my app!",
    user: "U123456",
    username: "My App",
  }),
});
```

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **better-sqlite3** (SQLite)
- **ws** (WebSocket)
- **react-markdown**

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

**WebSocket not connecting:**

- Check browser console for errors
- Ensure port 9002 is accessible
- Try refreshing the page

**Messages not appearing:**

- Check the authorization token matches
- Verify the API response is successful
- Check Docker logs: `docker-compose logs slackhog`

**Database issues:**

- Reset the database (see Data Persistence section above)
- Check volume permissions

## Roadmap

- [ ] Thread sidebar UI
- [ ] Multiple channels support
- [ ] DMs support
- [ ] Message search
- [ ] Export message history
- [ ] User profile customization

## License

MIT
