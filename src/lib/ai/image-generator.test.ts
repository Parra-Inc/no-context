import { generateImage } from "./image-generator";

// Mock OpenAI SDK — define mockGenerate inside factory to avoid hoisting TDZ issue
jest.mock("openai", () => {
  const mockFn = jest.fn();
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    images: { generate: mockFn },
  }));
  (MockOpenAI as any).__mockGenerate = mockFn;
  return { __esModule: true, default: MockOpenAI };
});

import OpenAI from "openai";

const mockGenerate = (OpenAI as any).__mockGenerate as jest.Mock;

describe("generateImage", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
  });

  it("returns the image URL on success", async () => {
    mockGenerate.mockResolvedValueOnce({
      data: [{ url: "https://example.com/image.png" }],
    });

    const result = await generateImage("funny quote here", "watercolor");
    expect(result).not.toBeNull();
    expect(result!.imageUrl).toBe("https://example.com/image.png");
    expect(result!.prompt).toContain("watercolor");
    expect(result!.prompt).toContain("funny quote here");
  });

  it("constructs the correct DALL-E prompt from quote and style", async () => {
    mockGenerate.mockResolvedValueOnce({
      data: [{ url: "https://example.com/image.png" }],
    });

    await generateImage("test quote", "picasso");

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "dall-e-3",
        size: "1792x1024",
      }),
    );

    const callArgs = mockGenerate.mock.calls[0][0];
    expect(callArgs.prompt).toContain("cubist");
    expect(callArgs.prompt).toContain("test quote");
  });

  it("retries with softened prompt on content policy rejection", async () => {
    const error = new Error("content_policy_violation");
    mockGenerate.mockRejectedValueOnce(error).mockResolvedValueOnce({
      data: [{ url: "https://example.com/retry.png" }],
    });

    const result = await generateImage("a kill quote", "watercolor");
    expect(result).not.toBeNull();
    expect(result!.imageUrl).toBe("https://example.com/retry.png");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("returns null after two content policy rejections", async () => {
    const error = new Error("content_policy_violation");
    mockGenerate.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

    const result = await generateImage("problematic quote", "watercolor");
    expect(result).toBeNull();
  });

  it("throws on unexpected API errors", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("rate limit exceeded"));

    await expect(generateImage("test quote", "watercolor")).rejects.toThrow(
      "rate limit exceeded",
    );
  });
});
