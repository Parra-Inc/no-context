import { POST } from "../route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifySlackSignature } from "@/lib/slack";

jest.mock("@/lib/ai/quote-detector");
jest.mock("@/lib/queue/queue");

const mockPrisma = prisma as unknown as Record<
  string,
  Record<string, jest.Mock>
>;
const mockVerify = verifySlackSignature as jest.Mock;

function createRequest(body: object) {
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

describe("POST /api/slack/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockReturnValue(true);
  });

  it("responds to Slack url_verification challenge", async () => {
    const req = createRequest({
      type: "url_verification",
      challenge: "test-challenge-token",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenge).toBe("test-challenge-token");
  });

  it("rejects requests with invalid Slack signature", async () => {
    mockVerify.mockReturnValue(false);

    const req = createRequest({
      type: "event_callback",
      event: { type: "message", text: "test" },
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("returns 200 immediately for valid message events", async () => {
    const req = createRequest({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "message",
        text: '"Test quote" — Someone',
        user: "U456",
        channel: "C789",
        ts: "1234567890.123456",
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it("ignores bot messages", async () => {
    const req = createRequest({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "message",
        text: "bot message",
        bot_id: "B123",
        channel: "C789",
        ts: "1234567890.123456",
      },
    });

    const response = await POST(req);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("ignores thread replies", async () => {
    const req = createRequest({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "message",
        text: "reply in thread",
        user: "U456",
        channel: "C789",
        ts: "1234567890.123456",
        thread_ts: "1234567890.000000",
      },
    });

    const response = await POST(req);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("ignores message edits (message_changed subtype)", async () => {
    const req = createRequest({
      type: "event_callback",
      team_id: "T123",
      event: {
        type: "message",
        subtype: "message_changed",
        text: "edited message",
        user: "U456",
        channel: "C789",
        ts: "1234567890.123456",
      },
    });

    const response = await POST(req);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
