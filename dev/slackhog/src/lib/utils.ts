import { queries } from "./db";
import type {
  Message,
  User,
  Reaction,
  Attachment,
  MessageWithDetails,
} from "./types";

export function generateTimestamp(): string {
  const now = Date.now();
  const seconds = Math.floor(now / 1000);
  const microseconds = (now % 1000) * 1000;
  return `${seconds}.${microseconds.toString().padStart(6, "0")}`;
}

export function verifyToken(authHeader: string | null): boolean {
  if (!authHeader) return false;

  const expectedToken = process.env.SLACK_BOT_TOKEN || "xoxb-test-token";

  // Support both "Bearer token" and "token" formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === expectedToken;
}

export function getOrCreateUser(userId: string, userName?: string): User {
  let user = queries.getUser.get(userId) as User | undefined;

  if (!user) {
    const name = userName || `User ${userId}`;
    queries.createUser.run(userId, name, name, null, Date.now());
    user = queries.getUser.get(userId) as User;
  }

  return user;
}

export function getMessageWithDetails(ts: string): MessageWithDetails | null {
  const message = queries.getMessage.get(ts) as Message | undefined;
  if (!message) return null;

  const user = queries.getUser.get(message.user_id) as User;
  const reactions = queries.getReactions.all(ts) as Reaction[];
  const attachments = queries.getAttachments.all(ts) as Attachment[];

  // Group reactions by emoji
  const reactionMap = new Map<string, { count: number; users: string[] }>();
  for (const reaction of reactions) {
    if (!reactionMap.has(reaction.emoji)) {
      reactionMap.set(reaction.emoji, { count: 0, users: [] });
    }
    const entry = reactionMap.get(reaction.emoji)!;
    entry.count++;
    entry.users.push(reaction.user_id);
  }

  const groupedReactions = Array.from(reactionMap.entries()).map(
    ([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
    }),
  );

  return {
    ...message,
    user,
    reactions: groupedReactions,
    attachments,
  };
}

export function getChannelMessages(channelId: string): MessageWithDetails[] {
  const messages = queries.getMessages.all(channelId) as Message[];
  return messages
    .map((msg) => getMessageWithDetails(msg.ts))
    .filter((msg): msg is MessageWithDetails => msg !== null);
}

export function getThreadMessages(threadTs: string): MessageWithDetails[] {
  const messages = queries.getThreadMessages.all(threadTs) as Message[];
  return messages
    .map((msg) => getMessageWithDetails(msg.ts))
    .filter((msg): msg is MessageWithDetails => msg !== null);
}
