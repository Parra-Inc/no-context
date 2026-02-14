import { NextRequest, NextResponse } from "next/server";
import { verifySlackSignature } from "@/lib/slack";

export async function POST(request: NextRequest) {
  const body = await request.text();

  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  if (
    !verifySlackSignature(
      process.env.SLACK_SIGNING_SECRET!,
      body,
      timestamp,
      signature,
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the payload (Slack sends interactions as form-encoded with a JSON payload field)
  const params = new URLSearchParams(body);
  const payloadStr = params.get("payload");

  if (!payloadStr) {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(payloadStr);

  // Handle different interaction types
  switch (payload.type) {
    case "block_actions":
      // Handle button clicks, menu selections, etc.
      break;

    case "view_submission":
      // Handle modal form submissions
      break;

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
