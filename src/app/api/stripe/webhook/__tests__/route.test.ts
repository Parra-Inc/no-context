/**
 * @jest-environment node
 */

import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock stripe module
jest.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
  TIER_QUOTAS: {
    FREE: 5,
    STARTER: 25,
    TEAM: 100,
    BUSINESS: 500,
    ENTERPRISE: 2000,
  },
  TIER_MAX_CHANNELS: {
    FREE: 1,
    STARTER: 1,
    TEAM: 3,
    BUSINESS: Infinity,
    ENTERPRISE: Infinity,
  },
  TIER_HAS_WATERMARK: {
    FREE: true,
    STARTER: false,
    TEAM: false,
    BUSINESS: false,
    ENTERPRISE: false,
  },
  TIER_IMAGE_SIZE: {
    FREE: "1792x1024",
    STARTER: "1792x1024",
    TEAM: "1792x1024",
    BUSINESS: "1792x1024",
    ENTERPRISE: "1792x1024",
  },
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    subscription: {
      update: jest.fn(),
    },
  },
}));

import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock;
const mockSubUpdate = (
  prisma as unknown as { subscription: { update: jest.Mock } }
).subscription.update;

function createRequest(body: string) {
  return new NextRequest("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    body,
    headers: {
      "stripe-signature": "test_sig",
    },
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing signature", async () => {
    const req = new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("rejects invalid signatures", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = createRequest("{}");
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("handles customer.subscription.deleted — downgrades to FREE", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_123",
        },
      },
    });

    const req = createRequest("{}");
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mockSubUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: "cus_123" },
        data: expect.objectContaining({
          tier: "FREE",
          status: "CANCELED",
          monthlyQuota: 5,
        }),
      }),
    );
  });

  it("handles invoice.payment_failed — sets PAST_DUE status", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_456",
        },
      },
    });

    const req = createRequest("{}");
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mockSubUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: "cus_456" },
        data: { status: "PAST_DUE" },
      }),
    );
  });

  it("ignores unhandled event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "some.unknown.event",
      data: { object: {} },
    });

    const req = createRequest("{}");
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mockSubUpdate).not.toHaveBeenCalled();
  });
});
