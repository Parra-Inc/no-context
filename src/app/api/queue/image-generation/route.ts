import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@/lib/prisma";
import { generateImage, downloadImage } from "@/lib/ai/image-generator";
import { uploadImage } from "@/lib/storage";
import { TIER_HAS_WATERMARK } from "@/lib/stripe";
import { applyWatermark } from "@/lib/watermark";
import {
  getSlackClient,
  postThreadReply,
  postToChannel,
  getMessagePermalink,
  addReaction,
  removeReaction,
  isSlackTokenError,
  markWorkspaceDisconnected,
} from "@/lib/slack";
import type { ImageGenerationJob } from "@/lib/queue/queue";

export const maxDuration = 60;

async function handler(request: NextRequest) {
  const job: ImageGenerationJob = await request.json();

  const {
    workspaceId,
    quoteId,
    messageTs,
    slackChannelId,
    quoteText,
    styleId,
    customStyleDescription,
    encryptedBotToken,
  } = job;

  // Backward compatibility: old in-flight jobs may lack imageGenerationId
  let imageGenerationId = job.imageGenerationId;
  if (!imageGenerationId) {
    const gen = await prisma.imageGeneration.create({
      data: {
        quoteId,
        workspaceId,
        styleId,
        customStyleDescription,
        status: "PENDING",
        attemptNumber: 1,
      },
    });
    imageGenerationId = gen.id;
  }

  // Fall back to looking up the tier from the database if not provided in the job
  // (handles old jobs already in the queue before this feature was deployed)
  let tier = job.tier;
  if (!tier) {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      select: { tier: true },
    });
    tier = subscription?.tier || "FREE";
  }

  const slackClient = getSlackClient(encryptedBotToken);

  // Update statuses to PROCESSING
  await prisma.imageGeneration.update({
    where: { id: imageGenerationId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "PROCESSING" },
  });

  try {
    // Generate image (1024x1024, cropped to 4:3)
    const result = await generateImage(
      quoteText,
      styleId,
      customStyleDescription,
    );

    if (!result) {
      // Content policy rejection — post text fallback
      await postThreadReply(
        slackClient,
        slackChannelId,
        messageTs,
        "This quote was too powerful for art. It's been saved to your gallery as text-only.",
      );

      await prisma.imageGeneration.update({
        where: { id: imageGenerationId },
        data: {
          status: "FAILED",
          processingError: "Content policy rejection after retry",
          completedAt: new Date(),
        },
      });
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: "FAILED" },
      });

      await removeReaction(slackClient, slackChannelId, messageTs, "eyes");
      return NextResponse.json({ ok: true });
    }

    // Download, apply watermark if enabled, and upload to Vercel Blob
    let imageBuffer = await downloadImage(
      result.imageBuffer ?? result.imageUrl,
    );
    // Use job.hasWatermark; fall back to tier lookup for old in-flight jobs
    const shouldWatermark =
      job.hasWatermark ?? TIER_HAS_WATERMARK[tier] ?? true;
    if (shouldWatermark) {
      imageBuffer = await applyWatermark(imageBuffer);
    }
    const storedUrl = await uploadImage(imageBuffer, workspaceId, quoteId);

    // Post to Slack — routed to a channel (same or different) or as a thread reply
    const postTargetChannelId = job.postToSlackChannelId;
    if (postTargetChannelId) {
      let text = `"${quoteText}"`;
      if (job.quoteOriginal) {
        const permalink = await getMessagePermalink(
          slackClient,
          slackChannelId,
          messageTs,
        );
        if (permalink) {
          text = `${text}\n${permalink}`;
        }
      }
      await postToChannel(slackClient, postTargetChannelId, text, storedUrl);
    } else {
      await postThreadReply(
        slackClient,
        slackChannelId,
        messageTs,
        `"${quoteText}"`,
        storedUrl,
      );
    }

    // Get Slack permalink for the original message thread (if not already saved)
    let slackPermalink: string | null = null;
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { slackPermalink: true },
    });
    if (!existingQuote?.slackPermalink) {
      slackPermalink = await getMessagePermalink(
        slackClient,
        slackChannelId,
        messageTs,
      );
    }

    // Update ImageGeneration as completed
    await prisma.imageGeneration.update({
      where: { id: imageGenerationId },
      data: {
        status: "COMPLETED",
        imageUrl: storedUrl,
        imagePrompt: result.prompt,
        completedAt: new Date(),
      },
    });

    // Update Quote with winning image
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "COMPLETED",
        imageUrl: storedUrl,
        ...(slackPermalink && { slackPermalink }),
      },
    });

    // Update reactions
    await removeReaction(slackClient, slackChannelId, messageTs, "eyes");
    await addReaction(
      slackClient,
      slackChannelId,
      messageTs,
      "white_check_mark",
    );

    // Increment usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageRecord = await prisma.usageRecord.upsert({
      where: {
        workspaceId_periodStart: { workspaceId, periodStart },
      },
      update: { quotesUsed: { increment: 1 } },
      create: {
        workspaceId,
        periodStart,
        periodEnd,
        quotesUsed: 1,
        quotaLimit: 5,
      },
    });

    // If usage exceeds monthly quota, decrement bonus credits
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      select: { monthlyQuota: true, bonusCredits: true },
    });

    if (
      usageRecord.quotesUsed > (subscription?.monthlyQuota || 5) &&
      (subscription?.bonusCredits || 0) > 0
    ) {
      await prisma.$executeRaw`
        UPDATE "Subscription"
        SET "bonusCredits" = "bonusCredits" - 1
        WHERE "workspaceId" = ${workspaceId}
          AND "bonusCredits" > 0
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // If the Slack token is invalid, mark workspace as disconnected and don't retry
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspaceId);
      await prisma.imageGeneration.update({
        where: { id: imageGenerationId },
        data: {
          status: "FAILED",
          processingError:
            "Slack connection lost. Please reconnect your workspace.",
          completedAt: new Date(),
        },
      });
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.imageGeneration.update({
      where: { id: imageGenerationId },
      data: {
        status: "FAILED",
        processingError: errorMessage,
        completedAt: new Date(),
      },
    });
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "FAILED" },
    });

    await removeReaction(slackClient, slackChannelId, messageTs, "eyes");

    await postThreadReply(
      slackClient,
      slackChannelId,
      messageTs,
      "Couldn't generate art for this one, but it's saved to your gallery!",
    );

    // Return 500 so QStash retries
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Wrap with QStash signature verification (deferred so build doesn't fail when keys are absent)
export async function POST(request: NextRequest) {
  const verified = verifySignatureAppRouter(handler);
  return verified(request);
}
