"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { signInWithSlack } from "./actions";

const GALLERY_CARDS = [
  {
    src: "/images/landing/gallery-duck-ghibli.png",
    style: "Ghibli",
    quote: "\u201CThis duck has seen things you wouldn\u2019t believe\u201D",
    author: "Raj, Engineering",
  },
  {
    src: "/images/landing/gallery-goat-cubism.png",
    style: "Cubism",
    quote: "\u201CThat\u2019s not a bug, that\u2019s a goat\u201D",
    author: "Priya, Product",
  },
  {
    src: "/images/landing/gallery-seagull-hokusai.png",
    style: "Ukiyo-e",
    quote: "\u201CWho let the seagull into standup again\u201D",
    author: "Sam, Design",
  },
  {
    src: "/images/landing/gallery-throne-vangogh.png",
    style: "Van Gogh",
    quote: "\u201CThe intern sits on the throne now\u201D",
    author: "Mike, Engineering",
  },
  {
    src: "/images/landing/gallery-plants-watercolor.png",
    style: "Watercolor",
    quote: "\u201CThe office plants are thriving more than our roadmap\u201D",
    author: "Tina, Marketing",
  },
  {
    src: "/images/landing/gallery-raccoon-pixel.png",
    style: "Pixel Art",
    quote: "\u201CThere\u2019s a raccoon in the server room again\u201D",
    author: "Alex, Ops",
  },
];

export function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile gallery — peeking strip above sign-in */}
      <div className="relative h-[28rem] w-full overflow-hidden bg-[#F5F0FF] lg:hidden">
        <div className="absolute -inset-10 -rotate-3">
          <div className="grid grid-cols-2 gap-3 p-3">
            {GALLERY_CARDS.map((card, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-md border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                <div className="relative aspect-[4/3] border-b-2 border-[#1A1A1A]">
                  <Image
                    src={card.src}
                    alt={card.style}
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs leading-snug font-bold text-[#1A1A1A]">
                    {card.quote}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#4A4A4A]">
                      — {card.author}
                    </span>
                    <span className="rounded-sm border border-[#7C3AED] bg-[#EDE9FE] px-1.5 py-0.5 text-[8px] font-bold text-[#7C3AED]">
                      {card.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign in */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-[45%] lg:py-0">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <Link href="/">
              <Logo size="lg" className="justify-center" />
            </Link>
            <p className="mt-4 text-[#4A4A4A]">
              Sign in to manage your workspace&apos;s quote gallery.
            </p>
          </div>

          <form action={signInWithSlack}>
            <MarketingButton
              type="submit"
              variant="secondary"
              size="xl"
              className="w-full gap-3"
              onClick={() => setIsLoading(true)}
              disabled={isLoading}
            >
              <SlackIcon />
              {isLoading ? "Redirecting..." : "Sign in with Slack"}
            </MarketingButton>
          </form>

          <p className="mt-8 text-center text-xs text-[#4A4A4A]">
            Your workspace must have No Context installed.
            <br />
            <Link
              href="/"
              className="mt-1 inline-block text-[#7C3AED] hover:underline"
            >
              Learn more
            </Link>
          </p>
        </div>

        <p className="mt-8 text-xs text-[#4A4A4A]/60 lg:absolute lg:bottom-6 lg:mt-0">
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
        </p>
      </div>

      {/* Desktop gallery — right side */}
      <div className="relative hidden w-[55%] overflow-hidden bg-[#F5F0FF] lg:block">
        <div className="absolute -inset-20 -rotate-6">
          <div className="grid grid-cols-2 gap-3 p-3">
            {GALLERY_CARDS.map((card, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-md border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_0px_#1A1A1A]"
              >
                <div className="relative aspect-[4/3] border-b-2 border-[#1A1A1A]">
                  <Image
                    src={card.src}
                    alt={card.style}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm leading-snug font-bold text-[#1A1A1A]">
                    {card.quote}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4A4A4A]">
                      — {card.author}
                    </span>
                    <span className="rounded-sm border border-[#7C3AED] bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">
                      {card.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 2447.6 2452.5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill="#36c5f0"
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill="#2eb67d"
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill="#ecb22e"
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill="#e01e5a"
        />
      </g>
    </svg>
  );
}
