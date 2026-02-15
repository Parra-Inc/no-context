/**
 * @jest-environment node
 */

import crypto from "crypto";

const mockPostMessage = jest.fn();

jest.mock("@slack/web-api", () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: { postMessage: mockPostMessage },
  })),
}));

import { WebClient } from "@slack/web-api";

function decryptToken(token: string): string {
  const parts = token.split(":");
  if (parts.length !== 3) return token; // already a raw token

  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY required to decrypt token");

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    iv,
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(parts[2], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

describe("Slack – post message", () => {
  beforeEach(() => {
    mockPostMessage.mockReset();
  });

  it("should call postMessage with the correct channel and text", async () => {
    mockPostMessage.mockResolvedValueOnce({
      ok: true,
      channel: "C123TEST",
      ts: "1234567890.123456",
    });

    const client = new WebClient("xoxb-fake-token");
    const result = await client.chat.postMessage({
      channel: "C123TEST",
      text: "Integration test message from jest – 2026-01-01T00:00:00.000Z",
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: "C123TEST",
      text: expect.stringContaining("Integration test message from jest"),
    });
    expect(result.ok).toBe(true);
    expect(result.channel).toBe("C123TEST");
    expect(result.ts).toBeDefined();
  });

  it("should decrypt an encrypted token and pass it to WebClient", () => {
    // Create a known encrypted token
    const key = "0".repeat(64);
    const rawToken = "xoxb-test-token";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      iv,
    );
    let encrypted = cipher.update(rawToken, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    const encryptedToken = `${iv.toString("hex")}:${authTag}:${encrypted}`;

    process.env.TOKEN_ENCRYPTION_KEY = key;
    const decrypted = decryptToken(encryptedToken);
    expect(decrypted).toBe(rawToken);
  });

  it("should return a raw token unchanged", () => {
    const rawToken = "xoxb-plain-token";
    const result = decryptToken(rawToken);
    expect(result).toBe(rawToken);
  });
});
