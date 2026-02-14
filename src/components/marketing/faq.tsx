"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { FadeIn } from "@/components/marketing/fade-in";

const faqs = [
  {
    question: "What is a #no-context channel?",
    answer:
      "It's a Slack channel where people post funny quotes they overhear at work — completely stripped of context. \"I can't believe the hamster survived\" hits different when you have no idea what meeting that came from. Many companies already have one. If yours doesn't, you're about to start one.",
  },
  {
    question: "How does the AI know it's a real quote?",
    answer:
      'We use AI to understand the intent of each message. It can tell the difference between someone dropping a hilarious out-of-context quote and someone asking "what\'s for lunch?" No keywords, no special formatting needed. Just post naturally.',
  },
  {
    question: "Do we need to already have a #no-context channel?",
    answer:
      "Nope! You can create one as part of setup. In fact, installing No Context Bot is a great excuse to start one. People will start posting once they see the art being generated.",
  },
  {
    question: "What happens when we hit our monthly limit?",
    answer:
      "The bot lets you know with a friendly message and stops generating images for the rest of the month. No surprise charges, ever. Unused images don't roll over. Upgrade anytime to keep the art flowing.",
  },
  {
    question: "Does our whole team need accounts?",
    answer:
      "No. One person installs it, everyone benefits. There's no per-seat pricing. Anyone in the connected Slack channel can post quotes and see generated art. The dashboard is accessible to the whole workspace.",
  },
  {
    question: "What art styles are available?",
    answer:
      "We have 15+ styles including Watercolor, Picasso (Cubism), Van Gogh, Pop Art, Hokusai, Dali, Studio Ghibli, Pixel Art, and more. On Team plans and above, you can write your own custom style prompts.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no cancellation fees. Cancel from your dashboard and you'll keep access through the end of your billing period.",
  },
  {
    question: "Is our data private?",
    answer:
      "Absolutely. Your quotes and images are only accessible to your workspace. We don't share, sell, or use your quotes for training. You own your content.",
  },
  {
    question: "Does it work in private channels?",
    answer:
      "Currently No Context Bot only works in public channels. Private channel support is on our roadmap.",
  },
  {
    question: "Can we use this for other channels besides #no-context?",
    answer:
      "Yes! It works in any channel where people post out-of-context quotes. Common channel names include #no-context, #out-of-context, #overheard, #random-quotes, and #things-people-say. Connect up to 3 channels on the Team plan.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h2 className="font-display text-center text-3xl text-[#1A1A1A] md:text-4xl">
            Questions? Answers.
          </h2>
        </FadeIn>
        <div className="mt-12 space-y-2">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div className="rounded-xl border border-[#E5E5E5] bg-white transition-shadow duration-200 hover:shadow-md">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#4A4A4A] transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <p className="text-sm text-[#4A4A4A]">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
