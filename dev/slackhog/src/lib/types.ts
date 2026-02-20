export interface Channel {
  id: string;
  name: string;
  topic: string;
  is_private: number;
  created_at: number;
}

export interface User {
  id: string;
  name: string;
  real_name?: string;
  avatar_url?: string;
  created_at: number;
}

export interface Message {
  ts: string;
  channel_id: string;
  user_id: string;
  text: string;
  thread_ts?: string | null;
  reply_count: number;
  created_at: number;
}

export interface Reaction {
  id: number;
  message_ts: string;
  user_id: string;
  emoji: string;
  created_at: number;
}

export interface Attachment {
  id: number;
  message_ts: string;
  title?: string | null;
  text?: string | null;
  image_url?: string | null;
  fallback: string;
  created_at: number;
}

export interface MessageWithDetails extends Message {
  user: User;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  attachments: Attachment[];
}

export interface SlackError {
  ok: false;
  error: string;
}

export interface SlackSuccess<T = any> {
  ok: true;
  [key: string]: any;
}

export type SlackResponse<T = any> = SlackSuccess<T> | SlackError;
