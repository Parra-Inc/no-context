"use client";

import Link from "next/link";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { FadeIn } from "@/components/marketing/fade-in";

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-b from-[#EDE9FE] to-[#FAFAF8] px-6 py-24">
      <FadeIn>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-[#1A1A1A] md:text-4xl">
            Your team is already saying funny things.
            <br />
            Turn them into{" "}
            <span className="relative inline-block">
              <span className="relative z-10">art.</span>
              <span className="absolute inset-0 -skew-x-2 rounded-lg bg-[#EDE9FE]" />
            </span>
          </h2>
          <div className="mt-8">
            <Link href="/api/slack/install">
              <MarketingButton size="xl">
                Add to Slack — It&apos;s Free
              </MarketingButton>
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#4A4A4A]">
            Setup in 60 seconds. No credit card required.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
