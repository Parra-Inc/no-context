import { generateImage } from "./image-generator";

// Mock OpenAI SDK
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn(),
    },
  })),
}));

import OpenAI from "openai";

function getMockGenerate() {
  const instance = new (OpenAI as unknown as jest.Mock)();
  return instance.images.generate as jest.Mock;
}

describe("generateImage", () => {
  it("returns the image URL on success", async () => {
    const generate = getMockGenerate();
    generate.mockResolvedValueOnce({
      data: [{ url: "https://example.com/image.png" }],
    });

    const result = await generateImage("funny quote here", "watercolor");
    expect(result).not.toBeNull();
    expect(result!.imageUrl).toBe("https://example.com/image.png");
    expect(result!.prompt).toContain("watercolor");
    expect(result!.prompt).toContain("funny quote here");
  });

  it("constructs the correct DALL-E prompt from quote and style", async () => {
    const generate = getMockGenerate();
    generate.mockResolvedValueOnce({
      data: [{ url: "https://example.com/image.png" }],
    });

    await generateImage("test quote", "picasso");

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "dall-e-3",
        size: "1792x1024",
      }),
    );

    const callArgs = generate.mock.calls[0][0];
    expect(callArgs.prompt).toContain("cubist");
    expect(callArgs.prompt).toContain("test quote");
  });

  it("retries with softened prompt on content policy rejection", async () => {
    const generate = getMockGenerate();
    const error = new Error("content_policy_violation");
    generate.mockRejectedValueOnce(error).mockResolvedValueOnce({
      data: [{ url: "https://example.com/retry.png" }],
    });

    const result = await generateImage("a kill quote", "watercolor");
    expect(result).not.toBeNull();
    expect(result!.imageUrl).toBe("https://example.com/retry.png");
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("returns null after two content policy rejections", async () => {
    const generate = getMockGenerate();
    const error = new Error("content_policy_violation");
    generate.mockRejectedValueOnce(error).mockRejectedValueOnce(error);

    const result = await generateImage("problematic quote", "watercolor");
    expect(result).toBeNull();
  });

  it("throws on unexpected API errors", async () => {
    const generate = getMockGenerate();
    generate.mockRejectedValueOnce(new Error("rate limit exceeded"));

    await expect(generateImage("test quote", "watercolor")).rejects.toThrow(
      "rate limit exceeded",
    );
  });
});
