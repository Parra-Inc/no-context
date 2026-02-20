import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function getDb() {
  if (db) return db;

  const dbDir = path.join(process.cwd(), "data");
  const dbPath = path.join(dbDir, "slackhog.db");

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma("journal_mode = WAL");

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      topic TEXT DEFAULT '',
      is_private INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      real_name TEXT,
      avatar_url TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      ts TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      thread_ts TEXT,
      reply_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_ts TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_ts) REFERENCES messages(ts),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(message_ts, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_ts TEXT NOT NULL,
      title TEXT,
      text TEXT,
      image_url TEXT,
      fallback TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_ts) REFERENCES messages(ts)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_ts);
    CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_ts);
    CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_ts);
  `);

  // Create default channel if it doesn't exist
  const defaultChannel = db
    .prepare("SELECT id FROM channels WHERE id = ?")
    .get("C000000001");

  if (!defaultChannel) {
    db.prepare(
      "INSERT INTO channels (id, name, topic, created_at) VALUES (?, ?, ?, ?)",
    ).run("C000000001", "general", "General discussion", Date.now());
  }

  return db;
}

export { getDb as db };

// Helper functions
export const queries = {
  // Channels
  get getChannels() {
    return getDb().prepare("SELECT * FROM channels ORDER BY name");
  },
  get getChannel() {
    return getDb().prepare("SELECT * FROM channels WHERE id = ?");
  },
  get createChannel() {
    return getDb().prepare(
      "INSERT INTO channels (id, name, topic, is_private, created_at) VALUES (?, ?, ?, ?, ?)",
    );
  },

  // Users
  get getUser() {
    return getDb().prepare("SELECT * FROM users WHERE id = ?");
  },
  get createUser() {
    return getDb().prepare(
      "INSERT OR REPLACE INTO users (id, name, real_name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)",
    );
  },

  // Messages
  get getMessages() {
    return getDb().prepare(
      "SELECT * FROM messages WHERE channel_id = ? AND thread_ts IS NULL ORDER BY created_at ASC",
    );
  },
  get getThreadMessages() {
    return getDb().prepare(
      "SELECT * FROM messages WHERE thread_ts = ? ORDER BY created_at ASC",
    );
  },
  get getMessage() {
    return getDb().prepare("SELECT * FROM messages WHERE ts = ?");
  },
  get createMessage() {
    return getDb().prepare(
      "INSERT INTO messages (ts, channel_id, user_id, text, thread_ts, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
  },
  get updateMessage() {
    return getDb().prepare("UPDATE messages SET text = ? WHERE ts = ?");
  },
  get deleteMessage() {
    return getDb().prepare("DELETE FROM messages WHERE ts = ?");
  },
  get incrementReplyCount() {
    return getDb().prepare(
      "UPDATE messages SET reply_count = reply_count + 1 WHERE ts = ?",
    );
  },

  // Reactions
  get getReactions() {
    return getDb().prepare("SELECT * FROM reactions WHERE message_ts = ?");
  },
  get addReaction() {
    return getDb().prepare(
      "INSERT OR IGNORE INTO reactions (message_ts, user_id, emoji, created_at) VALUES (?, ?, ?, ?)",
    );
  },
  get removeReaction() {
    return getDb().prepare(
      "DELETE FROM reactions WHERE message_ts = ? AND user_id = ? AND emoji = ?",
    );
  },

  // Attachments
  get getAttachments() {
    return getDb().prepare("SELECT * FROM attachments WHERE message_ts = ?");
  },
  get createAttachment() {
    return getDb().prepare(
      "INSERT INTO attachments (message_ts, title, text, image_url, fallback, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
  },
};
