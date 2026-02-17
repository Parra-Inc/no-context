"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { FadeIn } from "@/components/marketing/fade-in";
import { Lightbox } from "@/components/marketing/lightbox";

const galleryItems = [
  {
    quote: "I just mass-replied 'love you' to the entire company",
    author: "Head of Marketing",
    style: "Pop Art",
    image: "/images/landing/gallery/love-popart.png",
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
    quote: "Someone let a goat into the conference room again",
    author: "VP of Sales",
    style: "Cubism",
    image: "/images/landing/gallery/goat-cubism.png",
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
];

const rotations = [
  "rotate-2",
  "-rotate-1",
  "rotate-1",
  "-rotate-2",
  "rotate-1",
  "-rotate-1",
];

export function MoraleSection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null
        ? null
        : (prev - 1 + galleryItems.length) % galleryItems.length,
    );
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % galleryItems.length,
    );
  }, []);

  return (
    <>
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl text-[#1A1A1A] md:text-4xl">
              Your Slack messages are{" "}
              <span className="relative inline-block">
                <span className="relative z-10">unhinged.</span>
                <span className="absolute bottom-1 left-0 -z-0 h-3 w-full bg-[#EDE9FE]" />
              </span>
              <br />
              We make them immortal.
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="mt-8 space-y-4 text-lg text-[#4A4A4A]">
              <p>
                The best teams share inside jokes. They laugh at the weird
                things people say in meetings. They have a #no-context channel —
                and it&apos;s everyone&apos;s favorite.
              </p>
              <p>
                No Context Bot takes that energy and turns it into something you
                can hang on the wall. Every quote becomes a piece of art your
                team made together. Pin them. Share them. Print them.
              </p>
              <p className="font-medium text-[#1A1A1A]">
                No forced fun. No icebreakers. Just your team being themselves —
                illustrated.
              </p>
            </div>
          </FadeIn>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
            {galleryItems.map((item, i) => (
              <FadeIn key={i} delay={i * 80}>
                <button
                  onClick={() => openLightbox(i)}
                  className={`group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] ${rotations[i]} transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:rotate-0 hover:shadow-[2px_2px_0px_0px_#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]`}
                >
                  <Image
                    src={item.image}
                    alt={item.quote}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute right-0 bottom-0 left-0 p-3 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="font-quote text-xs text-white md:text-sm">
                      &ldquo;{item.quote}&rdquo;
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
          items={galleryItems}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      )}
    </>
  );
}
