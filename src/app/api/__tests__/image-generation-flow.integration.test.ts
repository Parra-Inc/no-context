/**
 * @jest-environment node
 *
 * End-to-end integration test for the image generation flow:
 *   Slack message → quote detection → QStash enqueue → DALL-E → blob upload → Slack post
 *
 * Mocked externals: blob storage, QStash, DALL-E, Anthropic, Slack API
 */

import { NextRequest } from "next/server";

// ─── Mock Definitions ───────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    slackEvent: { create: jest.fn().mockResolvedValue({}) },
    workspace: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    channel: { findUnique: jest.fn() },
    usageRecord: { findUnique: jest.fn(), upsert: jest.fn() },
    quote: { create: jest.fn(), update: jest.fn() },
    imageGeneration: { create: jest.fn(), update: jest.fn() },
    style: { findMany: jest.fn() },
    channelStyle: { findMany: jest.fn() },
    subscription: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/slack", () => ({
  verifySlackSignature: jest.fn().mockReturnValue(true),
  getSlackClient: jest.fn(),
  postThreadReply: jest.fn().mockResolvedValue(undefined),
  postToChannel: jest.fn().mockResolvedValue(undefined),
  addReaction: jest.fn().mockResolvedValue(undefined),
  removeReaction: jest.fn().mockResolvedValue(undefined),
  isSlackTokenError: jest.fn().mockReturnValue(false),
  markWorkspaceDisconnected: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/stripe", () => ({
  TIER_QUOTAS: { FREE: 5, STARTER: 25, TEAM: 100, BUSINESS: 500 },
  TIER_HAS_WATERMARK: {
    FREE: true,
    STARTER: false,
    TEAM: false,
    BUSINESS: false,
  },
}));

jest.mock("@/lib/ai/quote-detector", () => ({
  detectQuote: jest.fn(),
}));

jest.mock("@/lib/ai/image-generator", () => ({
  generateImage: jest.fn(),
  downloadImage: jest.fn(),
}));

jest.mock("@/lib/queue/queue", () => ({
  enqueueImageGeneration: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("@/lib/watermark", () => ({
  applyWatermark: jest.fn(),
}));

jest.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: jest.fn(
    (handler: (req: NextRequest) => Promise<Response>) => handler,
  ),
}));

jest.mock("@/lib/logger", () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── Imports (after mocks) ──────────────────────────────────────────

import { POST as slackEventsPost } from "@/app/api/slack/events/route";
import { POST as imageGenerationPost } from "@/app/api/queue/image-generation/route";
import prisma from "@/lib/prisma";
import {
  getSlackClient,
  addReaction,
  removeReaction,
  postThreadReply,
} from "@/lib/slack";
import { detectQuote } from "@/lib/ai/quote-detector";
import { generateImage, downloadImage } from "@/lib/ai/image-generator";
import { enqueueImageGeneration } from "@/lib/queue/queue";
import { uploadImage } from "@/lib/storage";
import { applyWatermark } from "@/lib/watermark";

// Slack client mock — created after imports so getSlackClient can return it
const mockSlackClient = {
  chat: { postMessage: jest.fn() },
  reactions: { add: jest.fn(), remove: jest.fn() },
  files: { uploadV2: jest.fn() },
  conversations: { info: jest.fn() },
  users: {
    info: jest.fn().mockResolvedValue({
      user: {
        profile: {
          display_name: "Test User",
          image_72: "https://avatars.example.com/user.jpg",
        },
        real_name: "Test User",
      },
    }),
  },
  team: { info: jest.fn() },
};

// ─── Test Constants ─────────────────────────────────────────────────

const WORKSPACE = {
  id: "workspace-123",
  slackTeamId: "T-TEAM-001",
  slackBotToken: "encrypted-bot-token",
  slackBotUserId: "U-BOT-001",
  isActive: true,
  needsReconnection: false,
  subscription: {
    tier: "FREE",
    monthlyQuota: 5,
    status: "ACTIVE",
  },
};

const CHANNEL = {
  id: "channel-456",
  workspaceId: "workspace-123",
  slackChannelId: "C-CHAN-001",
  styleMode: "RANDOM",
  postToChannelId: null,
  isActive: true,
  isPaused: false,
};

const QUOTE_RECORD = {
  id: "quote-789",
  workspaceId: "workspace-123",
  channelId: "channel-456",
  slackMessageTs: "1700000000.000001",
  quoteText: "I can't believe butter is a personality trait",
  attributedTo: "Sarah",
  styleId: "watercolor",
  status: "PENDING",
  aiConfidence: 0.95,
};

const IMAGE_GENERATION_RECORD = {
  id: "imggen-101",
  quoteId: "quote-789",
  workspaceId: "workspace-123",
  styleId: "watercolor",
  status: "PENDING",
  attemptNumber: 1,
};

const STORED_IMAGE_URL =
  "https://cdn.vercel-storage.com/workspace-123/quote-789-abc123.png";
const DALLE_IMAGE_URL =
  "https://oaidalleapiprodscus.blob.core.windows.net/generated/test-img.png";
const DALLE_PROMPT =
  "Create a watercolor illustration inspired by this quote...";
const FAKE_IMAGE_BUFFER = Buffer.from("fake-cropped-image-data");

// ─── Helpers ────────────────────────────────────────────────────────

function createSlackEventRequest(body: object): NextRequest {
  const bodyStr = JSON.stringify(body);
  return new NextRequest("http://localhost:3000/api/slack/events", {
    method: "POST",
    body: bodyStr,
    headers: {
      "content-type": "application/json",
      "x-slack-request-timestamp": Math.floor(Date.now() / 1000).toString(),
      "x-slack-signature": "v0=test",
    },
  });
}

function createImageGenRequest(job: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/queue/image-generation", {
    method: "POST",
    body: JSON.stringify(job),
    headers: { "content-type": "application/json" },
  });
}

