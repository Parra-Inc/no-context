import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  keywords: [
    "no context slack",
    "slack app",
    "team culture",
    "office quotes",
    "AI art",
    "workplace humor",
    "slack bot",
    "team morale",
    "AI generated art",
    "out of context quotes",
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
