import OpenAI from "openai";
import sharp from "sharp";
import { resolve } from "path";
import { execSync } from "child_process";
import { getStylePrompt } from "../styles";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationResult {
  imageUrl: string;
  imageBuffer?: Buffer;
  prompt: string;
}

export interface ImageModelConfig {
  model: string;
  quality: string | null;
  size: string;
}

// Styles that have reference images for better generation
const STYLE_REFERENCE_IMAGES: Record<string, string> = {
  southpark: "public/images/examples/south-park.jpg",
  archer: "public/images/examples/archer.jpg",
  futurama: "public/images/examples/futurama.jpg",
  simpsons: "public/images/examples/simpsons.jpg",
  fallout: "public/images/examples/fallout.jpg",
};

function buildPrompt(
  quote: string,
  styleId: string,
  hasReferenceImage: boolean,
  customStyleDescription?: string,
): string {
  if (hasReferenceImage && !customStyleDescription) {
    return `Illustrate this quote: "${quote}"

Use the exact art style of the attached reference image — match the line work, coloring, and aesthetic.
Create ORIGINAL characters and an ORIGINAL scene depicting the quote — do NOT copy any characters, settings, or compositions from the reference image.

The image should:
- Depict the scene or situation described in the quote
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- IMPORTANT: Do NOT include any text, words, letters, or typography in the image — especially do NOT render the quote itself as text. The image should be purely illustrative with no written words.
- Be suitable for a workplace setting (no violence, explicit content)`;
  }

  const stylePrompt = getStylePrompt(styleId, customStyleDescription);

  return `Create a ${stylePrompt} illustration inspired by this quote: "${quote}"

The image should:
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- IMPORTANT: Do NOT include any text, words, letters, or typography in the image — especially do NOT render the quote itself as text. The image should be purely illustrative with no written words.
- Be suitable for a workplace setting (no violence, explicit content)`;
}

function softenPrompt(prompt: string): string {
  return prompt
    .replace(/\b(kill|die|dead|death|blood|fight|weapon|gun|knife)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function generateWithReference(
  prompt: string,
  refImagePath: string,
  size: string,
): Promise<ImageGenerationResult | null> {
  // Use curl for gpt-image-1 edits (Node.js FormData doesn't work with this endpoint)
  const refPath = resolve(process.cwd(), refImagePath);

  // gpt-image-1 edits supports: 1024x1024, 1536x1024, auto
  const supportedSizes = ["1024x1024", "1536x1024"];
  const editSize = supportedSizes.includes(size) ? size : "1536x1024";

  const curlResult = execSync(
    `curl -s https://api.openai.com/v1/images/edits ` +
      `-H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" ` +
      `-F "model=gpt-image-1" ` +
      `-F "prompt=${prompt.replace(/"/g, '\\"')}" ` +
      `-F "size=${editSize}" ` +
      `-F "n=1" ` +
      `-F "image=@${refPath}"`,
    { maxBuffer: 50 * 1024 * 1024 },
  );

  const json = JSON.parse(curlResult.toString()) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message: string };
  };
  if (json.error) {
    throw new Error(json.error.message);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data in gpt-image-1 response");
  }

  return {
    imageUrl: "",
    imageBuffer: Buffer.from(b64, "base64"),
    prompt,
  };
}

async function generateWithGptImage(
  prompt: string,
  quality: string,
  size: string,
): Promise<ImageGenerationResult | null> {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: size as "1024x1024" | "1536x1024" | "1024x1536" | "auto",
    quality: quality as "low" | "medium" | "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data in gpt-image-1 response");
  }

  return {
    imageUrl: "",
    imageBuffer: Buffer.from(b64, "base64"),
    prompt,
  };
}

async function generateWithDallE(
  prompt: string,
  model: "dall-e-2" | "dall-e-3",
  quality: string | null,
  size: string,
): Promise<ImageGenerationResult | null> {
  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: size as
      | "256x256"
      | "512x512"
      | "1024x1024"
      | "1792x1024"
      | "1024x1792",
    ...(quality && model === "dall-e-3"
      ? { quality: quality as "standard" | "hd" }
      : {}),
    response_format: "url",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL in DALL-E response");
  }

  return { imageUrl, prompt };
}

export async function generateImage(
  quote: string,
  styleId: string,
  customStyleDescription?: string,
  config?: ImageModelConfig,
): Promise<ImageGenerationResult | null> {
  const {
    model = "dall-e-3",
    quality = "standard",
    size = "1792x1024",
  } = config || {};

  const refImage = STYLE_REFERENCE_IMAGES[styleId];
  // Reference images only work with gpt-image-1 edits, not dall-e-2
  const useReference = !!refImage && model !== "dall-e-2";
  const prompt = buildPrompt(
    quote,
    styleId,
    useReference,
    customStyleDescription,
  );

  const generate = async (p: string) => {
    if (useReference) {
      return generateWithReference(p, refImage, size);
    }
    if (model === "gpt-image-1") {
      return generateWithGptImage(p, quality || "medium", size);
    }
    return generateWithDallE(
      p,
      model as "dall-e-2" | "dall-e-3",
      quality,
      size,
    );
  };

  try {
    return await generate(prompt);
  } catch (error: unknown) {
    // Check for content policy violation
    const isContentPolicy =
      error instanceof Error &&
      error.message?.includes("content_policy_violation");

    if (isContentPolicy) {
      // Retry with softened prompt
      try {
        return await generate(softenPrompt(prompt));
      } catch {
        // Second attempt also failed
        return null;
      }
    }

    throw error;
  }
}

export async function downloadImage(
  urlOrBuffer: string | Buffer,
  targetWidth = 1360,
  targetHeight = 1020,
): Promise<Buffer> {
  let buffer: Buffer;
  if (Buffer.isBuffer(urlOrBuffer)) {
    buffer = urlOrBuffer;
  } else {
    const response = await fetch(urlOrBuffer);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  // Center-crop to 4:3 then resize to target dimensions
  const meta = await sharp(buffer).metadata();
  const srcWidth = meta.width!;
  const srcHeight = meta.height!;
  const targetRatio = 4 / 3;
  const srcRatio = srcWidth / srcHeight;
  let cropWidth: number, cropHeight: number, cropLeft: number, cropTop: number;
  if (srcRatio > targetRatio) {
    cropHeight = srcHeight;
    cropWidth = Math.round(srcHeight * targetRatio);
    cropLeft = Math.round((srcWidth - cropWidth) / 2);
    cropTop = 0;
  } else {
    cropWidth = srcWidth;
    cropHeight = Math.round(srcWidth / targetRatio);
    cropLeft = 0;
    cropTop = Math.round((srcHeight - cropHeight) / 2);
  }

  return sharp(buffer)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .resize(targetWidth, targetHeight)
    .toBuffer();
}
