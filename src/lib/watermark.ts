import sharp from "sharp";

const WATERMARK_TEXT = "Made with No Context";
const WATERMARK_FONT_SIZE = 20;
const WATERMARK_PADDING = 16;
const WATERMARK_OPACITY = 0.6;

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Create SVG text overlay positioned in the bottom-right corner
  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .watermark {
          fill: rgba(255, 255, 255, ${WATERMARK_OPACITY});
          font-size: ${WATERMARK_FONT_SIZE}px;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: bold;
        }
        .watermark-shadow {
          fill: rgba(0, 0, 0, ${WATERMARK_OPACITY * 0.5});
          font-size: ${WATERMARK_FONT_SIZE}px;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: bold;
        }
      </style>
      <text x="${width - WATERMARK_PADDING + 1}" y="${height - WATERMARK_PADDING + 1}" text-anchor="end" class="watermark-shadow">${WATERMARK_TEXT}</text>
      <text x="${width - WATERMARK_PADDING}" y="${height - WATERMARK_PADDING}" text-anchor="end" class="watermark">${WATERMARK_TEXT}</text>
    </svg>
  `;

  return image
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
