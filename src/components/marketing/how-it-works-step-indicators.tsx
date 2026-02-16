"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface StepIndicatorsProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicators({ steps, currentStep }: StepIndicatorsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineStyle, setLineStyle] = useState({ top: 0, height: 0 });

  const updateLine = useCallback(() => {
    const container = containerRef.current;
    const first = circleRefs.current[0];
    const last = circleRefs.current[steps.length - 1];
    if (!container || !first || !last) return;

    const containerRect = container.getBoundingClientRect();
    const firstCenter =
      first.getBoundingClientRect().top + 24 - containerRect.top;
    const lastCenter =
      last.getBoundingClientRect().top + 24 - containerRect.top;
    setLineStyle({ top: firstCenter, height: lastCenter - firstCenter });
  }, [steps.length]);

  // Recalculate line whenever the container resizes (e.g. description expand/collapse)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateLine();
    const observer = new ResizeObserver(updateLine);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateLine]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-14">
      {/* Vertical connecting line (background) */}
      <div
        className="absolute left-6 w-0.5 bg-[#E5E5E5]"
        style={{ top: lineStyle.top, height: lineStyle.height }}
      />
      {/* Vertical connecting line (progress fill) */}
      <motion.div
        className="absolute left-6 w-0.5 origin-top bg-[#7C3AED]"
        style={{ top: lineStyle.top, height: lineStyle.height }}
        animate={{ scaleY: currentStep / (steps.length - 1) }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isPast = i < currentStep;

        return (
          <div key={i} className="relative flex items-start gap-4">
            {/* Step icon circle */}
            <motion.div
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
              className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2"
              animate={{
                backgroundColor: isActive || isPast ? "#7C3AED" : "#FFFFFF",
                borderColor: isActive || isPast ? "#1A1A1A" : "#E5E5E5",
                boxShadow: isActive
                  ? "3px 3px 0px 0px #1A1A1A"
                  : "0px 0px 0px 0px #1A1A1A",
              }}
              transition={{ duration: 0.3 }}
            >
              <step.icon
                className={`h-5 w-5 transition-colors duration-300 ${
                  isActive || isPast ? "text-white" : "text-[#BCABBC]"
                }`}
              />
            </motion.div>

            {/* Text content */}
            <div className="pt-1">
              <span
                className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-300 ${
                  isActive ? "text-[#7C3AED]" : "text-[#BCABBC]"
                }`}
              >
                Step {i + 1}
              </span>
              <h3
                className={`mt-1 text-lg font-semibold transition-colors duration-300 ${
                  isActive
                    ? "text-[#1A1A1A]"
                    : isPast
                      ? "text-[#4A4A4A]"
                      : "text-[#BCABBC]"
                }`}
              >
                {step.title}
              </h3>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-[#4A4A4A]">
                      {step.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
