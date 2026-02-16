import sharp from "sharp";

const ROBOT_SIZE = 36;
const FONT_SIZE = 18;
const GAP = 6;
const PADDING_X = 12;
const PADDING_Y = 8;
const BOTTOM_MARGIN = 14;
const BACKDROP_OPACITY = 0.6;
const BACKDROP_RADIUS = 8;
const TEXT_WIDTH = 182;

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  const contentWidth = ROBOT_SIZE + GAP + TEXT_WIDTH;
  const backdropWidth = contentWidth + PADDING_X * 2;
  const backdropHeight = ROBOT_SIZE + PADDING_Y * 2;

  const backdropX = (width - backdropWidth) / 2;
  const backdropY = height - backdropHeight - BOTTOM_MARGIN;

  const robotX = backdropX + PADDING_X;
  const robotY = backdropY + PADDING_Y;
  const robotScale = ROBOT_SIZE / 64;

  const textX = robotX + ROBOT_SIZE + GAP;
  const textCenterY = robotY + ROBOT_SIZE / 2;

  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${backdropX}"
        y="${backdropY}"
        width="${backdropWidth}"
        height="${backdropHeight}"
        rx="${BACKDROP_RADIUS}"
        ry="${BACKDROP_RADIUS}"
        fill="rgba(255, 255, 255, ${BACKDROP_OPACITY})"
      />

      <g transform="translate(${robotX}, ${robotY}) scale(${robotScale})">
        <line x1="32" y1="6" x2="32" y2="14" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="5" r="3" fill="#F97066"/>
        <rect x="12" y="14" width="40" height="32" rx="8" fill="#7C3AED"/>
        <circle cx="24" cy="28" r="5" fill="white"/>
        <circle cx="40" cy="28" r="5" fill="white"/>
        <circle cx="25" cy="27" r="2.5" fill="#1A1A1A"/>
        <circle cx="41" cy="27" r="2.5" fill="#1A1A1A"/>
        <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066"/>
        <rect x="4" y="24" width="6" height="12" rx="3" fill="#7C3AED" opacity="0.7"/>
        <rect x="54" y="24" width="6" height="12" rx="3" fill="#7C3AED" opacity="0.7"/>
        <rect x="22" y="48" width="20" height="10" rx="4" fill="#7C3AED" opacity="0.5"/>
      </g>

      <text
        x="${textX}"
        y="${textCenterY}"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="bold"
        font-size="${FONT_SIZE}px"
      >
        <tspan fill="#1A1A1A">no</tspan><tspan fill="#7C3AED">context</tspan><tspan fill="#1A1A1A">bot.com</tspan>
      </text>
    </svg>
  `;

  return image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
