import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#7C3AED",
        borderRadius: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width="140"
        height="140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antenna */}
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

        {/* Head */}
        <rect x="12" y="14" width="40" height="32" rx="8" fill="#7C3AED" />

        {/* Eyes */}
        <circle cx="24" cy="28" r="5" fill="white" />
        <circle cx="40" cy="28" r="5" fill="white" />
        <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
        <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />

        {/* Mouth */}
        <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066" />

        {/* Ears */}
        <rect x="4" y="24" width="6" height="12" rx="3" fill="#9F67FF" />
        <rect x="54" y="24" width="6" height="12" rx="3" fill="#9F67FF" />

        {/* Body hint */}
        <rect x="22" y="48" width="20" height="10" rx="4" fill="#9F67FF" />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
