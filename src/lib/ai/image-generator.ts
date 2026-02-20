import OpenAI from "openai";
import sharp from "sharp";
import { resolve } from "path";
import { execSync } from "child_process";
import { getStylePrompt } from "../styles";
import { log } from "@/lib/logger";

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
  log.info("[image-generator] generateWithReference started", {
    refImagePath,
    size,
    promptLength: prompt.length,
  });

  try {
    // Use curl for gpt-image-1 edits (Node.js FormData doesn't work with this endpoint)
    const refPath = resolve(process.cwd(), refImagePath);

    // gpt-image-1 edits supports: 1024x1024, 1536x1024, auto
    const supportedSizes = ["1024x1024", "1536x1024"];
    const editSize = supportedSizes.includes(size) ? size : "1536x1024";

    log.info("[image-generator] Calling OpenAI edits API with curl", {
      refPath,
      editSize,
      model: "gpt-image-1",
    });

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
      log.error("[image-generator] OpenAI edits API error", {
        error: json.error,
        refPath,
        editSize,
      });
      throw new Error(json.error.message);
    }

    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      log.error("[image-generator] No image data in gpt-image-1 response", {
        response: JSON.stringify(json).substring(0, 500),
      });
      throw new Error("No image data in gpt-image-1 response");
    }

    log.info("[image-generator] generateWithReference completed successfully", {
      imageBufferSize: b64.length,
    });

    return {
      imageUrl: "",
      imageBuffer: Buffer.from(b64, "base64"),
      prompt,
    };
  } catch (error) {
    log.error("[image-generator] generateWithReference failed", error, {
      refImagePath,
      size,
    });
    throw error;
  }
}

async function generateWithGptImage(
  prompt: string,
  quality: string,
  size: string,
): Promise<ImageGenerationResult | null> {
  log.info("[image-generator] generateWithGptImage started", {
    quality,
    size,
    promptLength: prompt.length,
  });

  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: size as "1024x1024" | "1536x1024" | "1024x1536" | "auto",
      quality: quality as "low" | "medium" | "high",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      log.error("[image-generator] No image data in gpt-image-1 response", {
        responseData: response.data,
      });
      throw new Error("No image data in gpt-image-1 response");
    }

    log.info("[image-generator] generateWithGptImage completed successfully", {
      imageBufferSize: b64.length,
    });

    return {
      imageUrl: "",
      imageBuffer: Buffer.from(b64, "base64"),
      prompt,
    };
  } catch (error) {
    log.error("[image-generator] generateWithGptImage failed", error, {
      quality,
      size,
    });
    throw error;
  }
}

async function generateWithDallE(
  prompt: string,
  model: "dall-e-2" | "dall-e-3",
  quality: string | null,
  size: string,
): Promise<ImageGenerationResult | null> {
  log.info("[image-generator] generateWithDallE started", {
    model,
    quality,
    size,
    promptLength: prompt.length,
  });

  try {
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
      log.error("[image-generator] No image URL in DALL-E response", {
        responseData: response.data,
        model,
      });
      throw new Error("No image URL in DALL-E response");
    }

    log.info("[image-generator] generateWithDallE completed successfully", {
      imageUrl: imageUrl.substring(0, 100) + "...",
    });

    return { imageUrl, prompt };
  } catch (error) {
    log.error("[image-generator] generateWithDallE failed", error, {
      model,
      quality,
      size,
    });
    throw error;
  }
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

  log.info("[image-generator] generateImage called", {
    styleId,
    hasCustomStyle: !!customStyleDescription,
    model,
    quality,
    size,
    quoteLength: quote.length,
  });

  const refImage = STYLE_REFERENCE_IMAGES[styleId];
  // Reference images only work with gpt-image-1 edits, not dall-e-2
  const useReference = !!refImage && model !== "dall-e-2";
  const prompt = buildPrompt(
    quote,
    styleId,
    useReference,
    customStyleDescription,
  );

  log.debug("[image-generator] Built prompt", {
    useReference,
    promptLength: prompt.length,
  });

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
    const result = await generate(prompt);
    log.info("[image-generator] Image generation succeeded");
    return result;
  } catch (error: unknown) {
    // Check for content policy violation
    const isContentPolicy =
      error instanceof Error &&
      error.message?.includes("content_policy_violation");

    if (isContentPolicy) {
      log.warn(
        "[image-generator] Content policy violation, retrying with softened prompt",
      );
      // Retry with softened prompt
      try {
        const result = await generate(softenPrompt(prompt));
        log.info("[image-generator] Retry with softened prompt succeeded");
        return result;
      } catch (retryError) {
        log.error(
          "[image-generator] Retry with softened prompt failed",
          retryError,
        );
        // Second attempt also failed
        return null;
      }
    }

    log.error("[image-generator] Image generation failed", error, {
      styleId,
      model,
    });
    throw error;
  }
}

export async function downloadImage(
  urlOrBuffer: string | Buffer,
  targetWidth = 1360,
  targetHeight = 1020,
): Promise<Buffer> {
  log.info("[image-generator] downloadImage started", {
    isBuffer: Buffer.isBuffer(urlOrBuffer),
    targetWidth,
    targetHeight,
  });

  try {
    let buffer: Buffer;
    if (Buffer.isBuffer(urlOrBuffer)) {
      buffer = urlOrBuffer;
    } else {
      log.debug("[image-generator] Fetching image from URL", {
        url: urlOrBuffer.substring(0, 100) + "...",
      });
      const response = await fetch(urlOrBuffer);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      log.debug("[image-generator] Image fetched successfully", {
        bufferSize: buffer.length,
      });
    }

    // Center-crop to 4:3 then resize to target dimensions
    const meta = await sharp(buffer).metadata();
    const srcWidth = meta.width!;
    const srcHeight = meta.height!;
    const targetRatio = 4 / 3;
    const srcRatio = srcWidth / srcHeight;
    let cropWidth: number,
      cropHeight: number,
      cropLeft: number,
      cropTop: number;
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

    log.debug("[image-generator] Image processing", {
      srcWidth,
      srcHeight,
      cropWidth,
      cropHeight,
      targetWidth,
      targetHeight,
    });

    const processed = await sharp(buffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(targetWidth, targetHeight)
      .toBuffer();

    log.info("[image-generator] downloadImage completed successfully", {
      processedSize: processed.length,
    });

    return processed;
  } catch (error) {
    log.error("[image-generator] downloadImage failed", error, {
      isBuffer: Buffer.isBuffer(urlOrBuffer),
      targetWidth,
      targetHeight,
    });
    throw error;
  }
}
