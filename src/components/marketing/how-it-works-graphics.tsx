"use client";

import Image from "next/image";

/* ---- No Context bot avatar (matches hero) ---- */
function BotAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.75, height: size * 0.75 }}
      >
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
        <rect x="12" y="14" width="40" height="32" rx="8" fill="#7C3AED" />
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
    </span>
  );
}

/* ---- Sidebar channel item ---- */
function SidebarChannel({
  name,
  active = false,
  muted = false,
}: {
  name: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] ${
        active
          ? "bg-[#1164A3] font-semibold text-white"
          : muted
            ? "text-[#6B6B6D]"
            : "text-[#BCABBC]"
      }`}
    >
      <span className="text-[10px] opacity-70">#</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

/* ---- Slack message row ---- */
function SlackMessage({
  avatar,
  initials,
  color,
  name,
  time,
  children,
  reactions,
  badge,
}: {
  avatar?: string;
  initials: string;
  color: string;
  name: string;
  time: string;
  children: React.ReactNode;
  reactions?: { emoji: string; count: number }[];
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-2 px-4 py-1.5">
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="h-8 w-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-[#1D1C1D]">{name}</span>
          {badge && (
            <span className="rounded bg-[#ECDEEC] px-1 py-px text-[9px] font-medium text-[#4A154B]">
              {badge}
            </span>
          )}
          <span className="text-[11px] text-[#616061]">{time}</span>
        </div>
        <div className="mt-0.5 text-[13px] leading-snug text-[#1D1C1D]">
          {children}
        </div>
        {reactions && reactions.length > 0 && (
          <div className="mt-1 flex gap-1">
            {reactions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded-full border border-[#E5E5E5] bg-[#F8F8F8] px-1.5 py-0.5 text-[11px]"
              >
                {r.emoji}{" "}
                <span className="text-[10px] text-[#616061]">{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   GRAPHIC 1 — Slack app with sidebar + #no-context channel
   ================================================================ */
export function SetupChannelGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-80">
        {/* ---- Sidebar ---- */}
        <div className="hidden w-[120px] shrink-0 flex-col bg-[#4A154B] text-[11px] sm:flex">
          {/* Workspace header */}
          <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[9px] font-bold text-white">
              A
            </div>
            <span className="truncate font-bold text-white">Acme Inc</span>
          </div>

          {/* Nav items */}
          <div className="space-y-0.5 px-2 py-2">
            <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-[#BCABBC]">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 5h2v2H7V5zm0 4h2v2H7V9z" />
              </svg>
              Threads
            </div>
            <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-[#BCABBC]">
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2 4h12v1H2V4zm0 3.5h12v1H2v-1zM2 11h8v1H2v-1z" />
              </svg>
              DMs
            </div>
          </div>

          {/* Channels section */}
          <div className="px-2">
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold tracking-wide text-[#BCABBC]">
                Channels
              </span>
            </div>
            <div className="space-y-px">
              <SidebarChannel name="general" muted />
              <SidebarChannel name="engineering" />
              <SidebarChannel name="design" muted />
              <SidebarChannel name="no-context" active />
              <SidebarChannel name="random" muted />
            </div>
          </div>
        </div>

        {/* ---- Main content area ---- */}
        <div className="flex flex-1 flex-col bg-white">
          {/* Channel header */}
          <div className="flex items-center border-b border-[#E5E5E5] px-4 py-2">
            <span className="text-[14px] font-bold text-[#1D1C1D]">
              # no-context
            </span>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-hidden py-2">
            <SlackMessage
              avatar="/images/landing/avatar/tara.jpg"
              initials="TR"
              color="#2BAC76"
              name="Tara R."
              time="9:01 AM"
            >
              joined #no-context.
            </SlackMessage>
            <SlackMessage
              avatar="/images/landing/avatar/dan.jpg"
              initials="DK"
              color="#E8912D"
              name="Dan K."
              time="9:17 AM"
              reactions={[{ emoji: "😂", count: 4 }]}
            >
              &ldquo;I peaked in the 3rd grade&rdquo;
            </SlackMessage>
            <SlackMessage
              avatar="/images/landing/avatar/rachel.jpg"
              initials="RP"
              color="#1264A3"
              name="Rachel P."
              time="9:44 AM"
              reactions={[{ emoji: "😂", count: 7 }]}
            >
              This channel is already my favorite
            </SlackMessage>
          </div>

          {/* Composer */}
          <div className="border-t border-[#E5E5E5] px-4 py-2">
            <div className="rounded-lg border border-[#CCCCCC] px-3 py-1.5 text-[11px] text-[#8D8D8D]">
              Message #no-context
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   GRAPHIC 2 — A quote being posted
   ================================================================ */
export function DropQuoteGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-80 flex-col">
        {/* Channel header */}
        <div className="flex items-center border-b border-[#E5E5E5] px-4 py-2">
          <span className="text-[14px] font-bold text-[#1D1C1D]">
            # no-context
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden py-2">
          <SlackMessage
            avatar="/images/landing/avatar/jamie.jpg"
            initials="JT"
            color="#7C3AED"
            name="Jamie T."
            time="11:06 AM"
            reactions={[
              { emoji: "🤭", count: 1 },
              { emoji: "🤣", count: 3 },
            ]}
          >
            &ldquo;I&apos;m not being dramatic, the printer is gaslighting
            me&rdquo;
          </SlackMessage>

          <SlackMessage
            avatar="/images/landing/avatar/maya.jpg"
            initials="MH"
            color="#E05D44"
            name="Maya H."
            time="12:07 PM"
            reactions={[
              { emoji: "💀", count: 2 },
              { emoji: "🤣", count: 5 },
            ]}
          >
            &ldquo;I put the pro in procrastinate&rdquo;
            <br />
            <span className="text-[11px] text-[#616061]">
              — Kevin, during sprint planning
            </span>
          </SlackMessage>

          <SlackMessage
            avatar="/images/landing/avatar/alex.jpg"
            initials="AW"
            color="#1264A3"
            name="Alex W."
            time="12:20 PM"
            reactions={[
              { emoji: "🥶", count: 3 },
              { emoji: "😂", count: 4 },
            ]}
          >
            &ldquo;My code works and I have no idea why&rdquo;
          </SlackMessage>
        </div>

        {/* Composer with typed message */}
        <div className="border-t border-[#E5E5E5] px-4 py-2">
          <div className="rounded-lg border border-[#7C3AED] px-3 py-1.5 text-[11px] text-[#1D1C1D] ring-1 ring-[#7C3AED]/20">
            &ldquo;The goat is in the conference room again&rdquo;
            <span className="animate-pulse">|</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   GRAPHIC 3 — The generated art image in the thread
   ================================================================ */
export function GetArtGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-80 flex-col">
        {/* Thread header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-2">
          <div>
            <span className="text-[14px] font-bold text-[#1D1C1D]">Thread</span>
            <span className="ml-2 text-[11px] text-[#616061]">
              # no-context
            </span>
          </div>
          <span className="text-[11px] text-[#616061]">&#x2715;</span>
        </div>

        {/* Thread content */}
        <div className="flex-1 overflow-hidden py-2">
          {/* Original quote */}
          <SlackMessage
            avatar="/images/landing/avatar/maya.jpg"
            initials="MH"
            color="#E05D44"
            name="Maya H."
            time="12:22 PM"
          >
            &ldquo;The goat is in the conference room again&rdquo;
          </SlackMessage>

          <div className="my-1 flex items-center gap-2 px-4">
            <div className="h-px flex-1 bg-[#E5E5E5]" />
            <span className="text-[10px] text-[#616061]">1 reply</span>
            <div className="h-px flex-1 bg-[#E5E5E5]" />
          </div>

          {/* Bot reply with generated image */}
          <div className="flex items-start gap-2 px-4 py-1.5">
            <BotAvatar size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-bold text-[#1D1C1D]">
                  No Context
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-[#4A4A4A]">
                  APP
                </span>
                <span className="text-[11px] text-[#616061]">12:22 PM</span>
              </div>
              {/* Generated painting */}
              <div className="mt-1.5 w-fit overflow-hidden rounded-lg border border-[#E5E5E5]">
                <Image
                  src="/images/landing/gallery/goat-cubism.png"
                  alt="AI-generated painting of a goat in a conference room, cubism style"
                  width={200}
                  height={120}
                  className="h-auto w-full max-w-[200px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
