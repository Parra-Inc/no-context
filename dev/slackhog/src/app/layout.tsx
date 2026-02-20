import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slackhog - Slack Development Simulator",
  description: "Local Slack API simulator for development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
