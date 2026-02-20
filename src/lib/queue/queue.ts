import { Client } from "@upstash/qstash";
import { log } from "@/lib/logger";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export interface ImageGenerationJob {
  workspaceId: string;
  channelId: string;
  quoteId: string;
  imageGenerationId: string;
  messageTs: string;
  slackChannelId: string;
  quoteText: string;
  styleId: string;
  customStyleDescription?: string;
  encryptedBotToken: string;
  postToSlackChannelId?: string;
  quoteOriginal?: boolean;
  tier: string;
  hasWatermark: boolean;
  priority: number;
  imageModel?: string;
  imageQuality?: string | null;
  imageSize?: string;
}

export async function enqueueImageGeneration(
  job: ImageGenerationJob,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  log.info("[queue] Enqueuing image generation job", {
    workspaceId: job.workspaceId,
    quoteId: job.quoteId,
    imageGenerationId: job.imageGenerationId,
    styleId: job.styleId,
    tier: job.tier,
    priority: job.priority,
    imageModel: job.imageModel,
  });

  try {
    const result = await qstash.publishJSON({
      url: `${baseUrl}/api/queue/image-generation`,
      body: job,
      retries: 2,
      deduplicationId: `img-gen-${job.imageGenerationId}`,
    });

    log.info("[queue] Job enqueued successfully", {
      messageId: result.messageId,
      imageGenerationId: job.imageGenerationId,
    });

    return result.messageId;
  } catch (error) {
    log.error("[queue] Failed to enqueue job", error, {
      workspaceId: job.workspaceId,
      quoteId: job.quoteId,
      imageGenerationId: job.imageGenerationId,
    });
    throw error;
  }
}
