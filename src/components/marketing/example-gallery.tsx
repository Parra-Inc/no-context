"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FadeIn } from "@/components/marketing/fade-in";
import { Lightbox } from "@/components/marketing/lightbox";
import { QuoteCard } from "@/components/quote-card";

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

export function ExampleGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth =
      el.querySelector<HTMLElement>(":scope > div")?.offsetWidth ?? 300;
    el.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
              Real quotes. Sick art.
            </h2>
          </FadeIn>

          <div className="relative mt-12">
            {/* Left arrow */}
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="absolute top-1/2 -left-4 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-opacity disabled:cursor-default disabled:opacity-0 sm:flex"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Right arrow */}
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="absolute top-1/2 -right-4 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white shadow-[2px_2px_0px_0px_#1A1A1A] transition-opacity disabled:cursor-default disabled:opacity-0 sm:flex"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Fade edges */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-16 bg-gradient-to-r from-white to-transparent transition-opacity sm:block"
              style={{ opacity: canScrollLeft ? 1 : 0 }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-[5] hidden w-16 bg-gradient-to-l from-white to-transparent transition-opacity sm:block"
              style={{ opacity: canScrollRight ? 1 : 0 }}
            />

            {/* Carousel track */}
            <div
              ref={scrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
            >
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="w-[280px] flex-shrink-0 snap-start sm:w-[260px]"
                >
                  <QuoteCard
                    imageUrl={example.image}
                    quoteText={example.quote}
                    author={example.author}
                    styleName={example.style}
                    onClick={() => setLightboxIndex(i)}
                    imageSizes="280px"
                  />
                </div>
              ))}
            </div>
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
