import sharp from "sharp";

const ROBOT_SIZE = 36;
const GAP = 8;
const PADDING_X = 14;
const PADDING_Y = 10;
const BOTTOM_MARGIN = 16;
const BACKDROP_OPACITY = 0.7;
const BACKDROP_RADIUS = 10;

// "nocontextbot.com" rendered as SVG paths (font-independent)
// Each letter traced at a baseline scale; we translate & scale at render time.
// Letters: n o c o n t e x t b o t . c o m
// Using a clean, bold geometric sans-serif style.
function renderTextPaths(x: number, centerY: number, scale: number): string {
  // Pre-rendered path data for "nocontextbot.com" in bold sans-serif at ~14px cap height
  // Split into three color groups: "no" (dark), "context" (purple), "bot.com" (dark)
  const darkColor = "#1A1A1A";
  const purpleColor = "#7C3AED";

  // Use individual rect-based letter forms for reliability across all SVG renderers.
  // Each "letter" is built from simple rectangles and circles — no font needed.
  // Approx 10px wide per char, 14px tall, at scale=1

  const charH = 14;
  const charW = 9;
  const spacing = 11;
  const dotSize = 3;

  const letters: { char: string; color: string }[] = [
    { char: "n", color: darkColor },
    { char: "o", color: darkColor },
    { char: "c", color: purpleColor },
    { char: "o", color: purpleColor },
    { char: "n", color: purpleColor },
    { char: "t", color: purpleColor },
    { char: "e", color: purpleColor },
    { char: "x", color: purpleColor },
    { char: "t", color: purpleColor },
    { char: "b", color: darkColor },
    { char: "o", color: darkColor },
    { char: "t", color: darkColor },
    { char: ".", color: darkColor },
    { char: "c", color: darkColor },
    { char: "o", color: darkColor },
    { char: "m", color: darkColor },
  ];

  const offsetY = centerY - (charH * scale) / 2;

  let paths = "";
  letters.forEach((l, i) => {
    const lx = x + i * spacing * scale;
    const ly = offsetY;
    const s = scale;
    paths += letterToPath(l.char, lx, ly, s, l.color, charW, charH, dotSize);
  });

  // Return with a group to avoid clipping issues
  return `<g>${paths}</g>`;
}

function letterToPath(
  char: string,
  x: number,
  y: number,
  s: number,
  color: string,
  w: number,
  h: number,
  dotSize: number,
): string {
  // Stroke-width for letter outlines
  const sw = 2.2 * s;
  const r = (w / 2) * s; // radius for round letters
  const cx = x + r; // center x for round letters
  const cy = y + (h / 2) * s; // center y
  const top = y;
  const bot = y + h * s;
  const left = x;
  const right = x + w * s;
  const mid = y + (h * s) / 2;

  switch (char) {
    case "n":
      return `
        <line x1="${left}" y1="${bot}" x2="${left}" y2="${mid}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M${left},${mid} Q${left},${top + 2 * s} ${cx},${top + 2 * s} Q${right},${top + 2 * s} ${right},${mid}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${right}" y1="${mid}" x2="${right}" y2="${bot}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case "o":
      return `<ellipse cx="${cx}" cy="${cy}" rx="${r - s}" ry="${(h / 2 - 1) * s}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
    case "c":
      return `<path d="M${right - s},${top + 3 * s} A${r - s},${(h / 2 - 1) * s} 0 1,0 ${right - s},${bot - 3 * s}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case "t":
      return `
        <line x1="${cx}" y1="${top}" x2="${cx}" y2="${bot}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${left}" y1="${top + 3 * s}" x2="${right}" y2="${top + 3 * s}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case "e":
      return `
        <path d="M${right - s},${mid - s} A${r - s},${(h / 2 - 1) * s} 0 1,0 ${right - s},${bot - 3 * s}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${left + s}" y1="${mid}" x2="${right - s}" y2="${mid}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case "x":
      return `
        <line x1="${left + s}" y1="${top + 2 * s}" x2="${right - s}" y2="${bot - 2 * s}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${right - s}" y1="${top + 2 * s}" x2="${left + s}" y2="${bot - 2 * s}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case "b":
      return `
        <line x1="${left}" y1="${top}" x2="${left}" y2="${bot}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M${left},${mid} Q${right + s},${mid - 4 * s} ${right},${mid}" fill="none" stroke="${color}" stroke-width="${sw}"/>
        <path d="M${left},${mid} Q${right + s},${mid + 4 * s} ${right},${mid}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
    case "m":
      return `
        <line x1="${left}" y1="${bot}" x2="${left}" y2="${mid}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M${left},${mid} Q${left},${top + 2 * s} ${cx - 1 * s},${top + 2 * s} Q${cx},${top + 2 * s} ${cx},${mid}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${cx}" y1="${mid}" x2="${cx}" y2="${bot}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M${cx},${mid} Q${cx},${top + 2 * s} ${right - 1 * s},${top + 2 * s} Q${right},${top + 2 * s} ${right},${mid}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="${right}" y1="${mid}" x2="${right}" y2="${bot}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    case ".":
      return `<circle cx="${x + (dotSize * s) / 2}" cy="${bot - (dotSize * s) / 2}" r="${(dotSize * s) / 2}" fill="${color}"/>`;
    default:
      return "";
  }
}

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Scale watermark relative to image width (target ~20% of image width)
  const targetWidth = width * 0.22;
  const textScale = targetWidth / (16 * 11); // 16 chars * 11px spacing
  const textWidth = 16 * 11 * textScale;

  const contentWidth = ROBOT_SIZE + GAP + textWidth;
  const backdropWidth = contentWidth + PADDING_X * 2;
  const backdropHeight = ROBOT_SIZE + PADDING_Y * 2;

  const backdropX = (width - backdropWidth) / 2;
  const backdropY = height - backdropHeight - BOTTOM_MARGIN;

  const robotX = backdropX + PADDING_X;
  const robotY = backdropY + PADDING_Y;
  const robotScale = ROBOT_SIZE / 64;

  const textX = robotX + ROBOT_SIZE + GAP;
  const textCenterY = robotY + ROBOT_SIZE / 2;

  const textPaths = renderTextPaths(textX, textCenterY, textScale);

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

      ${textPaths}
    </svg>
  `;

  return image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
