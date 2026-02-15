import { detectQuote } from "./quote-detector";

// Mock Anthropic SDK — define mockCreate inside factory to avoid hoisting TDZ issue
jest.mock("@anthropic-ai/sdk", () => {
  const mockFn = jest.fn();
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockFn },
  }));
  (MockAnthropic as any).__mockCreate = mockFn;
  return { __esModule: true, default: MockAnthropic };
});

import Anthropic from "@anthropic-ai/sdk";

const mockCreate = (Anthropic as any).__mockCreate as jest.Mock;

describe("detectQuote", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("rejects messages under 3 words", async () => {
    const result = await detectQuote("hi there");
    expect(result.isQuote).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it("rejects messages over 280 characters", async () => {
    const longMessage = "a".repeat(281);
    const result = await detectQuote(longMessage);
    expect(result.isQuote).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it("rejects emoji-only messages", async () => {
    const result = await detectQuote("😂 🎉 🔥");
    expect(result.isQuote).toBe(false);
  });

  it("classifies a valid out-of-context quote", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            is_quote: true,
            confidence: 0.95,
            extracted_quote: "I don't think that's how microwaves work",
            attributed_to: "Sarah",
          }),
        },
      ],
    });

    const result = await detectQuote(
      "\"I don't think that's how microwaves work\" — Sarah",
    );
    expect(result.isQuote).toBe(true);
    expect(result.confidence).toBe(0.95);
    expect(result.extractedQuote).toBe(
      "I don't think that's how microwaves work",
    );
    expect(result.attributedTo).toBe("Sarah");
  });

  it("rejects a regular conversation message", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            is_quote: false,
            confidence: 0.9,
            extracted_quote: null,
            attributed_to: null,
          }),
        },
      ],
    });

    const result = await detectQuote("hey has anyone seen the new feature?");
    expect(result.isQuote).toBe(false);
  });

  it("skips when confidence is below 0.7", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            is_quote: true,
            confidence: 0.5,
            extracted_quote: "maybe a quote",
            attributed_to: null,
          }),
        },
      ],
    });

    const result = await detectQuote("maybe a quote maybe not really");
    expect(result.isQuote).toBe(false);
    expect(result.confidence).toBe(0.5);
  });

  it("handles Claude API errors gracefully", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API error"));

    await expect(
      detectQuote("some valid looking quote here — Bob"),
    ).rejects.toThrow("API error");
  });
});
