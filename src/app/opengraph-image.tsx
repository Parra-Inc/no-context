import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "No Context — Turn Slack Quotes into AI Art";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function loadImage(filename: string): Promise<string> {
  const path = join(process.cwd(), "public", "images", "landing", filename);
  const data = await readFile(path);
  return `data:image/png;base64,${data.toString("base64")}`;
}

export default async function Image() {
  const [img1, img2, img3, img4, img5, img6] = await Promise.all([
    loadImage("showcase-vangogh.png"),
    loadImage("showcase-hokusai.png"),
    loadImage("showcase-dali.png"),
    loadImage("showcase-comic.png"),
    loadImage("showcase-pixel.png"),
    loadImage("showcase-warhol.png"),
  ]);

  const images = [img1, img2, img3, img4, img5, img6];
  const rotations = [-3, 2, -1.5, 2.5, -2, 1.5];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#fafaf8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(124, 58, 237, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(249, 112, 102, 0.06) 0%, transparent 50%)",
          display: "flex",
        }}
      />

      {/* Left section - Branding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 72,
          paddingRight: 32,
          width: "50%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Robot icon */}
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 64 64" fill="none" width="72" height="72">
              <line
                x1="32"
                y1="6"
                x2="32"
                y2="14"
                stroke="#7C3AED"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="32" cy="5" r="3" fill="#F97066" />
              <rect
                x="12"
                y="14"
                width="40"
                height="32"
                rx="8"
                fill="#7C3AED"
              />
              <circle cx="24" cy="28" r="5" fill="white" />
              <circle cx="40" cy="28" r="5" fill="white" />
              <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
              <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />
              <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066" />
              <rect
                x="4"
                y="24"
                width="6"
                height="12"
                rx="3"
                fill="#7C3AED"
                opacity="0.7"
              />
              <rect
                x="54"
                y="24"
                width="6"
                height="12"
                rx="3"
                fill="#7C3AED"
                opacity="0.7"
              />
              <rect
                x="22"
                y="48"
                width="20"
                height="10"
                rx="4"
                fill="#7C3AED"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: 1,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            No Context
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: "#4a4a4a",
              lineHeight: 1.3,
              marginTop: 8,
              display: "flex",
            }}
          >
            Turn Slack Quotes into AI Art
          </div>
        </div>

        {/* Quote bubble */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            backgroundColor: "white",
            border: "2px solid #1a1a1a",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "4px 4px 0px 0px #1a1a1a",
            maxWidth: 420,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "#4a4a4a",
              fontFamily: "Georgia, serif",
              display: "flex",
            }}
          >
            &ldquo;I swear the printer is haunted&rdquo;
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#7c3aed",
              marginTop: 8,
              fontWeight: 600,
              display: "flex",
            }}
          >
            — #no-context
          </div>
        </div>
      </div>

      {/* Right section - Art grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "50%",
          padding: "32px 48px 32px 16px",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              width: 168,
              height: 168,
              borderRadius: 12,
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px 0px #1a1a1a",
              overflow: "hidden",
              transform: `rotate(${rotations[i]}deg)`,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              width={168}
              height={168}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
