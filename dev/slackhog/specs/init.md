# Slackhog - Local Slack Development Simulator

## Overview

Slackhog is a lightweight Slack API simulator for local development. It mimics Slack's webhook API, supports real-time updates via WebSockets, and provides a web UI for visualizing messages, reactions, and threads.

## Goals

- **API Compatibility**: Support the subset of Slack API endpoints needed for app development
- **Webhook Testing**: Receive and display webhook messages sent from the main application
- **Real-time Updates**: Use WebSockets to show live message delivery, reactions, and thread replies
- **Visual Debugging**: Provide a Slack-like UI to see messages, attachments, and threads
- **Zero Config**: Run via Docker Compose with minimal setup

## Architecture

### Components

1. **Backend API Server** (Node.js/Express)
   - REST API endpoints (Slack-compatible)
   - WebSocket server for real-time updates
   - SQLite database for persistent storage

2. **Frontend UI** (React/Next.js)
   - Slack-like interface (read-only, no message sending)
   - WebSocket client for live updates
   - Shareable message URLs

3. **Docker Setup**
   - Single Dockerfile with multi-stage build
   - Exposed ports: 3001 (API), 9002 (UI)
   - Volume mount for SQLite database persistence

### Data Flow

```
App → POST /api/chat.postMessage → Slackhog API → SQLite → WebSocket Broadcast → UI Update
                                                      ↓
                                               Persisted Storage
```

## Slack API Endpoints to Implement

### Phase 1 - Core Messaging

- `POST /api/chat.postMessage` - Send a message to a channel
- `POST /api/reactions.add` - Add emoji reaction
- `POST /api/reactions.remove` - Remove emoji reaction
- `POST /api/chat.update` - Edit a message
- `POST /api/chat.delete` - Delete a message

### Phase 2 - Threads

- Thread replies (ts + thread_ts parameters)
- Thread reply counts and participants

### Phase 3 - Additional Features

- `POST /api/files.upload` - Image/file attachments
- `POST /api/conversations.list` - List channels
- `POST /api/conversations.create` - Create channel

### Request Validation

- Support token-based auth for API calls (Bearer token or bot token)
- Return Slack-compatible error responses

### Message URLs

Each message should have a shareable URL:

- Format: `http://localhost:9002/c/{channel_id}/p{ts_without_dot}`
- Example: `http://localhost:9002/c/C123456/p1234567890123456`
- Clicking URL navigates to channel and scrolls to message
- Thread messages: `http://localhost:9002/c/{channel_id}/p{thread_ts}/p{ts}`

## UI Layout

### Left Sidebar (240px)

- **Workspace Header**
  - Workspace name/icon
  - Status indicator (connected/disconnected)

