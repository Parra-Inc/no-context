"use client";

import Image from "next/image";
import { useState } from "react";
import {
  motion,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";

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

/* ---- Sidebar panel content ---- */
function SidebarPanel() {
  return (
    <div className="flex h-full flex-col bg-[#4A154B] text-[11px]">
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
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 5h2v2H7V5zm0 4h2v2H7V9z" />
          </svg>
          Threads
        </div>
        <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-[#BCABBC]">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
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

      {/* Spacer + logged-in user */}
      <div className="mt-auto border-t border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <img
            src="/images/landing/avatar/maya.jpg"
            alt="Maya H."
            className="h-5 w-5 shrink-0 rounded object-cover"
          />
          <span className="truncate text-[11px] font-medium text-white">
            Maya H.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Messages panel content ---- */
function MessagesPanel({
  compact = false,
  currentStep,
}: {
  compact?: boolean;
  currentStep: number;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Channel header + messages area */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-opacity duration-500 ${
          currentStep === 0
            ? "opacity-40"
            : currentStep === 1
              ? "opacity-50"
              : "opacity-40"
        }`}
      >
        <div className="flex items-center border-b border-[#E5E5E5] px-4 py-2">
          <span className="text-[14px] font-bold text-[#1D1C1D]">
            # no-context
          </span>
        </div>

        <div className="flex-1 overflow-hidden py-2">
          {!compact && (
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
          )}

          <SlackMessage
            avatar="/images/landing/avatar/maya.jpg"
            initials="MH"
            color="#E05D44"
            name="Maya H."
            time="12:07 PM"
            reactions={
              compact
                ? undefined
                : [
                    { emoji: "💀", count: 2 },
                    { emoji: "🤣", count: 5 },
                  ]
            }
          >
            &ldquo;I put the pro in procrastinate&rdquo;
            {!compact && (
              <>
                <br />
                <span className="text-[11px] text-[#616061]">
                  — Kevin, during sprint planning
                </span>
              </>
            )}
          </SlackMessage>

          <SlackMessage
            avatar="/images/landing/avatar/alex.jpg"
            initials="AW"
            color="#1264A3"
            name="Alex W."
            time="12:20 PM"
            reactions={
              compact
                ? undefined
                : [
                    { emoji: "🥶", count: 3 },
                    { emoji: "😂", count: 4 },
                  ]
            }
          >
            &ldquo;My code works and I have no idea why&rdquo;
          </SlackMessage>

          {/* Maya's goat quote — only visible in step 3 */}
          {compact && (
            <SlackMessage
              avatar="/images/landing/avatar/maya.jpg"
              initials="MH"
              color="#E05D44"
              name="Maya H."
              time="12:22 PM"
            >
              &ldquo;The goat is in the conference room again&rdquo;
              <div className="mt-1 flex items-center gap-1.5">
                <BotAvatar size={16} />
                <span className="text-[11px] font-medium text-[#1264A3]">
                  1 reply
                </span>
              </div>
            </SlackMessage>
          )}
        </div>
      </div>

      {/* Composer */}
      <div
        className={`border-t border-[#E5E5E5] px-4 py-2 transition-opacity duration-500 ${
          currentStep === 1 ? "opacity-100" : "opacity-40"
        }`}
      >
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${compact ? "border-[#E5E5E5]" : "border-[#7C3AED] ring-1 ring-[#7C3AED]/20"}`}
        >
          <span className="flex-1 text-[11px] text-[#1D1C1D]">
            {compact ? (
              <span className="text-[11px] text-[#BCABBC]">
                Message #no-context
              </span>
            ) : (
              <>
                &ldquo;The goat is in the conference room again&rdquo;
                <span className="animate-pulse">|</span>
              </>
            )}
          </span>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${compact ? "bg-[#E5E5E5]" : "bg-[#7C3AED]"}`}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill={compact ? "#BCABBC" : "white"}
            >
              <path d="M1.5 1.5L14.5 8L1.5 14.5V9.5L10 8L1.5 6.5V1.5Z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Thread panel content ---- */
function ThreadPanel() {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-2">
        <div>
          <span className="block text-[14px] font-bold text-[#1D1C1D]">
            Thread
          </span>
          <span className="block text-[11px] text-[#616061]"># no-context</span>
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
            <div className="mt-1.5">
              <div className="overflow-hidden rounded-lg border border-[#E5E5E5]">
                <Image
                  src="/images/landing/gallery/goat-cubism.png"
                  alt="AI-generated painting of a goat in a conference room, cubism style"
                  width={180}
                  height={108}
                  className="h-auto w-full object-cover"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#616061] italic">
                Style: Cubism
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   UNIFIED SLACK GRAPHIC — 3-panel layout with scroll-driven highlights
   ================================================================ */

const stepAriaLabels = [
  "Slack workspace showing the no-context channel in the sidebar",
  "Slack channel with team members posting funny out-of-context quotes",
  "Slack thread showing the AI-generated painting reply from No Context Bot",
];

interface UnifiedSlackGraphicProps {
  currentStep: number;
  scrollYProgress: MotionValue<number>;
}

export function UnifiedSlackGraphic({
  currentStep,
  scrollYProgress,
}: UnifiedSlackGraphicProps) {
  // Track when thread starts sliding (0.6) to switch messages to "sent" state
  const [messageSent, setMessageSent] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setMessageSent(latest >= 0.6);
  });

  // Thread panel: width grows from 0 to 240 at step 3
  const threadWidth = useTransform(scrollYProgress, [0.6, 0.75], [0, 240]);

  return (
    <div
      role="img"
      aria-label={stepAriaLabels[currentStep]}
      className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-xl"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E5E5] bg-[#F8F8F8] px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
      </div>

      <div className="relative flex overflow-hidden" style={{ height: 380 }}>
        {/* PANEL 1: Sidebar */}
        <div
          className={`w-[140px] shrink-0 transition-opacity duration-500 ${
            currentStep === 0 ? "opacity-100" : "opacity-30"
          }`}
        >
          <SidebarPanel />
        </div>

        {/* PANEL 2: Messages */}
        <div className="flex-1 border-l border-[#E5E5E5]">
          <MessagesPanel compact={messageSent} currentStep={currentStep} />
        </div>

        {/* PANEL 3: Thread (width animates open from right) */}
        <motion.div
          className="shrink-0 overflow-hidden border-l border-[#E5E5E5] bg-white"
          style={{ width: threadWidth }}
        >
          <div className="h-full w-[240px]">
            <ThreadPanel />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ================================================================
   MOBILE GRAPHIC — simplified static version per step
   ================================================================ */

export function MobileStepGraphic({ step }: { step: number }) {
  if (step === 0) return <MobileSidebarGraphic />;
  if (step === 1) return <MobileMessagesGraphic />;
  return <MobileThreadGraphic />;
}

function MobileSidebarGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-72">
        {/* Sidebar */}
        <div className="w-[120px] shrink-0">
          <SidebarPanel />
        </div>
        {/* Messages (dimmed) */}
        <div className="relative flex-1 border-l border-[#E5E5E5]">
          <div className="flex h-full flex-col bg-white">
            <div className="flex items-center border-b border-[#E5E5E5] px-4 py-2">
              <span className="text-[14px] font-bold text-[#1D1C1D]">
                # no-context
              </span>
            </div>
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
              >
                &ldquo;I peaked in the 3rd grade&rdquo;
              </SlackMessage>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-white/60" />
        </div>
      </div>
    </div>
  );
}

function MobileMessagesGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-72 flex-col">
        <div className="flex items-center border-b border-[#E5E5E5] px-4 py-2">
          <span className="text-[14px] font-bold text-[#1D1C1D]">
            # no-context
          </span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <SlackMessage
            avatar="/images/landing/avatar/jamie.jpg"
            initials="JT"
            color="#7C3AED"
            name="Jamie T."
            time="11:06 AM"
            reactions={[{ emoji: "🤣", count: 3 }]}
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
            reactions={[{ emoji: "💀", count: 2 }]}
          >
            &ldquo;I put the pro in procrastinate&rdquo;
          </SlackMessage>
        </div>
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

function MobileThreadGraphic() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-2">
          <div>
            <span className="text-[14px] font-bold text-[#1D1C1D]">Thread</span>
            <span className="ml-2 text-[11px] text-[#616061]">
              # no-context
            </span>
          </div>
          <span className="text-[11px] text-[#616061]">&#x2715;</span>
        </div>
        <div className="py-2">
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
              <div className="mt-1.5">
                <div className="overflow-hidden rounded-lg border border-[#E5E5E5]">
                  <Image
                    src="/images/landing/gallery/goat-cubism.png"
                    alt="AI-generated painting of a goat in a conference room"
                    width={180}
                    height={108}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#616061] italic">
                  Style: Cubism
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
