import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with No Context. Contact support, browse FAQs, and find answers about the Slack app that turns quotes into AI art.",
  alternates: {
    canonical: "/support",
  },
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <h1 className="font-display text-3xl text-[#1A1A1A]">Support</h1>
      <div className="mt-8 space-y-6 text-[#4A4A4A]">
        <p>Need help with No Context? We&apos;re here for you.</p>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Email Support
          </h2>
          <p className="mt-2">
            Send us an email at{" "}
            <a
              href="mailto:support@nocontextbot.com"
              className="text-[#7C3AED] hover:underline"
            >
              support@nocontextbot.com
            </a>
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">FAQ</h2>
          <p className="mt-2">
            Check our{" "}
            <a href="/#faq" className="text-[#7C3AED] hover:underline">
              frequently asked questions
            </a>{" "}
            for quick answers.
          </p>
        </div>
      </div>
    </div>
  );
}
