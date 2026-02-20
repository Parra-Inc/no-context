import { NextRequest, NextResponse } from "next/server";
import { queries } from "@/lib/db";
import { verifyToken } from "@/lib/utils";
import { broadcast } from "@/lib/websocket";
import type { SlackResponse, Message } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!verifyToken(authHeader)) {
      return NextResponse.json<SlackResponse>(
        { ok: false, error: "invalid_auth" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { channel, timestamp, name, user } = body;

    if (!channel || !timestamp || !name) {
      return NextResponse.json<SlackResponse>(
        { ok: false, error: "missing_required_fields" },
        { status: 400 },
      );
    }

    const userId = user || "U000000001";

    // Add reaction (INSERT OR IGNORE prevents duplicates)
    queries.addReaction.run(timestamp, userId, name, Date.now());

    // Broadcast to WebSocket clients
    broadcast({
      type: "reaction.added",
      channel,
      ts: timestamp,
      reaction: name,
      user: userId,
    });

    console.log(`Reaction added: ${name} to ${timestamp} by ${userId}`);

    return NextResponse.json<SlackResponse>({ ok: true });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json<SlackResponse>(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
