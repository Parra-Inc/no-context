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

async function loadImage(...pathSegments: string[]): Promise<string> {
  const path = join(process.cwd(), "public", "images", ...pathSegments);
  const data = await readFile(path);
  return `data:image/png;base64,${data.toString("base64")}`;
}

export default async function Image() {
  const [logo, img1, img2, img3, img4, img5] = await Promise.all([
    loadImage("logo.png"),
    loadImage("landing", "showcase", "vangogh.png"),
    loadImage("landing", "showcase", "hokusai.png"),
    loadImage("landing", "showcase", "dali.png"),
    loadImage("landing", "showcase", "comic.png"),
    loadImage("landing", "showcase", "pixel.png"),
  ]);

  const images = [img1, img2, img3, img4, img5];
  const rotations = [-4, -1.5, 1, 3, -2.5];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafaf8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(ellipse 600px 400px at 15% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 70%), radial-gradient(ellipse 500px 350px at 85% 80%, rgba(249, 112, 102, 0.08) 0%, transparent 70%), radial-gradient(ellipse 400px 300px at 50% 50%, rgba(124, 58, 237, 0.03) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Decorative top line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #7C3AED, #F97066, #7C3AED)",
          display: "flex",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 40,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt="No Context"
          height={72}
          style={{
            height: 72,
            objectFit: "contain",
          }}
        />
      </div>

      {/* Subheading */}
      <div
        style={{
          display: "flex",
          fontSize: 30,
          fontWeight: 600,
          color: "#4a4a4a",
          lineHeight: 1.3,
          marginTop: 16,
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          letterSpacing: -0.5,
        }}
      >
        Your funniest Slack messages, reimagined as AI art
      </div>

      {/* Art image row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          marginTop: 32,
          position: "relative",
          zIndex: 2,
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              width: 160,
              height: 160,
              borderRadius: 16,
              border: "3px solid rgba(26, 26, 26, 0.12)",
              boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
              transform: `rotate(${rotations[i]}deg)`,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              width={160}
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

      {/* Quote at the bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 32,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 40,
            height: 2,
            backgroundColor: "#e0e0e0",
            borderRadius: 1,
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontStyle: "italic",
              color: "#6b6b6b",
              fontFamily: "Georgia, serif",
              display: "flex",
            }}
          >
            &ldquo;I swear the printer is haunted&rdquo;
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#7c3aed",
              fontWeight: 700,
              display: "flex",
            }}
          >
            — #no-context
          </div>
        </div>
        <div
          style={{
            width: 40,
            height: 2,
            backgroundColor: "#e0e0e0",
            borderRadius: 1,
            display: "flex",
          }}
        />
      </div>
    </div>,
    {
      ...size,
    },
  );
}
