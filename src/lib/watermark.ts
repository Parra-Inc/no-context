import sharp from "sharp";
import path from "path";

const BOTTOM_MARGIN = 24;

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Load the watermark PNG and resize to ~22% of image width
  const targetWidth = Math.round(width * 0.22);
  const watermarkPath = path.join(process.cwd(), "public", "watermark.png");
  const watermarkResized = await sharp(watermarkPath)
    .resize({ width: targetWidth })
    .toBuffer();
  const watermarkMeta = await sharp(watermarkResized).metadata();
  const wmWidth = watermarkMeta.width || targetWidth;
  const wmHeight = watermarkMeta.height || Math.round(targetWidth * 0.21);

  const left = Math.round((width - wmWidth) / 2);
  const top = Math.round(height - wmHeight - BOTTOM_MARGIN);

  return image
    .composite([{ input: watermarkResized, top, left }])
    .png()
    .toBuffer();
}
