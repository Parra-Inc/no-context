import { Client } from "@upstash/qstash";

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
  tier: string;
  hasWatermark: boolean;
  priority: number;
}

export async function enqueueImageGeneration(
  job: ImageGenerationJob,
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const result = await qstash.publishJSON({
    url: `${baseUrl}/api/queue/image-generation`,
    body: job,
    retries: 2,
    deduplicationId: `img-gen-${job.imageGenerationId}`,
  });

  return result.messageId;
}
