export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeMap = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  const iconSize = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  return (
    <span
      className={`font-display inline-flex items-center gap-1.5 tracking-tight ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize[size]} self-center`}
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
        <rect
          x="12"
          y="14"
          width="40"
          height="32"
          rx="8"
          fill="#7C3AED"
        />

        {/* Eyes */}
        <circle cx="24" cy="28" r="5" fill="white" />
        <circle cx="40" cy="28" r="5" fill="white" />
        <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
        <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />

        {/* Mouth */}
        <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066" />

        {/* Ears */}
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

        {/* Body hint */}
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
      <span>
        <span className="text-[#1A1A1A]">no</span>
        <span className="text-[#7C3AED]">context</span>
      </span>
    </span>
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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
      <rect
        x="12"
        y="14"
        width="40"
        height="32"
        rx="8"
        fill="#7C3AED"
      />

      {/* Eyes */}
      <circle cx="24" cy="28" r="5" fill="white" />
      <circle cx="40" cy="28" r="5" fill="white" />
      <circle cx="25" cy="27" r="2.5" fill="#1A1A1A" />
      <circle cx="41" cy="27" r="2.5" fill="#1A1A1A" />

      {/* Mouth */}
      <rect x="22" y="37" width="20" height="4" rx="2" fill="#F97066" />

      {/* Ears */}
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

      {/* Body hint */}
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
  );
}
