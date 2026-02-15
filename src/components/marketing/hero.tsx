"use client";

import Link from "next/link";
import Image from "next/image";
import { MarketingButton } from "@/components/marketing/marketing-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hero() {
  return (
    <section className="px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-20">
      <div className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-4xl leading-tight tracking-tight text-[#1A1A1A] md:text-5xl lg:text-6xl">
            Your team&apos;s best
            <br />
            quotes deserve
            <br />
            to be{" "}
            <span className="relative inline-block">
              <span className="relative z-10">art.</span>
              <span className="absolute inset-0 -skew-x-2 rounded-lg bg-[#EDE9FE]" />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#4A4A4A] md:text-xl lg:mx-0">
            No Context Bot turns your team&apos;s most hilarious Slack quotes
            into one-of-a-kind AI paintings. The best team culture tool is the
            one nobody has to manage.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 lg:justify-start">
            <Link href="/api/slack/install" className="w-full sm:w-auto">
              <MarketingButton
                size="lg"
                className="w-full text-sm sm:h-14 sm:px-10 sm:text-base"
              >
                Add to Slack — Free
              </MarketingButton>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <MarketingButton
                variant="secondary"
                size="lg"
                className="group w-full text-sm sm:h-14 sm:px-10 sm:text-base"
              >
                How it Works
                <svg
                  className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-y-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </MarketingButton>
            </Link>
          </div>
          <div className="mt-4 text-center lg:text-left">
            <Dialog>
              <DialogTrigger asChild>
                <button className="cursor-pointer text-sm text-[#4A4A4A] underline decoration-[#4A4A4A]/40 underline-offset-2 transition-colors hover:text-[#7C3AED] hover:decoration-[#7C3AED]/40">
                  What&apos;s a #no-context channel?
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>What&apos;s a #no-context channel?</DialogTitle>
                  <DialogDescription>
                    A #no-context channel is a Slack channel where your team
                    posts the funniest things people say — completely out of
                    context.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm text-[#4A4A4A]">
                  <p>
                    Someone says something hilarious in a meeting or chat? Drop
                    the quote in #no-context with zero explanation. The less
                    context, the better.
                  </p>
                  <p>
                    It&apos;s one of the most beloved traditions in team culture
                    — a living highlight reel of your team&apos;s funniest
                    moments.
                  </p>
                  <p>
                    No Context Bot takes it a step further by turning each quote
                    into a unique AI-generated painting, making your channel a
                    gallery of inside jokes.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mock Slack UI */}
        <div className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-xl transition-transform duration-300 hover:scale-[1.02] hover:-rotate-1">
            <div className="border-b border-[#E5E5E5] bg-[#3F0E40] px-4 py-3">
              <span className="text-sm font-medium text-white">
                # no-context
              </span>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex gap-3">
                <img
                  src="/images/landing/avatar/sarah.jpg"
                  alt="Sarah Chen"
                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      Sarah Chen
                    </span>
                    <span className="text-xs text-[#4A4A4A]">2:34 PM</span>
                  </div>
                  <p className="font-quote mt-1 text-sm text-[#1A1A1A]">
                    &ldquo;I&apos;m not saying it was aliens, but it was
                    definitely the intern&rdquo;
                    <br />
                    <span className="text-[#4A4A4A]">— Mike, Engineering</span>
                  </p>
                  <div className="mt-2 flex gap-1">
                    <span className="rounded-full bg-[#F8F8F8] px-2 py-0.5 text-xs">
                      🎨 1
                    </span>
                    <span className="rounded-full bg-[#F8F8F8] px-2 py-0.5 text-xs">
                      😂 3
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-12 min-w-0 border-l-2 border-[#E5E5E5] pl-4">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE]">
                    <svg
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
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
                      <rect
                        x="22"
                        y="37"
                        width="20"
                        height="4"
                        rx="2"
                        fill="#F97066"
                      />
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
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-[#1A1A1A]">
                        No Context
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-[#4A4A4A]">
                        APP
                      </span>
                      <span className="text-xs text-[#4A4A4A]">2:34 PM</span>
                    </div>
                  </div>
                </div>
                <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src="/images/landing/hero/vangogh.png"
                    alt="Van Gogh style painting of aliens at a workplace, inspired by the quote"
                    fill
                    className="scale-110 object-cover"
                    sizes="(max-width: 768px) 100vw, 448px"
                  />
                </div>
                <p className="mt-1 text-xs text-[#4A4A4A]">
                  Style: Van Gogh / Post-Impressionist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
