"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";

interface LightboxItem {
  quote: string;
  author: string;
  style: string;
  image: string;
}

interface LightboxProps {
  items: LightboxItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const item = items[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl cursor-default flex-col items-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 right-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:text-white md:right-0"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Previous arrow */}
        <button
          onClick={onPrev}
          className="absolute left-0 top-1/2 z-10 flex h-12 w-12 cursor-pointer -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white md:-left-16"
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Next arrow */}
        <button
          onClick={onNext}
          className="absolute right-0 top-1/2 z-10 flex h-12 w-12 cursor-pointer -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white md:-right-16"
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-2xl">
          <Image
            src={item.image}
            alt={item.quote}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>

        {/* Quote overlay */}
        <div className="mt-6 text-center">
          <p className="font-quote text-lg text-white md:text-xl">
            &ldquo;{item.quote}&rdquo;
          </p>
          <p className="mt-2 text-sm text-white/60">
            — {item.author}
          </p>
          <p className="mt-1 text-xs font-medium text-[#A78BFA]">
            {item.style}
          </p>
        </div>

        {/* Dots indicator */}
        <div className="mt-6 flex gap-2">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
