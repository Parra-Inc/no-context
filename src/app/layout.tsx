import type { Metadata } from "next";
import "./globals.css";
import { DEFAULT_BASE_URL } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "No Context — Turn Slack Quotes into AI Art",
    template: "%s | No Context",
  },
  description:
    "No Context is a Slack app that turns your team's funniest out-of-context quotes into AI-generated paintings. 15+ art styles. Zero effort. Boost team morale.",
  applicationName: "No Context",
  authors: [{ name: "No Context" }],
  creator: "No Context",
  publisher: "No Context",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "No Context",
    title: "No Context — Turn Slack Quotes into AI Art",
    description:
      "Every out-of-context quote your team posts becomes a one-of-a-kind AI-generated painting.",
  },
  twitter: {
    card: "summary_large_image",
    title: "No Context — Turn Slack Quotes into AI Art",
    description:
      "Every out-of-context quote your team posts becomes a one-of-a-kind AI-generated painting.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
