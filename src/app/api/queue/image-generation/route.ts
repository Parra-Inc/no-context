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

  // Update quote status to PROCESSING
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

      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: "FAILED",
          processingError: "Content policy rejection after retry",
        },
      });

      await removeReaction(slackClient, slackChannelId, messageTs, "art");
      return NextResponse.json({ ok: true });
    }

    // Download, apply watermark for free tier, and upload to Vercel Blob
    let imageBuffer = await downloadImage(result.imageUrl);
    if (TIER_HAS_WATERMARK[tier]) {
      imageBuffer = await applyWatermark(imageBuffer);
    }
    const storedUrl = await uploadImage(imageBuffer, workspaceId, quoteId);

    // Post to Slack — either routed to a different channel or as a thread reply
    const postTargetChannelId = job.postToSlackChannelId;
    if (postTargetChannelId && postTargetChannelId !== slackChannelId) {
      await postToChannel(
        slackClient,
        postTargetChannelId,
        `"${quoteText}"`,
        storedUrl,
      );
    } else {
      await postThreadReply(
        slackClient,
        slackChannelId,
        messageTs,
        `"${quoteText}"`,
        storedUrl,
      );
    }

    // Update database
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "COMPLETED",
        imageUrl: storedUrl,
        imagePrompt: result.prompt,
      },
    });

    // Update reactions
    await removeReaction(slackClient, slackChannelId, messageTs, "art");
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

    await prisma.usageRecord.upsert({
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // If the Slack token is invalid, mark workspace as disconnected and don't retry
    if (isSlackTokenError(error)) {
      await markWorkspaceDisconnected(workspaceId);
      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: "FAILED",
          processingError:
            "Slack connection lost. Please reconnect your workspace.",
        },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: "FAILED",
        processingError: errorMessage,
      },
    });

    await removeReaction(slackClient, slackChannelId, messageTs, "art");

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
