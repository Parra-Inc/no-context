import OpenAI from "openai";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { ART_STYLES, getStylePrompt } from "../src/lib/styles";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generic subject that lets the art style be the focus — includes people so the style is clearly visible
const GENERIC_PROMPT =
  "Two friends laughing together at an outdoor café, one pouring coffee while the other gestures mid-story, with a sunny city street in the background";

// Styles that need reference images for accurate generation
const STYLE_REFERENCE_IMAGES: Record<string, string> = {
  southpark: "public/images/examples/south-park.jpg",
  archer: "public/images/examples/archer.jpg",
  futurama: "public/images/examples/futurama.jpg",
  simpsons: "public/images/examples/simpsons.jpg",
  fallout: "public/images/examples/fallout.jpg",
};

function buildPrompt(styleId: string, hasReferenceImage: boolean): string {
  if (hasReferenceImage) {
    return `Illustrate this scene: "${GENERIC_PROMPT}"

Use the exact art style of the attached reference image — match the line work, coloring, and aesthetic.
Create an ORIGINAL scene — do NOT copy any characters, settings, or compositions from the reference image.

The image should:
- Be a simple, clean composition focused on the subject
- Not contain any text or words in the image
- Let the art style be the main focus`;
  }

  const stylePrompt = getStylePrompt(styleId);

  return `Create a ${stylePrompt} illustration of this scene: "${GENERIC_PROMPT}"

The image should:
- Be a simple, clean composition focused on the subject
- Not contain any text or words in the image
- Let the art style be the main focus`;
}

async function generateAndSave(
  styleId: string,
  referenceImage?: string,
): Promise<void> {
  const hasRef = !!referenceImage;
  const prompt = buildPrompt(styleId, hasRef);

  console.log(`\nGenerating: ${styleId}.png`);
  console.log(`  Prompt: ${prompt.slice(0, 100)}...`);

  let rawBuffer: Buffer;

  if (referenceImage) {
    const refPath = resolve(__dirname, "..", referenceImage);
    console.log(`  Using reference image: ${refPath}`);

    const curlResult = execSync(
      `curl -s https://api.openai.com/v1/images/edits ` +
        `-H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" ` +
        `-F "model=gpt-image-1" ` +
        `-F "prompt=${prompt.replace(/"/g, '\\"')}" ` +
        `-F "size=1536x1024" ` +
        `-F "n=1" ` +
        `-F "image=@${refPath}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    );

    const json = JSON.parse(curlResult.toString()) as {
      data?: Array<{ b64_json?: string }>;
      error?: { message: string };
    };
    if (json.error) {
      throw new Error(`gpt-image-1 edit failed: ${json.error.message}`);
    }
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error(`No image data returned for ${styleId}`);
    }
    rawBuffer = Buffer.from(b64, "base64");
  } else {
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
      throw new Error(`No image URL returned for ${styleId}`);
    }

    console.log(`  Downloading...`);
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    rawBuffer = Buffer.from(arrayBuffer);
  }

  // Center-crop to 3:2 (900x600) — matches the dashboard card aspect ratio
  const { width: srcWidth, height: srcHeight } = (await sharp(
    rawBuffer,
  ).metadata()) as { width: number; height: number };
  const targetRatio = 3 / 2;
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

  const buffer = await sharp(rawBuffer)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .resize(900, 600)
    .toBuffer();

  const outputPath = resolve(
    __dirname,
    "../public/images/dashboard/styles",
    `${styleId}.png`,
  );
  writeFileSync(outputPath, buffer);
  console.log(
    `  Saved to: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`,
  );
}

async function main() {
  const target = process.argv[2]; // optional: pass a style id to generate just one

  const styles = target
    ? ART_STYLES.filter((s) => s.id === target)
    : ART_STYLES;

  if (styles.length === 0) {
    console.error(`No style found matching "${target}"`);
    process.exit(1);
  }

  console.log(
    `Generating ${styles.length} dashboard style preview image(s)...`,
  );
  console.log(`Generic prompt: "${GENERIC_PROMPT}"\n`);

  for (const style of styles) {
    try {
      await generateAndSave(style.id, STYLE_REFERENCE_IMAGES[style.id]);
    } catch (err) {
      console.error(`  ERROR generating ${style.id}:`, err);
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
