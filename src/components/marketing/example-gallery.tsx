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
    image: "/images/landing/gallery/goat-cubism.png",
  },
  {
    quote: "There's a sword in the supply closet and HR won't explain it",
    author: "Intern",
    style: "Pop Art",
    image: "/images/landing/gallery/sword-popart.png",
  },
  {
    quote: "I just watched the CEO chase a seagull across the parking lot",
    author: "Junior Dev",
    style: "Hokusai",
    image: "/images/landing/gallery/seagull-hokusai.png",
  },
  {
    quote: "Why is there a duck in the server room?",
    author: "CEO",
    style: "Ghibli",
    image: "/images/landing/gallery/duck-ghibli.png",
  },
  {
    quote: "The plants in accounting have become sentient",
    author: "Facilities",
    style: "Watercolor",
    image: "/images/landing/gallery/plants-watercolor.png",
  },
  {
    quote:
      "The intern built a throne out of shipping boxes and won't come down",
    author: "Senior Engineer",
    style: "Van Gogh",
    image: "/images/landing/gallery/throne-vangogh.png",
  },
  {
    quote: "The printer is haunted and I have evidence",
    author: "Office Manager",
    style: "Dali",
    image: "/images/landing/gallery/printer-dali.png",
  },
  {
    quote: "A raccoon got into the server room and now it runs better",
    author: "DevOps",
    style: "Pixel Art",
    image: "/images/landing/gallery/raccoon-pixel.png",
  },
  {
    quote:
      "The new hire showed up in full idol gear and challenged the CEO to a dance battle",
    author: "HR Director",
    style: "K-Pop Demon Hunters",
    image: "/images/landing/gallery/dancebattle-kpop.png",
  },
  {
    quote:
      "The marketing team barricaded themselves in the conference room and declared it a sovereign nation",
    author: "Product Manager",
    style: "Fortnite",
    image: "/images/landing/gallery/barricade-fortnite.png",
  },
  {
    quote: "The fire alarm went off and the CEO just kept eating his sandwich",
    author: "Security Guard",
    style: "Comic Book",
    image: "/images/landing/gallery/firealarm-comic.png",
  },
  {
    quote:
      "Someone brought a horse to bring-your-pet-to-work day and it won't leave",
    author: "Receptionist",
    style: "Rockwell",
    image: "/images/landing/gallery/horse-rockwell.png",
  },
  {
    quote:
      "The VP just announced he's going dark and won't be reachable for the rest of the quarter",
    author: "Executive Assistant",
    style: "Archer",
    image: "/images/landing/gallery/dark-archer.png",
  },
  {
    quote: "The CFO said our Q3 numbers are gonna have a bad time",
    author: "Finance Analyst",
    style: "South Park",
    image: "/images/landing/gallery/badtime-southpark.png",
  },
  {
    quote:
      "Good news everyone, the WiFi password is finally being changed from password123",
    author: "IT Director",
    style: "Futurama",
    image: "/images/landing/gallery/wifi-futurama.png",
  },
  {
    quote:
      "Someone ate every donut from the break room and left a handwritten apology on a napkin",
    author: "Office Manager",
    style: "The Simpsons",
    image: "/images/landing/gallery/donut-simpsons.png",
  },
  {
    quote:
      "IT converted the basement into a bunker and now they won't come out until the quarterly review is over",
    author: "CTO",
    style: "Fallout",
    image: "/images/landing/gallery/bunker-fallout.png",
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
  "rotate-1",
  "-rotate-1",
  "rotate-0.5",
  "-rotate-0.5",
  "-rotate-1",
  "rotate-0.5",
  "-rotate-0.5",
  "rotate-1",
  "-rotate-1",
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
              <FadeIn key={i} delay={i * 80} className="h-full">
                <button
                  onClick={() => setLightboxIndex(i)}
                  className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-[#1A1A1A] bg-white text-left shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:rotate-0 hover:shadow-[2px_2px_0px_0px_#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${cardRotations[i]}`}
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
