import { NextRequest, NextResponse } from "next/server";
import { getChannelMessages } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const messages = getChannelMessages(channelId);

    return NextResponse.json({
      ok: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
