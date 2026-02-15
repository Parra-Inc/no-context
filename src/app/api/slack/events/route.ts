import { after, NextRequest, NextResponse } from "next/server";
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
import {
  getEnabledStylesForChannel,
  pickRandomStyle,
} from "@/lib/styles.server";

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

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    log.warn("Slack events: SLACK_SIGNING_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  if (!verifySlackSignature(signingSecret, body, timestamp, signature)) {
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

    if (!teamId) {
      log.warn(`Slack events: missing team_id in event_callback payload`);
      return NextResponse.json({ ok: true });
    }

    // Process async — respond to Slack immediately, but keep function alive
    after(
      processMessage(event, teamId).catch((err) =>
        log.error("Slack events: message processing error", err),
      ),
    );

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function processMessage(event: SlackEvent, teamId: string) {
  const slackChannelId = event.channel;
  const messageTs = event.ts;
  const text = event.text;
  const slackUserId = event.user;

  if (!slackChannelId || !messageTs || !text || !slackUserId) {
    log.warn(
      `Slack events: processMessage called with missing required fields team=${teamId} channel=${slackChannelId} ts=${messageTs} user=${slackUserId} hasText=${!!text}`,
    );
    return;
  }

  log.info(
    `Slack events: processMessage started team=${teamId} channel=${slackChannelId} user=${slackUserId} text="${text.substring(0, 50)}"`,
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
  if (slackUserId === workspace.slackBotUserId) {
    log.info("Slack events: ignoring self-message");
    return;
  }

  // Check if channel is connected
  const channelRecord = await prisma.channel.findUnique({
    where: {
      workspaceId_slackChannelId: {
        workspaceId: workspace.id,
        slackChannelId,
      },
    },
  });

  if (!channelRecord) {
    log.warn(
      `Slack events: no channel record found workspaceId=${workspace.id} slackChannelId=${slackChannelId}`,
    );
    return;
  }

  log.info(
    `Slack events: channel found id=${channelRecord.id} isActive=${channelRecord.isActive} isPaused=${channelRecord.isPaused}`,
  );

  if (!channelRecord.isActive || channelRecord.isPaused) {
    log.warn(
      `Slack events: channel not active or paused channel=${slackChannelId} isActive=${channelRecord.isActive} isPaused=${channelRecord.isPaused}`,
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
      slackChannelId,
      messageTs,
      "no-context-limit",
    );
    return;
  }

  // Get enabled styles for this channel
  const enabledStyles = await getEnabledStylesForChannel(
    channelRecord.id,
    workspace.id,
  );

  if (enabledStyles.length === 0) {
    log.warn(
      `Slack events: no enabled styles for channel=${channelRecord.id} workspace=${workspace.id}`,
    );
    return;
  }

  // Detect quote (with style selection in AI mode)
  log.info(
    `Slack events: calling detectQuote with text="${text}" styleMode=${channelRecord.styleMode}`,
  );

  let detection;
  try {
    if (channelRecord.styleMode === "AI") {
      detection = await detectQuote(
        text,
        enabledStyles.map((s) => ({
          id: s.id,
          name: s.name,
          displayName: s.displayName,
          description: s.description,
        })),
      );
    } else {
      detection = await detectQuote(text);
    }
  } catch (err) {
    log.error("Slack events: detectQuote threw an error", err);
    return;
  }

  log.info(
    `Slack events: detectQuote result isQuote=${detection.isQuote} confidence=${detection.confidence} extractedQuote="${detection.extractedQuote}" attributedTo="${detection.attributedTo}"`,
  );

  if (!detection.isQuote) {
    log.info(
      `Slack events: message not detected as quote channel=${slackChannelId} confidence=${detection.confidence}`,
    );
    return;
  }

  log.info(
    `Slack events: quote detected confidence=${detection.confidence} channel=${slackChannelId}`,
  );

  // Get user display name and avatar
  let userName = "Unknown";
  let userAvatarUrl: string | undefined;
  try {
    const slackClient = getSlackClient(workspace.slackBotToken);
    const userInfo = await slackClient.users.info({ user: slackUserId });
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
    await addReaction(slackClient, slackChannelId, messageTs, "eyes");
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

  // Select style based on channel mode
  let selectedStyle;
  if (channelRecord.styleMode === "AI" && detection.selectedStyleId) {
    selectedStyle =
      enabledStyles.find((s) => s.id === detection.selectedStyleId) ||
      pickRandomStyle(enabledStyles);
  } else {
    selectedStyle = pickRandomStyle(enabledStyles);
  }

  const styleId = selectedStyle.name;
  // Custom styles (with a workspaceId) pass their description for prompt generation
  const customStyleDescription = selectedStyle.workspaceId
    ? selectedStyle.description
    : undefined;

  const { quote, imageGeneration } = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        workspaceId: workspace.id,
        channelId: channelRecord.id,
        slackMessageTs: messageTs,
        slackUserId,
        slackUserName: userName,
        slackUserAvatarUrl: userAvatarUrl,
        quoteText: detection.extractedQuote || text,
        attributedTo: detection.attributedTo,
        styleId,
        aiConfidence: detection.confidence,
        status: "PENDING",
      },
    });

    const imageGeneration = await tx.imageGeneration.create({
      data: {
        quoteId: quote.id,
        workspaceId: workspace.id,
        styleId,
        customStyleDescription,
        status: "PENDING",
        attemptNumber: 1,
      },
    });

    return { quote, imageGeneration };
  });

  log.info(
    `Slack events: quote created id=${quote.id} imageGeneration=${imageGeneration.id} style=${styleId} workspace=${workspace.id}`,
  );

  // Enqueue image generation
  try {
    const messageId = await enqueueImageGeneration({
      workspaceId: workspace.id,
      channelId: channelRecord.id,
      quoteId: quote.id,
      imageGenerationId: imageGeneration.id,
      messageTs,
      slackChannelId,
      quoteText: detection.extractedQuote || text,
      styleId,
      customStyleDescription,
      encryptedBotToken: workspace.slackBotToken,
      postToSlackChannelId: channelRecord.postToChannelId || undefined,
      tier,
      priority: TIER_PRIORITY[tier] || 4,
    });

    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: { qstashMessageId: messageId },
    });

    log.info(
      `Slack events: image generation enqueued imageGeneration=${imageGeneration.id} qstashMessageId=${messageId}`,
    );
  } catch (err) {
    log.error(
      `Slack events: failed to enqueue image generation imageGeneration=${imageGeneration.id}`,
      err,
    );
    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: {
        status: "FAILED",
        processingError:
          err instanceof Error ? err.message : "Failed to enqueue",
        completedAt: new Date(),
      },
    });
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "FAILED" },
    });
  }
}
