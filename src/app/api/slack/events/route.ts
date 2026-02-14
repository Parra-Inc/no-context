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
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: SlackEventPayload = JSON.parse(body);

  // Handle URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle events
  if (payload.type === "event_callback" && payload.event) {
    const event = payload.event;
    const teamId = payload.team_id;

    // Handle app_uninstalled
    if (event.type === "app_uninstalled" && teamId) {
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
      return NextResponse.json({ ok: true });
    }

    // Filter out bot messages, thread replies, edits
    if (event.bot_id || event.subtype || event.thread_ts) {
      return NextResponse.json({ ok: true });
    }

    // Process async — respond to Slack immediately
    processMessage(event, teamId!).catch((err) =>
      console.error("Message processing error:", err),
    );

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function processMessage(event: SlackEvent, teamId: string) {
  // Find workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId },
    include: { subscription: true },
  });

  if (!workspace?.isActive || workspace.needsReconnection) return;

  // Filter self-messages
  if (event.user === workspace.slackBotUserId) return;

  // Check if channel is connected
  const channel = await prisma.channel.findUnique({
    where: {
      workspaceId_slackChannelId: {
        workspaceId: workspace.id,
        slackChannelId: event.channel!,
      },
    },
  });

  if (!channel?.isActive || channel.isPaused) return;

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

  if (used >= quota) {
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
  const detection = await detectQuote(event.text!);
  if (!detection.isQuote) return;

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
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
  }

  // Add processing reaction
  const slackClient = getSlackClient(workspace.slackBotToken);
  try {
    await addReaction(slackClient, event.channel!, event.ts!, "art");
  } catch (error) {
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspace.id);
      return;
    }
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

  // Check for custom style
  let customStyleDescription: string | undefined;
  const customStyle = await prisma.customStyle.findFirst({
    where: { workspaceId: workspace.id, name: styleId, isActive: true },
  });
  if (customStyle) {
    customStyleDescription = customStyle.description;
  }

  // Enqueue image generation
  await enqueueImageGeneration({
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
}
