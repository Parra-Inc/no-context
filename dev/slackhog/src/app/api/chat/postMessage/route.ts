import { NextRequest, NextResponse } from "next/server";
import { queries } from "@/lib/db";
import {
  generateTimestamp,
  verifyToken,
  getOrCreateUser,
  getMessageWithDetails,
} from "@/lib/utils";
import { broadcast } from "@/lib/websocket";
import type { SlackResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    // Verify token
    const authHeader = req.headers.get("authorization");
    if (!verifyToken(authHeader)) {
      return NextResponse.json<SlackResponse>(
        { ok: false, error: "invalid_auth" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { channel, text, thread_ts, user, attachments } = body;

    // Validate required fields
    if (!channel || !text) {
      return NextResponse.json<SlackResponse>(
        { ok: false, error: "missing_required_fields" },
        { status: 400 },
      );
    }

    // Ensure channel exists (auto-create if not)
    let channelRecord = queries.getChannel.get(channel);
    if (!channelRecord) {
      queries.createChannel.run(
        channel,
        channel.replace(/^C/, "#"),
        "",
        0,
        Date.now(),
      );
    }

    // Get or create user
    const userId = user || "U000000001";
    const userName = body.username || "Unknown User";
    getOrCreateUser(userId, userName);

    // Generate timestamp for message
    const ts = generateTimestamp();
    const now = Date.now();

    // Insert message
    queries.createMessage.run(
      ts,
      channel,
      userId,
      text,
      thread_ts || null,
      now,
    );

    // If this is a thread reply, increment parent reply count
    if (thread_ts) {
      queries.incrementReplyCount.run(thread_ts);
    }

    // Handle attachments
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        queries.createAttachment.run(
          ts,
          attachment.title || null,
          attachment.text || null,
          attachment.image_url || null,
          attachment.fallback || text,
          now,
        );
      }
    }

    // Get full message details
    const messageDetails = getMessageWithDetails(ts);

    // Broadcast to WebSocket clients
    broadcast({
      type: "message.new",
      channel,
      message: messageDetails,
    });

    console.log(
      `Message posted: channel=${channel}, ts=${ts}, thread=${thread_ts || "none"}`,
    );

    return NextResponse.json<SlackResponse>({
      ok: true,
      channel,
      ts,
      message: {
        text,
        user: userId,
        ts,
        thread_ts: thread_ts || undefined,
      },
    });
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json<SlackResponse>(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
