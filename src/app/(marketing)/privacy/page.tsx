import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how No Context handles your Slack data, what we collect, how we store it, and how to request deletion.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <h1 className="font-display text-3xl text-[#1A1A1A]">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-[#4A4A4A]">
        <p>Last updated: February 2026</p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          What We Collect
        </h2>
        <p>
          No Context collects Slack messages from channels you connect to the
          app. We process these messages to detect out-of-context quotes and
          generate artwork. We store quote text, generated images, and workspace
          metadata.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          How We Use Your Data
        </h2>
        <p>
          Your data is used solely to provide the No Context service — detecting
          quotes and generating art. We do not sell, share, or use your data for
          training AI models.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Data Storage</h2>
        <p>
          Data is stored securely in encrypted databases. Slack bot tokens are
          encrypted at rest using AES-256-GCM. Generated images are stored in
          cloud storage accessible only to your workspace.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Data Deletion</h2>
        <p>
          If you uninstall the app, your workspace is marked as inactive. You
          can request full data deletion by contacting support.
        </p>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Contact</h2>
        <p>For privacy questions, contact us at privacy@nocontextbot.com.</p>
      </div>
    </div>
  );
}
