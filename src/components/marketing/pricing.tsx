"use client";

import { useState } from "react";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";

const tiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    images: 5,
    popular: false,
    cta: "Add to Slack — Free",
    features: [
      "5 generated images/month",
      "1 connected channel",
      "Default watercolor style",
      "7-day image history",
    ],
  },
  {
    name: "Starter",
    monthlyPrice: 9,
    annualPrice: 7,
    images: 25,
    popular: false,
    cta: "Try Starter Free",
    features: [
      "25 generated images/month",
      "1 connected channel",
      "5 art style options",
      "No watermark",
      "Full image history",
      "Download images",
    ],
  },
  {
    name: "Team",
    monthlyPrice: 29,
    annualPrice: 24,
    images: 100,
    popular: true,
    cta: "Try Team Free for 14 Days",
    features: [
      "100 generated images/month",
      "3 connected channels",
      "All 17+ art styles",
      "Custom style prompts",
      "Full gallery with search",
      "Weekly digest",
      "Download images",
    ],
  },
  {
    name: "Business",
    monthlyPrice: 79,
    annualPrice: 66,
    images: 500,
    popular: false,
    description: "For really big teams or excessively ridiculous small ones.",
    cta: "Try Business Free",
    features: [
      "500 generated images/month",
      "Unlimited channels",
      "Everything in Team",
      "API access",
      "Priority generation queue",
      "CSV export",
      "Custom brand watermark",
    ],
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
            One price. Your whole team.
          </h2>
          <p className="mt-4 text-center text-lg text-[#4A4A4A]">
            Every plan includes AI quote detection, instant image generation,
            and full Slack integration — no per-seat fees.
          </p>

          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${!isAnnual ? "font-medium text-[#1A1A1A]" : "text-[#4A4A4A]"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${isAnnual ? "bg-[#7C3AED]" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isAnnual ? "translate-x-5.5" : "translate-x-0.5"}`}
                />
              </button>
              <span
                className={`text-sm ${isAnnual ? "font-medium text-[#1A1A1A]" : "text-[#4A4A4A]"}`}
              >
                Annual
              </span>
              {isAnnual && <Badge variant="default">Save 17%</Badge>}
            </div>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 100}>
              <div
                className={`relative flex h-full flex-col rounded-xl border-2 bg-white p-6 transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] ${tier.popular ? "border-[#7C3AED] shadow-[4px_4px_0px_0px_#7C3AED] hover:shadow-[2px_2px_0px_0px_#7C3AED]" : "border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_0px_#1A1A1A]"}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    POPULAR
                  </Badge>
                )}
                <h3 className="text-lg font-semibold text-[#1A1A1A]">
                  {tier.name}
                </h3>
                {"description" in tier && tier.description && (
                  <p className="mt-1 text-sm text-[#4A4A4A]">
                    {tier.description}
                  </p>
                )}
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#1A1A1A]">
                    ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-[#4A4A4A]">/mo</span>
                </div>
                {isAnnual && tier.annualPrice > 0 && (
                  <p className="mt-1 text-xs text-[#4A4A4A]">billed annually</p>
                )}
                <p className="mt-2 text-sm font-medium text-[#7C3AED]">
                  {tier.images} images/month
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-[#4A4A4A]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="/api/slack/install"
                  className="mt-auto block cursor-pointer pt-8"
                >
                  <MarketingButton
                    variant={tier.popular ? "default" : "secondary"}
                    className="w-full"
                  >
                    {tier.cta}
                  </MarketingButton>
                </a>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200}>
          <p className="mt-8 text-center text-sm text-[#4A4A4A]">
            Need more than 500 images? Contact us for a custom Enterprise plan
            with unlimited generation and dedicated support.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
