import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for No Context, the Slack app that turns out-of-context quotes into AI-generated art.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <h1 className="font-display text-3xl text-[#1A1A1A]">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-[#4A4A4A]">
        <p>Last updated: February 2026</p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          Service Description
        </h2>
        <p>
          No Context is a Slack application that generates AI artwork from
          out-of-context quotes posted in Slack channels. By using the service,
          you agree to these terms.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Acceptable Use</h2>
        <p>
          You agree to use No Context only for its intended purpose. You will
          not use the service to generate inappropriate, harmful, or illegal
          content. Custom style prompts must be workplace-appropriate.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Billing</h2>
        <p>
          Paid plans are billed monthly or annually through Stripe. You may
          cancel at any time. Refunds are not provided for partial billing
          periods. Unused image generation credits do not roll over.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          Content Ownership
        </h2>
        <p>
          You retain ownership of your quotes and workspace data. Generated
          images are provided under a license for your use. We do not claim
          ownership of generated artwork.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          User-Generated Content
        </h2>
        <p>
          All images produced by No Context are generated based on quotes and
          prompts submitted by users. Because this content is user-directed, we
          are not responsible for the nature, accuracy, or appropriateness of
          any generated images or the underlying text used to create them. You
          are solely responsible for the content you submit and the resulting
          output.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          Limitation of Liability
        </h2>
        <p>
          No Context is provided &ldquo;as is&rdquo; without warranty. We are
          not liable for any damages arising from use of the service.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Contact</h2>
        <p>
          Questions?{" "}
          <a href="/contact" className="text-[#7C3AED] hover:underline">
            Contact us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
