import { NextResponse } from "next/server";
import { db, queries } from "@/lib/db";

const SEED_USERS = [
  {
    id: "U001",
    name: "alice",
    real_name: "Alice Johnson",
    avatar_url: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "U002",
    name: "bob",
    real_name: "Bob Smith",
    avatar_url: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "U003",
    name: "charlie",
    real_name: "Charlie Davis",
    avatar_url: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "UBOT001",
    name: "no-context-bot",
    real_name: "No Context Bot",
    avatar_url: "https://i.pravatar.cc/150?img=68",
  },
];

const SEED_CHANNELS = [
  {
    id: "C000000001",
    name: "general",
    topic: "General discussion",
    is_private: 0,
  },
  {
    id: "C000000002",
    name: "random",
    topic: "Random chatter and off-topic discussions",
    is_private: 0,
  },
  {
    id: "C000000003",
    name: "art-requests",
    topic: "Request and share AI-generated artwork",
    is_private: 0,
  },
  {
    id: "C000000004",
    name: "dev-team",
    topic: "Private channel for the development team",
    is_private: 1,
  },
];

const SEED_MESSAGES: Array<{
  channel_id: string;
  user_id: string;
  text: string;
}> = [];

export async function POST() {
  try {
    const database = db();
    const results = {
      users: 0,
      channels: 0,
      messages: 0,
      errors: [] as string[],
    };

    // Seed users
    for (const user of SEED_USERS) {
      try {
        queries.createUser.run(
          user.id,
          user.name,
          user.real_name,
          user.avatar_url,
          Date.now()
        );
        results.users++;
      } catch (error) {
        // User already exists, skip
      }
    }

    // Seed channels (skip general as it's already created by default)
    for (const channel of SEED_CHANNELS) {
      if (channel.id === "C000000001") continue; // Skip default channel
      try {
        queries.createChannel.run(
          channel.id,
          channel.name,
          channel.topic,
          channel.is_private,
          Date.now()
        );
        results.channels++;
      } catch (error) {
        // Channel already exists, skip
      }
    }

    // Seed messages
    for (const message of SEED_MESSAGES) {
      const ts = `${Date.now()}.${Math.random().toString(36).substring(7)}`;
      try {
        queries.createMessage.run(
          ts,
          message.channel_id,
          message.user_id,
          message.text,
          null,
          Date.now()
        );
        results.messages++;
      } catch (error: any) {
        results.errors.push(`Message error: ${error.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Database seeded successfully!",
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
