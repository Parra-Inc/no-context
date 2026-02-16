"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent, motion } from "motion/react";
import { Hash, MessageSquareQuote, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";
import { StepIndicators } from "@/components/marketing/how-it-works-step-indicators";
import {
  UnifiedSlackGraphic,
  MobileStepGraphic,
} from "@/components/marketing/how-it-works-graphics";

const steps = [
  {
    icon: Hash,
    title: "Set up your channel",
    description:
      "Create a #no-context channel in Slack and install the No Context Bot.",
  },
  {
    icon: MessageSquareQuote,
    title: "Drop a quote",
    description: "Hear something hilarious at work? Post the quote. That's it.",
  },
  {
    icon: Sparkles,
    title: "Get art",
    description:
      "No Context Bot turns it into a unique painting and replies in the thread. Seconds later.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.333) setCurrentStep(0);
    else if (latest < 0.667) setCurrentStep(1);
    else setCurrentStep(2);
  });

  // Clear hash when section scrolls out of view
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
    <section ref={sectionRef} id="how-it-works" className="px-4 sm:px-6">
      {/* ============================================
          DESKTOP: Sticky scroll experience (lg+)
          ============================================ */}
      <div
        ref={scrollContainerRef}
        className="relative hidden lg:block"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
          {/* Header — inside sticky so it pins with the rest */}
          <FadeIn>
            <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-center text-lg text-[#4A4A4A]">
              Get up and running in under a minute.
            </p>
          </FadeIn>

          <div className="mt-8 grid w-full max-w-6xl grid-cols-[280px_1fr] items-center gap-16 px-6">
            {/* Left: Step indicators */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <StepIndicators steps={steps} currentStep={currentStep} />
            </motion.div>

            {/* Right: Unified Slack graphic */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            >
              <UnifiedSlackGraphic
                currentStep={currentStep}
                scrollYProgress={scrollYProgress}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ============================================
          MOBILE: Stacked cards fallback (below lg)
          ============================================ */}
      <div className="mx-auto max-w-md py-16 lg:hidden">
        <FadeIn>
          <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-center text-lg text-[#4A4A4A]">
            Get up and running in under a minute.
          </p>
        </FadeIn>

        <div className="mt-12">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="mb-16 flex flex-col items-center">
                {/* Step badge + title */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-[#7C3AED] shadow-[3px_3px_0px_0px_#1A1A1A]">
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <span className="mt-3 text-xs font-semibold tracking-widest text-[#7C3AED] uppercase">
                  Step {i + 1}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                  {step.title}
                </h3>
                <p className="mt-3 text-center text-sm leading-relaxed text-[#4A4A4A]">
                  {step.description}
                </p>
                {/* Static graphic for this step */}
                <div className="mt-5 w-full">
                  <MobileStepGraphic step={i} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
