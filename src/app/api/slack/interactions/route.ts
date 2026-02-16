import { after, NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifySlackSignature,
  getSlackClient,
  addReaction,
  isSlackTokenError,
  markWorkspaceDisconnected,
} from "@/lib/slack";
import { enqueueImageGeneration } from "@/lib/queue/queue";
import { TIER_QUOTAS, TIER_PRIORITY } from "@/lib/stripe";
import { getEnabledStylesForChannel } from "@/lib/styles.server";
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
  log.debug("Slack interactions: full payload", JSON.stringify(payload));

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
    case "block_actions": {
      const actions = payload.actions || [];
      for (const action of actions) {
        if (action.action_id?.startsWith("style_select:")) {
          after(
            handleStyleSelection(payload, action).catch((err) =>
              log.error("Slack interactions: style selection error", err),
            ),
          );
        }
      }
      break;
    }

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

// ---------------------------------------------------------------------------
// Handle style selection from the retry style picker
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
async function handleStyleSelection(payload: any, action: any) {
  const quoteId = action.action_id.replace("style_select:", "");
  const selectedStyleName = action.selected_option?.value;

  if (!quoteId || !selectedStyleName) {
    log.warn("Slack interactions: style_select missing quoteId or style");
    return;
  }

  const teamId = payload.team?.id;
  const slackChannelId = payload.channel?.id;
  const pickerMessageTs = payload.message?.ts;
  const userId = payload.user?.id;

  log.info(
    `Slack interactions: style selected quote=${quoteId} style=${selectedStyleName} user=${userId}`,
  );

  // Look up workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
    include: { subscription: true },
  });

  if (!workspace || !workspace.isActive || workspace.needsReconnection) {
    return;
  }

  // Look up the quote
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { imageGenerations: true },
  });

  if (!quote) {
    log.warn(`Slack interactions: quote not found id=${quoteId}`);
    return;
  }

  // Look up channel record
  const channelRecord = await prisma.channel.findUnique({
    where: { id: quote.channelId },
  });

  if (!channelRecord) {
    return;
  }

  // Quota check
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usage = await prisma.usageRecord.findUnique({
    where: {
      workspaceId_periodStart: {
        workspaceId: workspace.id,
        periodStart,
      },
    },
  });

  const tier = workspace.subscription?.tier || "FREE";
  const quota = workspace.subscription?.monthlyQuota || TIER_QUOTAS.FREE;
  const used = usage?.quotesUsed || 0;

  const slackClient = getSlackClient(workspace.slackBotToken);

  if (used >= quota) {
    await slackClient.chat.postMessage({
      channel: slackChannelId,
      thread_ts: quote.slackMessageTs,
      text: "You've reached your monthly quota. Upgrade your plan to generate more images.",
    });
    return;
  }

  // Resolve the selected style from enabled styles
  const enabledStyles = await getEnabledStylesForChannel(
    channelRecord.id,
    workspace.id,
  );

  const selectedStyle = enabledStyles.find((s) => s.name === selectedStyleName);
  if (!selectedStyle) {
    log.warn(
      `Slack interactions: selected style not found name=${selectedStyleName}`,
    );
    return;
  }

  const styleId = selectedStyle.name;
  const customStyleDescription = selectedStyle.workspaceId
    ? selectedStyle.description
    : undefined;

  // Determine attempt number
  const maxAttempt = Math.max(
    ...quote.imageGenerations.map((ig) => ig.attemptNumber),
    0,
  );

  // Create ImageGeneration record
  const imageGeneration = await prisma.imageGeneration.create({
    data: {
      quoteId: quote.id,
      workspaceId: workspace.id,
      styleId,
      customStyleDescription,
      status: "PENDING",
      attemptNumber: maxAttempt + 1,
    },
  });

  // Update Quote status and styleId
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "PENDING",
      styleId,
    },
  });

  // Add processing reaction to the original message
  try {
    await addReaction(
      slackClient,
      slackChannelId,
      quote.slackMessageTs,
      "eyes",
    );
  } catch (error) {
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
  }

  // Update the picker message to show selection confirmation
  if (pickerMessageTs) {
    try {
      await slackClient.chat.update({
        channel: slackChannelId,
        ts: pickerMessageTs,
        text: `Generating image in ${selectedStyle.displayName} style...`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:hourglass_flowing_sand: Generating image in *${selectedStyle.displayName}* style...`,
            },
          },
        ],
      });
    } catch (error) {
      log.error("Slack interactions: failed to update picker message", error);
    }
  }

  // Enqueue generation
  try {
    const qstashMessageId = await enqueueImageGeneration({
      workspaceId: workspace.id,
      channelId: channelRecord.id,
      quoteId: quote.id,
      imageGenerationId: imageGeneration.id,
      messageTs: quote.slackMessageTs,
      slackChannelId,
      quoteText: quote.quoteText,
      styleId,
      customStyleDescription,
      encryptedBotToken: workspace.slackBotToken,
      postToSlackChannelId: channelRecord.postToChannelId || undefined,
      quoteOriginal: channelRecord.quoteOriginal || undefined,
      tier,
      hasWatermark:
        (workspace.subscription?.hasWatermark ?? true) && used < quota,
      priority: TIER_PRIORITY[tier] || 4,
    });

    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: { qstashMessageId },
    });

    log.info(
      `Slack interactions: enqueued generation id=${imageGeneration.id} style=${styleId}`,
    );
  } catch (err) {
    log.error("Slack interactions: failed to enqueue generation", err);
    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: {
        status: "FAILED",
        processingError:
          err instanceof Error ? err.message : "Failed to enqueue",
        completedAt: new Date(),
      },
    });
  }
}