/**
 * Flush the microtask / macrotask queue so fire-and-forget async work
 * inside processMessage() settles before we assert.
 */
async function waitForAsyncProcessing(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("Image Generation Flow: Slack Event → Image → Slack Post", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Slack client
    (getSlackClient as jest.Mock).mockReturnValue(mockSlackClient);
    mockSlackClient.users.info.mockResolvedValue({
      user: {
        profile: {
          display_name: "Test User",
          image_72: "https://avatars.example.com/user.jpg",
        },
        real_name: "Test User",
      },
    });

    // Prisma mocks for Phase 1 (events route / processMessage)
    (prisma.slackEvent.create as jest.Mock).mockResolvedValue({});
    (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(WORKSPACE);
    (prisma.channel.findUnique as jest.Mock).mockResolvedValue(CHANNEL);
    (prisma.usageRecord.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.style.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sty_watercolor",
        workspaceId: null,
        name: "watercolor",
        displayName: "Watercolor",
        description: "soft watercolor painting with gentle washes of color",
        isActive: true,
      },
    ]);
    (prisma.channelStyle.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (fn: Function) => {
        const tx = {
          quote: {
            create: jest.fn().mockResolvedValue(QUOTE_RECORD),
          },
          imageGeneration: {
            create: jest.fn().mockResolvedValue(IMAGE_GENERATION_RECORD),
          },
        };
        return fn(tx);
      },
    );
    (prisma.imageGeneration.update as jest.Mock).mockResolvedValue({});
    (prisma.quote.update as jest.Mock).mockResolvedValue({});
    (prisma.usageRecord.upsert as jest.Mock).mockResolvedValue({});

    // Quote detector
    (detectQuote as jest.Mock).mockResolvedValue({
      isQuote: true,
      confidence: 0.95,
      extractedQuote: "I can't believe butter is a personality trait",
      attributedTo: "Sarah",
      selectedStyleId: null,
    });

    // QStash
    (enqueueImageGeneration as jest.Mock).mockResolvedValue(
      "qstash-msg-id-123",
    );

    // DALL-E / image generator
    (generateImage as jest.Mock).mockResolvedValue({
      imageUrl: DALLE_IMAGE_URL,
      prompt: DALLE_PROMPT,
    });
    (downloadImage as jest.Mock).mockResolvedValue(FAKE_IMAGE_BUFFER);

    // Blob storage
    (uploadImage as jest.Mock).mockResolvedValue(STORED_IMAGE_URL);

    // Watermark (pass-through)
    (applyWatermark as jest.Mock).mockResolvedValue(FAKE_IMAGE_BUFFER);
  });

  // ─── Phase 1: Slack event → processMessage → QStash enqueue ──────

  describe("Phase 1: Slack event processing", () => {
    it("detects a quote and enqueues image generation via QStash", async () => {
      const req = createSlackEventRequest({
        type: "event_callback",
        team_id: "T-TEAM-001",
        event: {
          type: "message",
          text: '"I can\'t believe butter is a personality trait" — Sarah',
          user: "U-USER-001",
          channel: "C-CHAN-001",
          ts: "1700000000.000001",
        },
      });

      const response = await slackEventsPost(req);
      expect(response.status).toBe(200);

      await waitForAsyncProcessing();

      // 1. Slack event was persisted
      expect(prisma.slackEvent.create).toHaveBeenCalled();

      // 2. Workspace and channel were looked up
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slackTeamId: "T-TEAM-001" },
        include: { subscription: true },
      });
      expect(prisma.channel.findUnique).toHaveBeenCalledWith({
        where: {
          workspaceId_slackChannelId: {
            workspaceId: "workspace-123",
            slackChannelId: "C-CHAN-001",
          },
        },
      });

      // 3. Quota was checked
      expect(prisma.usageRecord.findUnique).toHaveBeenCalled();

      // 4. Quote detection was called with the message text
      expect(detectQuote).toHaveBeenCalledWith(
        '"I can\'t believe butter is a personality trait" — Sarah',
      );

      // 5. Art emoji reaction was added
      expect(addReaction).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000001",
        "eyes",
      );

      // 6. Quote + ImageGeneration created in a transaction
      expect(prisma.$transaction).toHaveBeenCalled();

      // 7. Job enqueued to QStash with correct payload
      expect(enqueueImageGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: "workspace-123",
          channelId: "channel-456",
          quoteId: "quote-789",
          imageGenerationId: "imggen-101",
          messageTs: "1700000000.000001",
          slackChannelId: "C-CHAN-001",
          quoteText: "I can't believe butter is a personality trait",
          styleId: "watercolor",
          encryptedBotToken: "encrypted-bot-token",
          tier: "FREE",
          priority: 4,
        }),
      );

      // 8. QStash message ID was saved back
      expect(prisma.imageGeneration.update).toHaveBeenCalledWith({
        where: { id: "imggen-101" },
        data: { qstashMessageId: "qstash-msg-id-123" },
      });
    });

    it("skips messages that are not detected as quotes", async () => {
      (detectQuote as jest.Mock).mockResolvedValue({
        isQuote: false,
        confidence: 0.3,
        extractedQuote: null,
        attributedTo: null,
      });

      const req = createSlackEventRequest({
        type: "event_callback",
        team_id: "T-TEAM-001",
        event: {
          type: "message",
          text: "hey has anyone seen the new feature?",
          user: "U-USER-001",
          channel: "C-CHAN-001",
          ts: "1700000000.000002",
        },
      });

      await slackEventsPost(req);
      await waitForAsyncProcessing();

      expect(detectQuote).toHaveBeenCalled();
      expect(enqueueImageGeneration).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("stops processing when monthly quota is exceeded", async () => {
      (prisma.usageRecord.findUnique as jest.Mock).mockResolvedValue({
        quotesUsed: 5, // FREE tier limit
      });

      const req = createSlackEventRequest({
        type: "event_callback",
        team_id: "T-TEAM-001",
        event: {
          type: "message",
          text: '"Something funny" — Dave',
          user: "U-USER-001",
          channel: "C-CHAN-001",
          ts: "1700000000.000003",
        },
      });

      await slackEventsPost(req);
      await waitForAsyncProcessing();

      // Quota limit reaction added
      expect(addReaction).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000003",
        "no-context-limit",
      );

      // Should NOT proceed to quote detection or enqueue
      expect(detectQuote).not.toHaveBeenCalled();
      expect(enqueueImageGeneration).not.toHaveBeenCalled();
    });
  });

  // ─── Phase 2: QStash handler → generate → upload → post ──────────

  describe("Phase 2: Image generation handler", () => {
    const JOB = {
      workspaceId: "workspace-123",
      channelId: "channel-456",
      quoteId: "quote-789",
      imageGenerationId: "imggen-101",
      messageTs: "1700000000.000001",
      slackChannelId: "C-CHAN-001",
      quoteText: "I can't believe butter is a personality trait",
      styleId: "watercolor",
      encryptedBotToken: "encrypted-bot-token",
      tier: "FREE",
      priority: 4,
    };

    it("generates an image, uploads to blob, and posts to Slack thread", async () => {
      const req = createImageGenRequest(JOB);
      const response = await imageGenerationPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);

      // 1. Status set to PROCESSING
      expect(prisma.imageGeneration.update).toHaveBeenCalledWith({
        where: { id: "imggen-101" },
        data: { status: "PROCESSING", startedAt: expect.any(Date) },
      });
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: "quote-789" },
        data: { status: "PROCESSING" },
      });

      // 2. DALL-E image generation called
      expect(generateImage).toHaveBeenCalledWith(
        "I can't believe butter is a personality trait",
        "watercolor",
        undefined,
      );

      // 3. Image downloaded and cropped
      expect(downloadImage).toHaveBeenCalledWith(DALLE_IMAGE_URL);

      // 4. Watermark applied (FREE tier)
      expect(applyWatermark).toHaveBeenCalledWith(FAKE_IMAGE_BUFFER);

      // 5. Image uploaded to blob storage
      expect(uploadImage).toHaveBeenCalledWith(
        FAKE_IMAGE_BUFFER,
        "workspace-123",
        "quote-789",
      );

      // 6. Posted to Slack as thread reply
      expect(postThreadReply).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000001",
        '"I can\'t believe butter is a personality trait"',
        STORED_IMAGE_URL,
      );

      // 7. Status set to COMPLETED with image URL
      expect(prisma.imageGeneration.update).toHaveBeenCalledWith({
        where: { id: "imggen-101" },
        data: {
          status: "COMPLETED",
          imageUrl: STORED_IMAGE_URL,
          imagePrompt: DALLE_PROMPT,
          completedAt: expect.any(Date),
        },
      });
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: "quote-789" },
        data: {
          status: "COMPLETED",
          imageUrl: STORED_IMAGE_URL,
        },
      });

      // 8. Reactions updated: art removed, checkmark added
      expect(removeReaction).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000001",
        "eyes",
      );
      expect(addReaction).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000001",
        "white_check_mark",
      );

      // 9. Monthly usage incremented
      expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId_periodStart: {
              workspaceId: "workspace-123",
              periodStart: expect.any(Date),
            },
          },
          update: { quotesUsed: { increment: 1 } },
        }),
      );
    });

    it("skips watermark for paid tiers", async () => {
      const paidJob = { ...JOB, tier: "TEAM" };
      const req = createImageGenRequest(paidJob);

      await imageGenerationPost(req);

      expect(applyWatermark).not.toHaveBeenCalled();
      expect(uploadImage).toHaveBeenCalledWith(
        FAKE_IMAGE_BUFFER,
        "workspace-123",
        "quote-789",
      );
    });

    it("handles DALL-E content policy rejection gracefully", async () => {
      (generateImage as jest.Mock).mockResolvedValue(null);

      const req = createImageGenRequest(JOB);
      const response = await imageGenerationPost(req);

      expect(response.status).toBe(200);

      // Text-only fallback posted
      expect(postThreadReply).toHaveBeenCalledWith(
        mockSlackClient,
        "C-CHAN-001",
        "1700000000.000001",
        "This quote was too powerful for art. It's been saved to your gallery as text-only.",
      );

      // Marked as FAILED
      expect(prisma.imageGeneration.update).toHaveBeenCalledWith({
        where: { id: "imggen-101" },
        data: expect.objectContaining({
          status: "FAILED",
          processingError: "Content policy rejection after retry",
        }),
      });

      // No image upload attempted
      expect(uploadImage).not.toHaveBeenCalled();
    });
  });

  // ─── Full end-to-end: both phases connected ───────────────────────

  describe("Full end-to-end flow", () => {
    it("processes a Slack quote from event to posted image", async () => {
      // ── Phase 1: Slack event triggers quote processing ──

      const slackReq = createSlackEventRequest({
        type: "event_callback",
        team_id: "T-TEAM-001",
        event: {
          type: "message",
          text: '"I can\'t believe butter is a personality trait" — Sarah',
          user: "U-USER-001",
          channel: "C-CHAN-001",
          ts: "1700000000.000001",
        },
      });

      const eventsResponse = await slackEventsPost(slackReq);
      expect(eventsResponse.status).toBe(200);
      await waitForAsyncProcessing();

      // Capture the job payload that was enqueued
      const enqueueMock = enqueueImageGeneration as jest.Mock;
      expect(enqueueMock).toHaveBeenCalledTimes(1);
      const capturedJob = enqueueMock.mock.calls[0][0];

      // Verify job has the right shape
      expect(capturedJob).toMatchObject({
        workspaceId: "workspace-123",
        quoteId: "quote-789",
        imageGenerationId: "imggen-101",
        quoteText: "I can't believe butter is a personality trait",
        styleId: "watercolor",
        tier: "FREE",
      });

      // ── Phase 2: QStash delivers job to image generation handler ──

      // Reset mocks between phases so assertions are clean
      jest.clearAllMocks();
      (prisma.imageGeneration.update as jest.Mock).mockResolvedValue({});
      (prisma.quote.update as jest.Mock).mockResolvedValue({});
      (prisma.usageRecord.upsert as jest.Mock).mockResolvedValue({});
      (generateImage as jest.Mock).mockResolvedValue({
        imageUrl: DALLE_IMAGE_URL,
        prompt: DALLE_PROMPT,
      });
      (downloadImage as jest.Mock).mockResolvedValue(FAKE_IMAGE_BUFFER);
      (uploadImage as jest.Mock).mockResolvedValue(STORED_IMAGE_URL);
      (applyWatermark as jest.Mock).mockResolvedValue(FAKE_IMAGE_BUFFER);

      const imageReq = createImageGenRequest(capturedJob);
      const imageResponse = await imageGenerationPost(imageReq);
      const imageData = await imageResponse.json();

      expect(imageResponse.status).toBe(200);
      expect(imageData.ok).toBe(true);

      // Verify the complete pipeline executed
      expect(generateImage).toHaveBeenCalledTimes(1);
      expect(downloadImage).toHaveBeenCalledTimes(1);
      expect(applyWatermark).toHaveBeenCalledTimes(1); // FREE tier → watermark
      expect(uploadImage).toHaveBeenCalledTimes(1);
      expect(postThreadReply).toHaveBeenCalledTimes(1);

      // Image was posted back to the original Slack thread
      expect(postThreadReply).toHaveBeenCalledWith(
        expect.anything(),
        "C-CHAN-001",
        "1700000000.000001",
        '"I can\'t believe butter is a personality trait"',
        STORED_IMAGE_URL,
      );

      // Database records marked COMPLETED
      expect(prisma.imageGeneration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "imggen-101" },
          data: expect.objectContaining({
            status: "COMPLETED",
            imageUrl: STORED_IMAGE_URL,
          }),
        }),
      );
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: "quote-789" },
        data: {
          status: "COMPLETED",
          imageUrl: STORED_IMAGE_URL,
        },
      });

      // Reactions: art removed, checkmark added
      expect(removeReaction).toHaveBeenCalledWith(
        expect.anything(),
        "C-CHAN-001",
        "1700000000.000001",
        "eyes",
      );
      expect(addReaction).toHaveBeenCalledWith(
        expect.anything(),
        "C-CHAN-001",
        "1700000000.000001",
        "white_check_mark",
      );

      // Usage incremented
      expect(prisma.usageRecord.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
