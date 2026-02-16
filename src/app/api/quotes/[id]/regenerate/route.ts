import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enqueueImageGeneration } from "@/lib/queue/queue";
import { TIER_QUOTAS, TIER_PRIORITY } from "@/lib/stripe";
import {
  getEnabledStylesForChannel,
  pickRandomStyle,
} from "@/lib/styles.server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.user.workspaceId;
  const { id: quoteId } = await params;

  // Fetch quote with channel and existing generations
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, workspaceId },
    include: {
      channel: true,
      imageGenerations: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch workspace with subscription
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  if (!workspace || !workspace.isActive || workspace.needsReconnection) {
    return NextResponse.json(
      { error: "Workspace unavailable" },
      { status: 400 },
    );
  }

  // Quota check
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usage = await prisma.usageRecord.findUnique({
    where: {
      workspaceId_periodStart: { workspaceId, periodStart },
    },
  });

  const tier = workspace.subscription?.tier || "FREE";
  const quota = workspace.subscription?.monthlyQuota || TIER_QUOTAS.FREE;
  const bonusCredits = workspace.subscription?.bonusCredits || 0;
  const used = usage?.quotesUsed || 0;
  const effectiveQuota = quota + bonusCredits;

  if (used >= effectiveQuota) {
    return NextResponse.json(
      { error: "Monthly quota exceeded" },
      { status: 429 },
    );
  }

  // Get enabled styles for the channel
  const enabledStyles = await getEnabledStylesForChannel(
    quote.channelId,
    workspaceId,
  );

  if (enabledStyles.length === 0) {
    return NextResponse.json({ error: "No styles available" }, { status: 400 });
  }

  // Pick an unused style; fall back to any if all exhausted
  const usedStyleIds = new Set(quote.imageGenerations.map((ig) => ig.styleId));
  const unusedStyles = enabledStyles.filter((s) => !usedStyleIds.has(s.name));
  const selectedStyle =
    unusedStyles.length > 0
      ? pickRandomStyle(unusedStyles)
      : pickRandomStyle(enabledStyles);

  const styleId = selectedStyle.name;
  const customStyleDescription = selectedStyle.workspaceId
    ? selectedStyle.description
    : undefined;

  // Determine attempt number
  const maxAttempt = Math.max(
    ...quote.imageGenerations.map((ig) => ig.attemptNumber),
    0,
  );

  // Create ImageGeneration record and update quote
  const imageGeneration = await prisma.imageGeneration.create({
    data: {
      quoteId: quote.id,
      workspaceId,
      styleId,
      customStyleDescription,
      status: "PENDING",
      attemptNumber: maxAttempt + 1,
    },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "PENDING", styleId },
  });

  // Enqueue generation
  try {
    const qstashMessageId = await enqueueImageGeneration({
      workspaceId,
      channelId: quote.channelId,
      quoteId: quote.id,
      imageGenerationId: imageGeneration.id,
      messageTs: quote.slackMessageTs,
      slackChannelId: quote.channel.slackChannelId,
      quoteText: quote.quoteText,
      styleId,
      customStyleDescription,
      encryptedBotToken: workspace.slackBotToken,
      postToSlackChannelId: quote.channel.postToChannelId || undefined,
      tier,
      hasWatermark:
        (workspace.subscription?.hasWatermark ?? true) && used < quota,
      priority: TIER_PRIORITY[tier] || 4,
    });

    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: { qstashMessageId },
    });
  } catch (err) {
    await prisma.imageGeneration.update({
      where: { id: imageGeneration.id },
      data: {
        status: "FAILED",
        processingError:
          err instanceof Error ? err.message : "Failed to enqueue",
        completedAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    imageGenerationId: imageGeneration.id,
    styleId,
  });
}
