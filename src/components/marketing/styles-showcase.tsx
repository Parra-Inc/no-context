"use client";

import { useState } from "react";
import Image from "next/image";
import { ART_STYLES, roundedStyleCount } from "@/lib/styles";
import { FadeIn } from "@/components/marketing/fade-in";

export function StylesShowcase() {
  const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);

  return (
    <section id="styles" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <FadeIn>
          <h2 className="font-display text-3xl text-[#1A1A1A] md:text-4xl">
            {roundedStyleCount(ART_STYLES.length)}+ styles.{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Randomly picked.</span>
              <span className="absolute bottom-1 left-0 -z-0 h-3 w-full bg-[#EDE9FE]" />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#4A4A4A]">
            Each quote gets a random style from the full collection. Configure
            which ones are in the rotation, or create your own from scratch.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {ART_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-all duration-150 ${
                  selectedStyle.id === style.id
                    ? "border-2 border-[#1A1A1A] bg-[#7C3AED] text-white shadow-[3px_3px_0px_0px_#1A1A1A]"
                    : "border-2 border-[#1A1A1A] bg-white text-[#4A4A4A] shadow-[3px_3px_0px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:text-[#7C3AED] hover:shadow-[2px_2px_0px_0px_#1A1A1A]"
                }`}
              >
                {!style.isFree && (
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                )}
                {style.displayName}
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mx-auto mt-10 max-w-md">
            <div className="overflow-hidden rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A]">
              <div className="relative aspect-[4/3]">
                <Image
                  key={selectedStyle.id}
                  src={`/images/landing/showcase/${selectedStyle.id}.png`}
                  alt="The printer is on fire again and honestly I think it's personal"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
                {!selectedStyle.isFree && (
                  <span className="absolute top-3 right-3 z-10 rounded-full bg-[#F59E0B] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                    Premium
                  </span>
                )}
              </div>
              <div className="bg-white p-4 text-center">
                <p className="font-quote text-sm text-[#1A1A1A]">
                  &ldquo;The printer is on fire again and honestly I think
                  it&apos;s personal&rdquo;
                </p>
                <p className="mt-1 text-xs text-[#4A4A4A]">
                  — Jeff, Operations
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
