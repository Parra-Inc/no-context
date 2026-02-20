"use client";

import Image from "next/image";
import { Clock, CreditCard, Shield } from "lucide-react";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { FadeIn } from "@/components/marketing/fade-in";

const galleryPeek = [
  {
    image: "/images/landing/gallery/duck-ghibli.png",
    alt: "Ghibli style art",
    rotation: "rotate-3",
  },
  {
    image: "/images/landing/gallery/raccoon-pixel.png",
    alt: "Pixel art style",
    rotation: "-rotate-2",
  },
  {
    image: "/images/landing/gallery/love-popart.png",
    alt: "Pop art style",
    rotation: "rotate-1",
  },
  {
    image: "/images/landing/gallery/plants-watercolor.png",
    alt: "Watercolor style",
    rotation: "-rotate-3",
  },
  {
    image: "/images/landing/gallery/goat-cubism.png",
    alt: "Cubism style",
    rotation: "rotate-2",
  },
];

const trustSignals = [
  { icon: Clock, text: "Setup in 60 seconds" },
  { icon: CreditCard, text: "No credit card required" },
  { icon: Shield, text: "Cancel anytime" },
];

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-b from-[#F5F3FF] to-[#FAFAF8] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Gallery peek */}
        <div className="mb-10 flex items-center justify-center gap-4 px-2 sm:mb-12 sm:gap-5">
          {galleryPeek.map((item, i) => (
            <FadeIn key={i} delay={i * 60}>
              <div className="p-1">
                <div
                  className={`relative aspect-square w-16 overflow-hidden rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] ${item.rotation} transition-transform duration-300 hover:scale-110 hover:rotate-0 sm:w-24 md:w-28`}
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 112px, (min-width: 640px) 96px, 64px"
                  />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Heading */}
        <FadeIn>
          <h2 className="font-display text-center text-3xl leading-snug text-[#1A1A1A] sm:text-4xl md:text-5xl">
            Some Slack messages are too good to just{" "}
            <span className="relative inline-block">
              <span className="relative z-10">scroll past.</span>
              <span className="absolute inset-0 -skew-x-2 rounded-lg bg-[#EDE9FE]" />
            </span>
          </h2>
        </FadeIn>

        {/* Subheadline */}
        <FadeIn delay={100}>
          <p className="mt-4 text-center text-lg text-[#4A4A4A] sm:text-xl">
            One click to install. Your team handles the funny part.
          </p>
        </FadeIn>

        {/* CTA Button */}
        <FadeIn delay={200}>
          <div className="mt-10 text-center">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/slack/install">
              <MarketingButton
                size="lg"
                className="w-full text-sm sm:h-16 sm:w-auto sm:px-12 sm:text-lg"
              >
                Add to Slack — It&apos;s Free
              </MarketingButton>
            </a>
          </div>
        </FadeIn>

        {/* Trust signals */}
        <FadeIn delay={300}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {trustSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm text-[#4A4A4A]"
                >
                  <Icon className="h-4 w-4 text-[#7C3AED]" />
                  {signal.text}
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