- **Channels Section**
  - List of channels (# prefix)
  - Message count badges
  - Click to view channel

- **Direct Messages Section**
  - List of DMs (user icons)
  - Message count badges

### Main Window (flex)

- **Channel Header**
  - Channel name and topic
  - Message count
  - Copy channel URL button

- **Message List** (scrollable)
  - Message bubbles with:
    - User avatar and name
    - Timestamp (hoverable for full date)
    - Copy message URL button (on hover)
    - Message text (markdown support)
    - Attachments (images, files)
    - Reactions (emoji with counts)
    - Reply count + participants (if thread)

- **No Message Input** (read-only view)

### Right Sidebar (400px, conditional)

- **Thread View** (opens when clicking thread replies)
  - Parent message at top
  - Thread replies below
  - Copy thread URL button
  - Close button

## WebSocket Protocol

### Client → Server Events

```json
{
  "type": "subscribe",
  "channel": "C123456"
}
```

### Server → Client Events

```json
{
  "type": "message.new",
  "channel": "C123456",
  "message": { /* full message object */ }
}

{
  "type": "reaction.added",
  "channel": "C123456",
  "ts": "1234567890.123456",
  "reaction": "thumbsup",
  "user": "U123456"
}

{
  "type": "message.updated",
  "channel": "C123456",
  "message": { /* updated message */ }
}
```

## Data Models

### Channel

```typescript
interface Channel {
  id: string; // C123456
  name: string; // general
  topic: string;
  isPrivate: boolean;
  members: string[]; // user IDs
  created: number;
}
```

### Message

```typescript
interface Message {
  ts: string; // timestamp ID: "1234567890.123456"
  user: string; // U123456
  channel: string; // C123456
  text: string;
  thread_ts?: string; // parent message ts if in thread
  reply_count?: number;
  reply_users?: string[];
  reactions?: Reaction[];
  attachments?: Attachment[];
}
```

### Reaction

```typescript
interface Reaction {
  name: string; // emoji name: "thumbsup"
  users: string[]; // who reacted
  count: number;
}
```

### Attachment

```typescript
interface Attachment {
  title?: string;
  text?: string;
  image_url?: string;
  fallback: string;
}
```

## Environment Variables

The app should support standard Slack env vars:

```env
# App credentials
SLACK_CLIENT_ID=test_client_id
SLACK_CLIENT_SECRET=test_client_secret
SLACK_SIGNING_SECRET=test_signing_secret

# Bot token (for API calls from app)
SLACK_BOT_TOKEN=xoxb-test-token

# Webhook URL (points to slackhog)
SLACK_WEBHOOK_URL=http://localhost:3001/api/chat.postMessage

# App-level token
SLACK_APP_TOKEN=xapp-test-token
```

## Docker Compose Integration

```yaml
services:
  slackhog:
    build: ./dev/slackhog
    ports:
      - "3001:3001" # API
      - "9002:9002" # UI
    environment:
      - SLACK_BOT_TOKEN=xoxb-test-token
      - SLACK_SIGNING_SECRET=test_signing_secret
    volumes:
      - slackhog-data:/app/data # SQLite database persistence
      - ./dev/slackhog:/app # Source code (dev only)
      - /app/node_modules

volumes:
  slackhog-data:
```

## Tech Stack Recommendations

### Stack

- **Framework**: Next.js 15 (App Router)
  - API routes handle Slack endpoints
  - React 19 for UI components
  - Built-in WebSocket support via custom server
- **Styling**: Tailwind CSS 4
- **Database**: better-sqlite3 (synchronous, fast, file-based)
- **WebSocket**: ws library (custom Next.js server)
- **Markdown**: react-markdown
- **State**: React Context or Zustand for WebSocket state
- **Auth**: Simple token validation (Bearer or bot token)

### Build

- **Dockerfile**
  - Single stage: Next.js production build with custom server
  - Standalone output mode for optimized Docker image
  - SQLite database in mounted volume

## Implementation Phases

### Phase 1: Basic Infrastructure

- [ ] Dockerfile setup
- [ ] Express API server with basic routes
- [ ] WebSocket server
- [ ] Basic React UI with left sidebar + main window
- [ ] Docker Compose integration

### Phase 2: Core Features

- [ ] chat.postMessage endpoint with signature verification
- [ ] Message storage and retrieval
- [ ] WebSocket broadcast on new messages
- [ ] Display messages in UI with formatting
- [ ] Add reactions endpoint + UI

### Phase 3: Threads

- [ ] Thread reply support (thread_ts)
- [ ] Right sidebar for thread view
- [ ] Reply counts and participants
- [ ] WebSocket updates for thread messages

### Phase 4: Attachments & Polish

- [ ] Image attachment support
- [ ] File upload handling
- [ ] Message editing/deletion
- [ ] Markdown rendering
- [ ] Timestamp formatting
- [ ] User avatars and names

### Phase 5: Advanced Features

- [ ] Multiple channels/DMs
- [ ] Channel creation
- [ ] Message count badges
- [ ] Search
- [ ] Export message history

## Design Decisions

✅ **Persistence**: SQLite with Docker volume for data persistence across restarts
✅ **Auth**: Token-based validation only (no OAuth flow)
✅ **Message Flow**: Receive-only (no sending from Slackhog UI)
✅ **Message URLs**: Shareable URLs for every message and thread
✅ **Users**: Auto-create users from incoming messages (store user ID, name, avatar)
✅ **Attachments**: Store image URLs, download and cache in volume

## Success Criteria

✅ Main app sends message → appears in Slackhog UI in real-time
✅ Messages persist across container restarts
✅ Each message has a shareable URL
✅ Can add reactions → updates in real-time
✅ Can click reply count → opens thread sidebar
✅ Thread replies appear in sidebar in real-time
✅ Image attachments display in messages
✅ Token validation works with app's bot token
✅ Runs in Docker Compose alongside main app
✅ WebSocket reconnection on disconnect

---

## Next Steps

1. Review and refine this spec
2. Set up basic project structure
3. Implement Phase 1
4. Iterate and add features
