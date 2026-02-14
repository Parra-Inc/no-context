import OpenAI from "openai";
import sharp from "sharp";
import { getStylePrompt } from "../styles";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
}

function buildPrompt(
  quote: string,
  styleId: string,
  customStyleDescription?: string,
): string {
  const stylePrompt = getStylePrompt(styleId, customStyleDescription);

  return `Create a ${stylePrompt} illustration inspired by this quote: "${quote}"

The image should:
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- Not contain any text or words in the image
- Be suitable for a workplace setting (no violence, explicit content)`;
}

function softenPrompt(prompt: string): string {
  return prompt
    .replace(/\b(kill|die|dead|death|blood|fight|weapon|gun|knife)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function generateImage(
  quote: string,
  styleId: string,
  customStyleDescription?: string,
): Promise<ImageGenerationResult | null> {
  const prompt = buildPrompt(quote, styleId, customStyleDescription);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL in DALL-E response");
    }

    return { imageUrl, prompt };
  } catch (error: unknown) {
    // Check for content policy violation
    const isContentPolicy =
      error instanceof Error &&
      error.message?.includes("content_policy_violation");

    if (isContentPolicy) {
      // Retry with softened prompt
      try {
        const softened = softenPrompt(prompt);
        const retryResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: softened,
          n: 1,
          size: "1792x1024",
          quality: "standard",
          response_format: "url",
        });

        const retryUrl = retryResponse.data?.[0]?.url;
        if (!retryUrl) {
          return null;
        }

        return { imageUrl: retryUrl, prompt: softened };
      } catch {
        // Second attempt also failed
        return null;
      }
    }

    throw error;
  }
}

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Center-crop 1792x1024 DALL-E output to 4:3 (1360x1020)
  return sharp(buffer)
    .extract({ left: 216, top: 2, width: 1360, height: 1020 })
    .toBuffer();
}
