"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { FadeIn } from "@/components/marketing/fade-in";
import { Lightbox } from "@/components/marketing/lightbox";

const examples = [
  {
    quote: "Someone let a goat into the conference room again",
    author: "VP of Sales",
    style: "Cubism",
    image: "/images/landing/gallery-goat-cubism.png",
  },
  {
    quote: "There's a sword in the supply closet and HR won't explain it",
    author: "Intern",
    style: "Pop Art",
    image: "/images/landing/gallery-sword-popart.png",
  },
  {
    quote: "I just watched the CEO chase a seagull across the parking lot",
    author: "Junior Dev",
    style: "Hokusai",
    image: "/images/landing/gallery-seagull-hokusai.png",
  },
  {
    quote: "Why is there a duck in the server room?",
    author: "CEO",
    style: "Ghibli",
    image: "/images/landing/gallery-duck-ghibli.png",
  },
  {
    quote: "The plants in accounting have become sentient",
    author: "Facilities",
    style: "Watercolor",
    image: "/images/landing/gallery-plants-watercolor.png",
  },
  {
    quote:
      "The intern built a throne out of shipping boxes and won't come down",
    author: "Senior Engineer",
    style: "Van Gogh",
    image: "/images/landing/gallery-throne-vangogh.png",
  },
  {
    quote: "The printer is haunted and I have evidence",
    author: "Office Manager",
    style: "Dali",
    image: "/images/landing/gallery-printer-dali.png",
  },
  {
    quote: "A raccoon got into the server room and now it runs better",
    author: "DevOps",
    style: "Pixel Art",
    image: "/images/landing/gallery-raccoon-pixel.png",
  },
];

const cardRotations = [
  "-rotate-1",
  "rotate-1",
  "rotate-0.5",
  "-rotate-0.5",
  "rotate-1",
  "-rotate-1",
  "-rotate-0.5",
  "rotate-0.5",
];

export function ExampleGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = () => setLightboxIndex(null);

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + examples.length) % examples.length,
    );
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % examples.length,
    );
  }, []);

  return (
    <>
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
              Real quotes. Sick art.
            </h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {examples.map((example, i) => (
              <FadeIn key={i} delay={i * 80}>
                <button
                  onClick={() => setLightboxIndex(i)}
                  className={`group w-full cursor-pointer overflow-hidden rounded-xl border-2 border-[#1A1A1A] bg-white text-left shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:rotate-0 hover:shadow-[2px_2px_0px_0px_#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${cardRotations[i]}`}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={example.image}
                      alt={example.quote}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-quote text-sm text-[#1A1A1A]">
                      &ldquo;{example.quote}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-[#4A4A4A]">
                      — {example.author}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#7C3AED]">
                      {example.style}
                    </p>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          items={examples}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      )}
    </>
  );
}
