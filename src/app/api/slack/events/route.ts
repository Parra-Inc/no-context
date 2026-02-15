import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifySlackSignature,
  getSlackClient,
  addReaction,
  isSlackTokenError,
  markWorkspaceDisconnected,
} from "@/lib/slack";
import { detectQuote } from "@/lib/ai/quote-detector";
import { enqueueImageGeneration } from "@/lib/queue/queue";
import { TIER_QUOTAS } from "@/lib/stripe";
import { log } from "@/lib/logger";

interface SlackEvent {
  type: string;
  subtype?: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
}

interface SlackEventPayload {
  type: string;
  challenge?: string;
  event?: SlackEvent;
  team_id?: string;
}

const TIER_PRIORITY: Record<string, number> = {
  BUSINESS: 1,
  TEAM: 2,
  STARTER: 3,
  FREE: 4,
};

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify Slack signature
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
    log.warn("Slack events: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: SlackEventPayload = JSON.parse(body);
  const eventType = payload.event?.type || payload.type;

  log.info(
    `Slack events: received type=${payload.type} eventType=${eventType} team=${payload.team_id || "n/a"}`,
  );
  log.debug("Slack events: full payload", payload);

  // Persist the raw event
  await prisma.slackEvent
    .create({
      data: {
        eventType,
        teamId: payload.team_id || null,
        channel: payload.event?.channel || null,
        userId: payload.event?.user || null,
        messageTs: payload.event?.ts || null,
        rawBody: body,
        endpoint: "/api/slack/events",
      },
    })
    .catch((err) => log.error("Failed to persist slack event", err));

  // Handle URL verification challenge
  if (payload.type === "url_verification") {
    log.info("Slack events: responding to url_verification challenge");
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle events
  if (payload.type === "event_callback" && payload.event) {
    const event = payload.event;
    const teamId = payload.team_id;

    // Handle app_uninstalled
    if (event.type === "app_uninstalled" && teamId) {
      log.info(`Slack events: app_uninstalled for team=${teamId}`);
      await prisma.workspace.updateMany({
        where: { slackTeamId: teamId },
        data: { isActive: false },
      });
      return NextResponse.json({ ok: true });
    }

    // Only process channel messages
    if (
      event.type !== "message" ||
      !event.channel ||
      !event.ts ||
      !event.text
    ) {
      log.debug(`Slack events: ignoring non-message event type=${event.type}`);
      return NextResponse.json({ ok: true });
    }

    // Filter out bot messages, thread replies, edits
    if (event.bot_id || event.subtype || event.thread_ts) {
      log.debug(
        `Slack events: filtering out message bot_id=${event.bot_id} subtype=${event.subtype} thread_ts=${event.thread_ts}`,
      );
      return NextResponse.json({ ok: true });
    }

    log.info(
      `Slack events: processing message from user=${event.user} channel=${event.channel} team=${teamId}`,
    );

    // Process async — respond to Slack immediately
    processMessage(event, teamId!).catch((err) =>
      log.error("Slack events: message processing error", err),
    );

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function processMessage(event: SlackEvent, teamId: string) {
  log.info(
    `Slack events: processMessage started team=${teamId} channel=${event.channel} user=${event.user} text="${event.text?.substring(0, 50)}"`,
  );

  // Find workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
    include: { subscription: true },
  });

  if (!workspace) {
    log.warn(`Slack events: no workspace found for team=${teamId}`);
    return;
  }

  log.info(
    `Slack events: workspace found id=${workspace.id} isActive=${workspace.isActive} needsReconnection=${workspace.needsReconnection} botUserId=${workspace.slackBotUserId}`,
  );

  if (!workspace.isActive || workspace.needsReconnection) {
    log.warn(
      `Slack events: workspace inactive or needs reconnection team=${teamId} isActive=${workspace.isActive} needsReconnection=${workspace.needsReconnection}`,
    );
    return;
  }

  // Filter self-messages
  if (event.user === workspace.slackBotUserId) {
    log.info("Slack events: ignoring self-message");
    return;
  }

  // Check if channel is connected
  const channel = await prisma.channel.findUnique({
    where: {
      workspaceId_slackChannelId: {
        workspaceId: workspace.id,
        slackChannelId: event.channel!,
      },
    },
  });

  if (!channel) {
    log.warn(
      `Slack events: no channel record found workspaceId=${workspace.id} slackChannelId=${event.channel}`,
    );
    return;
  }

  log.info(
    `Slack events: channel found id=${channel.id} isActive=${channel.isActive} isPaused=${channel.isPaused}`,
  );

  if (!channel.isActive || channel.isPaused) {
    log.warn(
      `Slack events: channel not active or paused channel=${event.channel} isActive=${channel.isActive} isPaused=${channel.isPaused}`,
    );
    return;
  }

  // Check quota
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

  log.info(
    `Slack events: quota check tier=${tier} used=${used}/${quota} workspace=${workspace.id}`,
  );

  if (used >= quota) {
    log.info(
      `Slack events: quota exceeded for workspace=${workspace.id} used=${used}/${quota}`,
    );
    const slackClient = getSlackClient(workspace.slackBotToken);
    await addReaction(
      slackClient,
      event.channel!,
      event.ts!,
      "no-context-limit",
    );
    return;
  }

  // Detect quote
  log.info(`Slack events: calling detectQuote with text="${event.text}"`);

  let detection;
  try {
    detection = await detectQuote(event.text!);
  } catch (err) {
    log.error("Slack events: detectQuote threw an error", err);
    return;
  }

  log.info(
    `Slack events: detectQuote result isQuote=${detection.isQuote} confidence=${detection.confidence} extractedQuote="${detection.extractedQuote}" attributedTo="${detection.attributedTo}"`,
  );

  if (!detection.isQuote) {
    log.info(
      `Slack events: message not detected as quote channel=${event.channel} confidence=${detection.confidence}`,
    );
    return;
  }

  log.info(
    `Slack events: quote detected confidence=${detection.confidence} channel=${event.channel}`,
  );

  // Get user display name and avatar
  let userName = "Unknown";
  let userAvatarUrl: string | undefined;
  try {
    const slackClient = getSlackClient(workspace.slackBotToken);
    const userInfo = await slackClient.users.info({ user: event.user! });
    userName =
      userInfo.user?.profile?.display_name ||
      userInfo.user?.real_name ||
      "Unknown";
    userAvatarUrl = userInfo.user?.profile?.image_72 || undefined;
  } catch (error) {
    if (isSlackTokenError(error)) {
      log.warn(
        `Slack events: token error fetching user info workspace=${workspace.id}`,
      );
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
    log.error("Slack events: error fetching user info", error);
  }

  // Add processing reaction
  const slackClient = getSlackClient(workspace.slackBotToken);
  try {
    await addReaction(slackClient, event.channel!, event.ts!, "art");
  } catch (error) {
    if (isSlackTokenError(error)) {
      log.warn(
        `Slack events: token error adding reaction workspace=${workspace.id}`,
      );
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
    log.error("Slack events: error adding reaction", error);
  }

  // Create quote record
  const styleId = channel.styleId || workspace.defaultStyleId;

  const quote = await prisma.quote.create({
    data: {
      workspaceId: workspace.id,
      channelId: channel.id,
      slackMessageTs: event.ts!,
      slackUserId: event.user!,
      slackUserName: userName,
      slackUserAvatarUrl: userAvatarUrl,
      quoteText: detection.extractedQuote || event.text!,
      attributedTo: detection.attributedTo,
      styleId,
      aiConfidence: detection.confidence,
      status: "PENDING",
    },
  });

  log.info(
    `Slack events: quote created id=${quote.id} style=${styleId} workspace=${workspace.id}`,
  );

  // Check for custom style
  let customStyleDescription: string | undefined;
  const customStyle = await prisma.customStyle.findFirst({
    where: { workspaceId: workspace.id, name: styleId, isActive: true },
  });
  if (customStyle) {
    customStyleDescription = customStyle.description;
  }

  // Enqueue image generation
  try {
    const messageId = await enqueueImageGeneration({
      workspaceId: workspace.id,
      channelId: channel.id,
      quoteId: quote.id,
      messageTs: event.ts!,
      slackChannelId: event.channel!,
      quoteText: detection.extractedQuote || event.text!,
      styleId,
      customStyleDescription,
      encryptedBotToken: workspace.slackBotToken,
      postToSlackChannelId: channel.postToChannelId || undefined,
      tier,
      priority: TIER_PRIORITY[tier] || 4,
    });

    log.info(
      `Slack events: image generation enqueued quote=${quote.id} qstashMessageId=${messageId}`,
    );
  } catch (err) {
    log.error(
      `Slack events: failed to enqueue image generation quote=${quote.id}`,
      err,
    );
  }
}
