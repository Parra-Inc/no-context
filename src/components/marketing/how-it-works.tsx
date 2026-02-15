"use client";

import { useEffect, useRef } from "react";
import { Hash, MessageSquareQuote, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";
import {
  SetupChannelGraphic,
  DropQuoteGraphic,
  GetArtGraphic,
} from "@/components/marketing/how-it-works-graphics";

const steps = [
  {
    icon: Hash,
    title: "Set up your channel",
    description:
      "Create a #no-context channel in Slack and install the No Context Bot.",
    graphic: SetupChannelGraphic,
  },
  {
    icon: MessageSquareQuote,
    title: "Drop a quote",
    description: "Hear something hilarious at work? Post the quote. That's it.",
    graphic: DropQuoteGraphic,
  },
  {
    icon: Sparkles,
    title: "Get art",
    description:
      "No Context Bot turns it into a unique painting and replies in the thread. Seconds later.",
    graphic: GetArtGraphic,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && window.location.hash === "#how-it-works") {
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
            Three steps. Negative effort.
          </h2>
          <p className="mt-4 text-center text-lg text-[#4A4A4A]">
            Get up and running in under a minute.
          </p>
        </FadeIn>

        <div className="relative mt-20">
          {/* Connecting line — visible on md+ */}
          <div
            aria-hidden
            className="absolute top-10 hidden md:block"
            style={{ left: "calc(100% / 6)", right: "calc(100% / 6)" }}
          >
            <FadeIn delay={150}>
              <div className="h-0.5 bg-[#1A1A1A]" />
            </FadeIn>
          </div>

          <div className="grid gap-16 md:grid-cols-3 md:gap-12">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="relative flex flex-col items-center">
                  {/* Step number circle */}
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-white shadow-[3px_3px_0px_0px_#1A1A1A]">
                    <step.icon className="h-8 w-8 text-[#7C3AED]" />
                  </div>

                  {/* Step number label */}
                  <span className="mt-4 text-xs font-semibold tracking-widest text-[#7C3AED] uppercase">
                    Step {i + 1}
                  </span>

                  <h3 className="mt-3 text-lg font-semibold text-[#1A1A1A]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-center text-sm leading-relaxed text-[#4A4A4A]">
                    {step.description}
                  </p>

                  {/* Slack UI mockup graphic */}
                  <div className="mt-6 w-full">
                    <step.graphic />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
