import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySlackSignature } from "@/lib/slack";
import { log } from "@/lib/logger";

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
    log.warn("Slack interactions: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the payload (Slack sends interactions as form-encoded with a JSON payload field)
  const params = new URLSearchParams(body);
  const payloadStr = params.get("payload");

  if (!payloadStr) {
    log.debug("Slack interactions: no payload field in body");
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(payloadStr);

  log.info(
    `Slack interactions: received type=${payload.type} team=${payload.team?.id || "n/a"} user=${payload.user?.id || "n/a"}`,
  );
  log.debug("Slack interactions: full payload", payload);

  // Persist the raw event
  await prisma.slackEvent
    .create({
      data: {
        eventType: `interaction:${payload.type}`,
        teamId: payload.team?.id || null,
        channel: payload.channel?.id || null,
        userId: payload.user?.id || null,
        rawBody: body,
        endpoint: "/api/slack/interactions",
      },
    })
    .catch((err) =>
      log.error("Failed to persist slack interaction event", err),
    );

  // Handle different interaction types
  switch (payload.type) {
    case "block_actions":
      log.info(
        `Slack interactions: block_actions action_count=${payload.actions?.length || 0}`,
      );
      break;

    case "view_submission":
      log.info(
        `Slack interactions: view_submission callback_id=${payload.view?.callback_id || "n/a"}`,
      );
      break;

    default:
      log.debug(`Slack interactions: unhandled type=${payload.type}`);
      break;
  }

  return NextResponse.json({ ok: true });
}
