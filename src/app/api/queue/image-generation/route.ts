import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import prisma from "@/lib/prisma";
import { generateImage, downloadImage } from "@/lib/ai/image-generator";
import { uploadImage } from "@/lib/storage";
import {
  TIER_HAS_WATERMARK,
  TIER_IMAGE_MODEL,
  TIER_IMAGE_QUALITY,
  TIER_IMAGE_SIZE,
} from "@/lib/stripe";
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
import { log } from "@/lib/logger";

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

  log.info("[image-generation-queue] Job received", {
    workspaceId,
    quoteId,
    imageGenerationId: job.imageGenerationId,
    styleId,
    hasCustomStyle: !!customStyleDescription,
    tier: job.tier,
    imageModel: job.imageModel,
  });

  // Backward compatibility: old in-flight jobs may lack imageGenerationId
  let imageGenerationId = job.imageGenerationId;
  if (!imageGenerationId) {
    log.warn(
      "[image-generation-queue] Job missing imageGenerationId, creating new record",
      {
        quoteId,
        workspaceId,
      },
    );
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
    log.info("[image-generation-queue] Created imageGeneration record", {
      imageGenerationId: gen.id,
    });
  }

  // Fall back to looking up the tier from the database if not provided in the job
  // (handles old jobs already in the queue before this feature was deployed)
  let tier = job.tier;
  if (!tier) {
    log.debug(
      "[image-generation-queue] Job missing tier, looking up from database",
      {
        workspaceId,
      },
    );
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      select: { tier: true },
    });
    tier = subscription?.tier || "FREE";
    log.info("[image-generation-queue] Resolved tier", { tier });
  }

  const slackClient = getSlackClient(encryptedBotToken);

  // Update statuses to PROCESSING
  log.info("[image-generation-queue] Updating status to PROCESSING", {
    imageGenerationId,
    quoteId,
  });
  await prisma.imageGeneration.update({
    where: { id: imageGenerationId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });
  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "PROCESSING" },
  });

  // Resolve image model config (from job, falling back to tier constants for old jobs)
  const imageModel = job.imageModel || TIER_IMAGE_MODEL[tier] || "dall-e-3";
  const imageQuality =
    job.imageQuality !== undefined
      ? job.imageQuality
      : (TIER_IMAGE_QUALITY[tier] ?? "standard");
  const imageSize = job.imageSize || TIER_IMAGE_SIZE[tier] || "1792x1024";

  log.info("[image-generation-queue] Starting image generation", {
    imageModel,
    imageQuality,
    imageSize,
    tier,
    quoteLength: quoteText.length,
  });

  try {
    const result = await generateImage(
      quoteText,
      styleId,
      customStyleDescription,
      { model: imageModel, quality: imageQuality, size: imageSize },
    );

    if (!result) {
      // Content policy rejection — post text fallback
      log.warn(
        "[image-generation-queue] Content policy rejection after retry",
        {
          imageGenerationId,
          quoteId,
          styleId,
        },
      );

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
    // Scale target dimensions proportionally for smaller source images
    const [srcW] = imageSize.split("x").map(Number);
    const targetWidth = srcW <= 512 ? 512 : 1360;
    const targetHeight = srcW <= 512 ? 384 : 1020;

    log.info("[image-generation-queue] Downloading and processing image", {
      targetWidth,
      targetHeight,
      hasBuffer: !!result.imageBuffer,
    });

    let imageBuffer = await downloadImage(
      result.imageBuffer ?? result.imageUrl,
      targetWidth,
      targetHeight,
    );

    // Use job.hasWatermark; fall back to tier lookup for old in-flight jobs
    const shouldWatermark =
      job.hasWatermark ?? TIER_HAS_WATERMARK[tier] ?? true;
    if (shouldWatermark) {
      log.debug("[image-generation-queue] Applying watermark");
      imageBuffer = await applyWatermark(imageBuffer);
    }

    log.info("[image-generation-queue] Uploading image to storage");
    const storedUrl = await uploadImage(imageBuffer, workspaceId, quoteId);
    log.info("[image-generation-queue] Image uploaded successfully", {
      storedUrl: storedUrl.substring(0, 100) + "...",
    });

    // Post to Slack — routed to a channel (same or different) or as a thread reply
    const postTargetChannelId = job.postToSlackChannelId;
    if (postTargetChannelId) {
      log.info("[image-generation-queue] Posting to Slack channel", {
        channelId: postTargetChannelId,
        includesPermalink: !!job.quoteOriginal,
      });
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
      log.info("[image-generation-queue] Posting to Slack thread");
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
      log.debug("[image-generation-queue] Fetching Slack permalink");
      slackPermalink = await getMessagePermalink(
        slackClient,
        slackChannelId,
        messageTs,
      );
    }

    // Update ImageGeneration as completed
    log.info("[image-generation-queue] Updating records to COMPLETED", {
      imageGenerationId,
      quoteId,
    });
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
    log.debug("[image-generation-queue] Updating Slack reactions");
    await removeReaction(slackClient, slackChannelId, messageTs, "eyes");
    await addReaction(
      slackClient,
      slackChannelId,
      messageTs,
      "white_check_mark",
    );

    // Increment usage
    log.info("[image-generation-queue] Updating usage records");
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
        quotaLimit: 3,
      },
    });

    // If usage exceeds monthly quota, decrement bonus credits
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
      select: { monthlyQuota: true, bonusCredits: true },
    });

    if (
      usageRecord.quotesUsed > (subscription?.monthlyQuota || 3) &&
      (subscription?.bonusCredits || 0) > 0
    ) {
      log.info("[image-generation-queue] Decrementing bonus credits", {
        workspaceId,
        quotesUsed: usageRecord.quotesUsed,
        monthlyQuota: subscription?.monthlyQuota,
      });
      await prisma.$executeRaw`
        UPDATE "Subscription"
        SET "bonusCredits" = "bonusCredits" - 1
        WHERE "workspaceId" = ${workspaceId}
          AND "bonusCredits" > 0
      `;
    }

    log.info("[image-generation-queue] Job completed successfully", {
      imageGenerationId,
      quoteId,
      workspaceId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    log.error("[image-generation-queue] Job failed with error", error, {
      imageGenerationId,
      quoteId,
      workspaceId,
      styleId,
      tier,
      imageModel,
    });

    // If the Slack token is invalid, mark workspace as disconnected and don't retry
    if (isSlackTokenError(error)) {
      log.error(
        "[image-generation-queue] Slack token error - marking workspace disconnected",
        error,
        {
          workspaceId,
          imageGenerationId,
        },
      );
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

    log.info(
      "[image-generation-queue] Updating records to FAILED and notifying user",
      {
        imageGenerationId,
        quoteId,
      },
    );

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

    try {
      await removeReaction(slackClient, slackChannelId, messageTs, "eyes");
      await postThreadReply(
        slackClient,
        slackChannelId,
        messageTs,
        "Couldn't generate art for this one, but it's saved to your gallery!",
      );
    } catch (slackError) {
      log.error(
        "[image-generation-queue] Failed to send failure notification to Slack",
        slackError,
      );
    }

    // Return 500 so QStash retries
    log.warn("[image-generation-queue] Returning 500 for QStash retry", {
      errorMessage,
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Wrap with QStash signature verification (deferred so build doesn't fail when keys are absent)
export async function POST(request: NextRequest) {
  const verified = verifySignatureAppRouter(handler);
  return verified(request);
}
