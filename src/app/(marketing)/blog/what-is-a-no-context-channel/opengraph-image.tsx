import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt =
  "What Is a #no-context Channel? The Complete Guide | No Context";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function loadImage(filename: string): Promise<string> {
  const path = join(
    process.cwd(),
    "public",
    "images",
    "landing",
    "showcase",
    filename,
  );
  const data = await readFile(path);
  return `data:image/png;base64,${data.toString("base64")}`;
}

export default async function Image() {
  const [img1, img2, img3] = await Promise.all([
    loadImage("watercolor.png"),
    loadImage("vangogh.png"),
    loadImage("comic.png"),
  ]);

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
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(249, 112, 102, 0.06) 0%, transparent 50%)",
          display: "flex",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 72,
          paddingRight: 48,
          width: "60%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "#EDE9FE",
              color: "#7C3AED",
              fontSize: 16,
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: 20,
              display: "flex",
              letterSpacing: 1,
              textTransform: "uppercase" as const,
            }}
          >
            The Complete Guide
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: 1.1,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>What Is a</span>
            <span style={{ color: "#7C3AED" }}>#no-context</span>
            <span>Channel?</span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#4a4a4a",
            lineHeight: 1.4,
            marginTop: 20,
            display: "flex",
          }}
        >
          The funniest Slack channel your team isn&apos;t using yet.
        </div>

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 32,
          }}
        >
          <svg viewBox="0 0 64 64" fill="none" width="36" height="36">
            <rect x="12" y="14" width="40" height="32" rx="8" fill="#7C3AED" />
            <circle cx="24" cy="28" r="5" fill="white" />
            <circle cx="40" cy="28" r="5" fill="white" />
            <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
            <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />
            <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066" />
          </svg>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1a1a1a",
              display: "flex",
            }}
          >
            nocontextbot.com
          </div>
        </div>
      </div>

      {/* Right - Art samples */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "40%",
          padding: "48px 48px 48px 0",
          gap: 16,
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {[img1, img2, img3].map((src, i) => (
          <div
            key={i}
            style={{
              width: "100%",
              height: 160,
              borderRadius: 16,
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px 0px #1a1a1a",
              overflow: "hidden",
              transform: `rotate(${[-2, 1.5, -1][i]}deg)`,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              width={400}
              height={160}
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
