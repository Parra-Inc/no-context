import { Hero } from "@/components/marketing/hero";
import { SocialProof } from "@/components/marketing/social-proof";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MoraleSection } from "@/components/marketing/morale-section";
import { StylesShowcase } from "@/components/marketing/styles-showcase";
import { ExampleGallery } from "@/components/marketing/example-gallery";
import { Features } from "@/components/marketing/features";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";
import { DEFAULT_BASE_URL } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "No Context",
  url: baseUrl,
  logo: `${baseUrl}/icon.svg`,
  description:
    "No Context is a Slack app that turns your team's funniest out-of-context quotes into AI-generated paintings.",
  contactPoint: {
    "@type": "ContactPoint",
    url: `${baseUrl}/contact`,
    contactType: "customer support",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "No Context",
  operatingSystem: "Web",
  applicationCategory: "BusinessApplication",
  description:
    "A Slack app that turns out-of-context team quotes into AI-generated paintings. 15+ art styles.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "5 AI-generated images per month",
    },
    {
      "@type": "Offer",
      price: "9",
      priceCurrency: "USD",
      name: "Starter",
      description: "25 AI-generated images per month",
    },
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "USD",
      name: "Team",
      description: "100 AI-generated images per month",
    },
    {
      "@type": "Offer",
      price: "79",
      priceCurrency: "USD",
      name: "Business",
      description: "500 AI-generated images per month",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a #no-context channel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It's a Slack channel where people post funny quotes they overhear at work — completely stripped of context. Many companies already have one. If yours doesn't, you're about to start one.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI know it's a real quote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: 'We use AI to understand the intent of each message. It can tell the difference between someone dropping a hilarious out-of-context quote and someone asking "what\'s for lunch?" No keywords, no special formatting needed.',
      },
    },
    {
      "@type": "Question",
      name: "Do we need to already have a #no-context channel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nope! You can create one as part of setup. Installing No Context is a great excuse to start one.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when we hit our monthly limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The bot lets you know with a friendly message and stops generating images for the rest of the month. No surprise charges, ever. Upgrade anytime to keep the art flowing.",
      },
    },
    {
      "@type": "Question",
      name: "Does our whole team need accounts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. One person installs it, everyone benefits. There's no per-seat pricing. Anyone in the connected Slack channel can post quotes and see generated art.",
      },
    },
    {
      "@type": "Question",
      name: "What art styles are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We have 15+ styles including Watercolor, Picasso (Cubism), Van Gogh, Pop Art, Hokusai, Dali, Studio Ghibli, Pixel Art, and more. On Team plans and above, you can write your own custom style prompts.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No contracts, no cancellation fees. Cancel from your dashboard and you'll keep access through the end of your billing period.",
      },
    },
    {
      "@type": "Question",
      name: "Is our data private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Your quotes and images are only accessible to your workspace. We don't share, sell, or use your quotes for training. You own your content.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work in private channels?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Currently No Context only works in public channels. Private channel support is on our roadmap.",
      },
    },
    {
      "@type": "Question",
      name: "Can we use this for other channels besides #no-context?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! It works in any channel where people post out-of-context quotes. Connect up to 3 channels on the Team plan.",
      },
    },
  ],
};

export default function MarketingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationSchema,
            softwareAppSchema,
            faqSchema,
          ]),
        }}
      />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <MoraleSection />
      <StylesShowcase />
      <ExampleGallery />
      <Features />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
