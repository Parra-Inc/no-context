"use client";

import {
  Brain,
  Palette,
  Image,
  Zap,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";

const features = [
  {
    icon: Brain,
    title: "Smart Detection",
    description:
      "No Context Bot knows the difference between a real quote and regular chat. No keywords. No tags. Just post.",
    gradient: "from-violet-100 to-purple-50",
    iconColor: "text-violet-600",
  },
  {
    icon: Palette,
    title: "15+ Art Styles",
    description:
      "From Picasso to Pixel Art. Set a default or let each channel have its own vibe.",
    gradient: "from-rose-100 to-pink-50",
    iconColor: "text-rose-600",
  },
  {
    icon: Image,
    title: "Quote Gallery",
    description:
      "Every generated image saved to a searchable dashboard. Favorite the best ones. Download and share.",
    gradient: "from-amber-100 to-orange-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Zap,
    title: "Zero Maintenance",
    description:
      "Install once. It runs itself. No commands to learn, no triggers to set up. It just works.",
    gradient: "from-emerald-100 to-teal-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: CalendarDays,
    title: "Weekly Digest",
    description:
      "Get a roundup of the week's best quotes delivered to your channel every Friday.",
    gradient: "from-blue-100 to-sky-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Sparkles,
    title: "Custom Styles",
    description:
      '"In the style of a 90s cereal box" — sure, why not. Write your own style prompt.',
    gradient: "from-fuchsia-100 to-pink-50",
    iconColor: "text-fuchsia-600",
  },
];

export function Features() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
            Post a quote. The rest is{" "}
            <span className="relative inline-block">
              <span className="relative z-10">automatic.</span>
              <span className="absolute inset-0 -skew-x-2 rounded-lg bg-[#EDE9FE]" />
            </span>
          </h2>
        </FadeIn>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="group h-full rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A]">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#1A1A1A] bg-gradient-to-br ${feature.gradient} transition-transform duration-300 group-hover:scale-[1.025] group-hover:-rotate-6`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#1A1A1A]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[#4A4A4A]">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
