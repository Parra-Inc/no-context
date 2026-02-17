import { after, NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifySlackSignature,
  getSlackClient,
  addReaction,
  postEphemeral,
  getParentMessage,
  isSlackTokenError,
  markWorkspaceDisconnected,
} from "@/lib/slack";
import { detectQuote } from "@/lib/ai/quote-detector";
import { enqueueImageGeneration } from "@/lib/queue/queue";
import {
  TIER_QUOTAS,
  TIER_MAX_CHANNELS,
  TIER_PRIORITY,
  TIER_IMAGE_MODEL,
  TIER_IMAGE_QUALITY,
  TIER_IMAGE_SIZE,
  TIER_LLM_MODEL,
} from "@/lib/stripe";
import { log } from "@/lib/logger";
import {
  getEnabledStylesForChannel,
  pickRandomStyle,
} from "@/lib/styles.server";
import type { DbStyle } from "@/lib/styles.server";
import { getOrCreateCheckoutToken } from "@/lib/checkout";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvent = (payload as any).event;
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
        channel:
          typeof rawEvent?.channel === "string"
            ? rawEvent.channel
            : rawEvent?.channel?.id || null,
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

    // Filter out bot messages and edits
    if (event.bot_id || event.subtype) {
      log.debug(
        `Slack events: filtering out message bot_id=${event.bot_id} subtype=${event.subtype}`,
      );
      return NextResponse.json({ ok: true });
    }

    // Filter out thread replies that don't contain a potential @mention
    if (event.thread_ts && !event.text?.includes("<@")) {
      log.debug(
        `Slack events: filtering out thread reply without mention thread_ts=${event.thread_ts}`,
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

    // Route thread replies to mention handler, top-level messages to normal flow
    if (event.thread_ts) {
      after(
        processMentionInThread(event, teamId).catch((err) =>
          log.error("Slack events: thread mention processing error", err),
        ),
      );
    } else {
      after(
        processMessage(event, teamId).catch((err) =>
          log.error("Slack events: message processing error", err),
        ),
      );
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Top-level message processing (existing auto-detection flow)
// ---------------------------------------------------------------------------

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

  // Find or auto-create channel
  const channelRecord = await findOrCreateChannel(
    workspace.id,
    slackChannelId,
    workspace.slackBotToken,
    workspace.subscription,
  );

  if (!channelRecord) {
    log.warn(
      `Slack events: no channel record and could not create one workspaceId=${workspace.id} slackChannelId=${slackChannelId}`,
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
  const bonusCredits = workspace.subscription?.bonusCredits || 0;
  const used = usage?.quotesUsed || 0;
  const effectiveQuota = quota + bonusCredits;

  log.info(
    `Slack events: quota check tier=${tier} used=${used}/${quota} bonus=${bonusCredits} workspace=${workspace.id}`,
  );

  if (used >= effectiveQuota) {
    log.info(
      `Slack events: quota exceeded for workspace=${workspace.id} used=${used}/${quota} bonus=${bonusCredits}`,
    );
    const slackClient = getSlackClient(workspace.slackBotToken);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDateStr = resetDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const checkoutToken = await getOrCreateCheckoutToken(workspace.id);
    await postEphemeral(
      slackClient,
      slackChannelId,
      slackUserId,
      [
        `You've used all ${used}/${quota} monthly images${bonusCredits === 0 ? "" : " and bonus credits"} for No Context. Your monthly usage resets on *${resetDateStr}*.`,
        `<${appUrl}/checkout/${checkoutToken}|Buy extra image generations> or <${appUrl}/${workspace.slug}/settings/billing|upgrade your plan> to keep generating!`,
      ].join("\n"),
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
    const llmModel = TIER_LLM_MODEL[tier] || "claude-haiku-4-5-20251001";
    if (channelRecord.styleMode === "AI") {
      detection = await detectQuote(
        text,
        enabledStyles.map((s) => ({
          id: s.id,
          name: s.name,
          displayName: s.displayName,
          description: s.description,
        })),
        llmModel,
      );
    } else {
      detection = await detectQuote(text, undefined, llmModel);
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
    ? selectedStyle.prompt
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
      quoteOriginal: channelRecord.quoteOriginal || undefined,
      tier,
      hasWatermark:
        (workspace.subscription?.hasWatermark ?? true) && used < quota,
      priority: TIER_PRIORITY[tier] || 4,
      imageModel: TIER_IMAGE_MODEL[tier],
      imageQuality: TIER_IMAGE_QUALITY[tier],
      imageSize: TIER_IMAGE_SIZE[tier],
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

// ---------------------------------------------------------------------------
// @Mention in thread reply — extract quote from parent, generate with new style
// ---------------------------------------------------------------------------

async function processMentionInThread(event: SlackEvent, teamId: string) {
  const slackChannelId = event.channel;
  const text = event.text;
  const slackUserId = event.user;
  const threadTs = event.thread_ts;

  if (!slackChannelId || !text || !slackUserId || !threadTs) {
    log.warn("Slack events: processMentionInThread missing fields");
    return;
  }

  // Look up workspace to verify the @mention is for our bot
  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
    include: { subscription: true },
  });

  if (!workspace || !workspace.isActive || workspace.needsReconnection) {
    return;
  }

  if (slackUserId === workspace.slackBotUserId) {
    return;
  }

  // Verify this is actually a mention of our bot
  const botMentionPattern = `<@${workspace.slackBotUserId}>`;
  if (!text.includes(botMentionPattern)) {
    log.debug("Slack events: thread reply does not mention our bot, ignoring");
    return;
  }

  log.info(
    `Slack events: bot mentioned in thread channel=${slackChannelId} thread=${threadTs} user=${slackUserId}`,
  );

  // Find or auto-create channel
  const channelRecord = await findOrCreateChannel(
    workspace.id,
    slackChannelId,
    workspace.slackBotToken,
    workspace.subscription,
  );

  if (!channelRecord || !channelRecord.isActive || channelRecord.isPaused) {
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
  const bonusCredits = workspace.subscription?.bonusCredits || 0;
  const used = usage?.quotesUsed || 0;
  const effectiveQuota = quota + bonusCredits;

  if (used >= effectiveQuota) {
    const slackClient = getSlackClient(workspace.slackBotToken);
    await addReaction(
      slackClient,
      slackChannelId,
      threadTs,
      "no-context-limit",
    );
    return;
  }

  // Fetch parent message text
  const slackClient = getSlackClient(workspace.slackBotToken);
  let parentText: string | null;
  try {
    parentText = await getParentMessage(slackClient, slackChannelId, threadTs);
  } catch (error) {
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
    log.error("Slack events: error fetching parent message", error);
    return;
  }

  if (!parentText) {
    await slackClient.chat.postMessage({
      channel: slackChannelId,
      thread_ts: threadTs,
      text: "I couldn't read the original message. Try quoting it directly.",
    });
    return;
  }

  // Look up existing Quote + ImageGenerations for this parent message
  const existingQuote = await prisma.quote.findUnique({
    where: {
      workspaceId_slackMessageTs: {
        workspaceId: workspace.id,
        slackMessageTs: threadTs,
      },
    },
    include: { imageGenerations: true },
  });

  // Get enabled styles
  const enabledStyles = await getEnabledStylesForChannel(
    channelRecord.id,
    workspace.id,
  );

  if (enabledStyles.length === 0) {
    log.warn("Slack events: no enabled styles for mention thread");
    return;
  }

  // Check if user said "retry" to show style picker
  const cleanText = text.replace(botMentionPattern, "").trim().toLowerCase();
  const isRetry = cleanText.includes("retry");

  if (isRetry) {
    await postStylePicker(
      slackClient,
      slackChannelId,
      threadTs,
      parentText,
      existingQuote,
      enabledStyles,
      workspace,
      channelRecord,
      slackUserId,
    );
  } else {
    await generateFromMention(
      slackClient,
      slackChannelId,
      threadTs,
      parentText,
      existingQuote,
      enabledStyles,
      workspace,
      channelRecord,
      slackUserId,
      tier,
      used,
      quota,
    );
  }
}

// ---------------------------------------------------------------------------
// Generate image from @mention (auto-select unused style)
// ---------------------------------------------------------------------------

async function generateFromMention(
  slackClient: ReturnType<typeof getSlackClient>,
  slackChannelId: string,
  parentTs: string,
  parentText: string,
  existingQuote: Awaited<ReturnType<typeof findQuoteWithGenerations>>,
  enabledStyles: DbStyle[],
  workspace: NonNullable<Awaited<ReturnType<typeof findWorkspace>>>,
  channelRecord: NonNullable<Awaited<ReturnType<typeof findChannel>>>,
  slackUserId: string,
  tier: string,
  used: number,
  quota: number,
) {
  // Find styles already used
  const usedStyleIds = new Set(
    existingQuote?.imageGenerations.map((ig) => ig.styleId) ?? [],
  );

  // Pick an unused style, fall back to any if all used
  const unusedStyles = enabledStyles.filter((s) => !usedStyleIds.has(s.name));
  const selectedStyle =
    unusedStyles.length > 0
      ? pickRandomStyle(unusedStyles)
      : pickRandomStyle(enabledStyles);

  const styleId = selectedStyle.name;
  const customStyleDescription = selectedStyle.workspaceId
    ? selectedStyle.prompt
    : undefined;

  // Add processing reaction
  try {
    await addReaction(slackClient, slackChannelId, parentTs, "eyes");
  } catch (error) {
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
  }

  // Get user display info for the parent message author
  let userName = "Unknown";
  let userAvatarUrl: string | undefined;
  try {
    // Fetch the parent message author, not the person who @mentioned
    const repliesResult = await slackClient.conversations.replies({
      channel: slackChannelId,
      ts: parentTs,
      limit: 1,
      inclusive: true,
    });
    const parentUserId = repliesResult.messages?.[0]?.user;
    if (parentUserId) {
      const userInfo = await slackClient.users.info({ user: parentUserId });
      userName =
        userInfo.user?.profile?.display_name ||
        userInfo.user?.real_name ||
        "Unknown";
      userAvatarUrl = userInfo.user?.profile?.image_72 || undefined;
    }
  } catch (error) {
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
    log.error("Slack events: error fetching parent user info", error);
  }

  // Create or reuse Quote, create new ImageGeneration
  let quoteId: string;
  let imageGenerationId: string;

  if (existingQuote) {
    const maxAttempt = Math.max(
      ...existingQuote.imageGenerations.map((ig) => ig.attemptNumber),
      0,
    );

    const imageGeneration = await prisma.imageGeneration.create({
      data: {
        quoteId: existingQuote.id,
        workspaceId: workspace.id,
        styleId,
        customStyleDescription,
        status: "PENDING",
        attemptNumber: maxAttempt + 1,
      },
    });

    quoteId = existingQuote.id;
    imageGenerationId = imageGeneration.id;

    await prisma.quote.update({
      where: { id: existingQuote.id },
      data: { status: "PENDING" },
    });
  } else {
    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          workspaceId: workspace.id,
          channelId: channelRecord.id,
          slackMessageTs: parentTs,
          slackUserId,
          slackUserName: userName,
          slackUserAvatarUrl: userAvatarUrl,
          quoteText: parentText,
          attributedTo: null,
          styleId,
          aiConfidence: 1.0,
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

    quoteId = result.quote.id;
    imageGenerationId = result.imageGeneration.id;
  }

  log.info(
    `Slack events: mention generation created quote=${quoteId} imageGeneration=${imageGenerationId} style=${styleId}`,
  );

  // Enqueue image generation
  try {
    const messageId = await enqueueImageGeneration({
      workspaceId: workspace.id,
      channelId: channelRecord.id,
      quoteId,
      imageGenerationId,
      messageTs: parentTs,
      slackChannelId,
      quoteText: parentText,
      styleId,
      customStyleDescription,
      encryptedBotToken: workspace.slackBotToken,
      postToSlackChannelId: channelRecord.postToChannelId || undefined,
      quoteOriginal: channelRecord.quoteOriginal || undefined,
      tier,
      hasWatermark:
        (workspace.subscription?.hasWatermark ?? true) && used < quota,
      priority: TIER_PRIORITY[tier] || 4,
      imageModel: TIER_IMAGE_MODEL[tier],
      imageQuality: TIER_IMAGE_QUALITY[tier],
      imageSize: TIER_IMAGE_SIZE[tier],
    });

    await prisma.imageGeneration.update({
      where: { id: imageGenerationId },
      data: { qstashMessageId: messageId },
    });
  } catch (err) {
    log.error("Slack events: failed to enqueue from mention", err);
    await prisma.imageGeneration.update({
      where: { id: imageGenerationId },
      data: {
        status: "FAILED",
        processingError:
          err instanceof Error ? err.message : "Failed to enqueue",
        completedAt: new Date(),
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Post style picker dropdown for "retry" flow
// ---------------------------------------------------------------------------

async function postStylePicker(
  slackClient: ReturnType<typeof getSlackClient>,
  slackChannelId: string,
  threadTs: string,
  parentText: string,
  existingQuote: Awaited<ReturnType<typeof findQuoteWithGenerations>>,
  enabledStyles: DbStyle[],
  workspace: NonNullable<Awaited<ReturnType<typeof findWorkspace>>>,
  channelRecord: NonNullable<Awaited<ReturnType<typeof findChannel>>>,
  slackUserId: string,
) {
  const usedStyleIds = new Set(
    existingQuote?.imageGenerations.map((ig) => ig.styleId) ?? [],
  );

  // Build style options for the dropdown
  const styleOptions = enabledStyles.map((style) => ({
    text: {
      type: "plain_text" as const,
      text: usedStyleIds.has(style.name)
        ? `${style.displayName} \u2714`
        : style.displayName,
    },
    value: style.name,
  }));

  // Ensure we have a Quote record for the action_id reference
  let quoteId: string;
  if (existingQuote) {
    quoteId = existingQuote.id;
  } else {
    let userName = "Unknown";
    let userAvatarUrl: string | undefined;
    try {
      const repliesResult = await slackClient.conversations.replies({
        channel: slackChannelId,
        ts: threadTs,
        limit: 1,
        inclusive: true,
      });
      const parentUserId = repliesResult.messages?.[0]?.user;
      if (parentUserId) {
        const userInfo = await slackClient.users.info({ user: parentUserId });
        userName =
          userInfo.user?.profile?.display_name ||
          userInfo.user?.real_name ||
          "Unknown";
        userAvatarUrl = userInfo.user?.profile?.image_72 || undefined;
      }
    } catch {
      // proceed with defaults
    }

    const quote = await prisma.quote.create({
      data: {
        workspaceId: workspace.id,
        channelId: channelRecord.id,
        slackMessageTs: threadTs,
        slackUserId,
        slackUserName: userName,
        slackUserAvatarUrl: userAvatarUrl,
        quoteText: parentText,
        attributedTo: null,
        styleId: "pending",
        aiConfidence: 1.0,
        status: "PENDING",
      },
    });
    quoteId = quote.id;
  }

  const truncatedText =
    parentText.length > 150 ? parentText.substring(0, 150) + "..." : parentText;

  await slackClient.chat.postMessage({
    channel: slackChannelId,
    thread_ts: threadTs,
    text: "Pick a style for this quote:",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:art: *Pick a style for this quote:*\n> ${truncatedText}`,
        },
      },
      {
        type: "actions",
        block_id: "style_picker_block",
        elements: [
          {
            type: "static_select",
            action_id: `style_select:${quoteId}`,
            placeholder: {
              type: "plain_text",
              text: "Choose a style...",
            },
            options: styleOptions,
          },
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Type helpers for Prisma query return types
// ---------------------------------------------------------------------------

function findQuoteWithGenerations(workspaceId: string, slackMessageTs: string) {
  return prisma.quote.findUnique({
    where: { workspaceId_slackMessageTs: { workspaceId, slackMessageTs } },
    include: { imageGenerations: true },
  });
}

function findWorkspace(teamId: string) {
  return prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
    include: { subscription: true },
  });
}

function findChannel(workspaceId: string, slackChannelId: string) {
  return prisma.channel.findUnique({
    where: { workspaceId_slackChannelId: { workspaceId, slackChannelId } },
  });
}

async function findOrCreateChannel(
  workspaceId: string,
  slackChannelId: string,
  slackBotToken: string,
  subscription: { tier?: string; maxChannels?: number | null } | null,
) {
  const existing = await prisma.channel.findUnique({
    where: {
      workspaceId_slackChannelId: { workspaceId, slackChannelId },
    },
  });

  if (existing) return existing;

  // Check tier channel limit
  const tier = subscription?.tier || "FREE";
  const maxChannels = subscription?.maxChannels ?? TIER_MAX_CHANNELS[tier] ?? 1;
  const currentCount = await prisma.channel.count({
    where: { workspaceId, isActive: true },
  });

  if (currentCount >= maxChannels) {
    log.warn(
      `Slack events: channel limit reached workspaceId=${workspaceId} current=${currentCount} max=${maxChannels}`,
    );
    return null;
  }

  // Fetch channel name from Slack
  let channelName = slackChannelId;
  try {
    const slackClient = getSlackClient(slackBotToken);
    const info = await slackClient.conversations.info({
      channel: slackChannelId,
    });
    channelName = info.channel?.name || slackChannelId;
  } catch (err) {
    log.warn(
      `Slack events: could not fetch channel name for ${slackChannelId}`,
      err,
    );
  }

  // Create channel and default ChannelStyle disable records in a transaction
  const channel = await prisma.$transaction(async (tx) => {
    const ch = await tx.channel.create({
      data: {
        workspaceId,
        slackChannelId,
        channelName,
      },
    });

    // Disable styles that are not enabled by default
    const disabledByDefaultStyles = await tx.style.findMany({
      where: { enabledByDefault: false, isActive: true },
      select: { id: true },
    });

    if (disabledByDefaultStyles.length > 0) {
      await tx.channelStyle.createMany({
        data: disabledByDefaultStyles.map((s) => ({
          channelId: ch.id,
          styleId: s.id,
        })),
      });
    }

    return ch;
  });

  log.info(
    `Slack events: auto-created channel id=${channel.id} name=${channelName} workspaceId=${workspaceId}`,
  );

  return channel;
}
