"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#styles", label: "Styles" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b-2 border-[#1A1A1A] bg-white transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo size="sm" />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer text-sm font-bold text-[#1A1A1A] transition-colors hover:text-[#7C3AED]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/signin">
            <MarketingButton variant="secondary" size="sm">
              Sign In
            </MarketingButton>
          </Link>
          <a href="/api/slack/install">
            <MarketingButton size="sm">Add to Slack</MarketingButton>
          </a>
        </div>

        <button
          className="cursor-pointer md:hidden"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t-2 border-[#1A1A1A] bg-white px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block cursor-pointer py-2 text-sm font-bold text-[#1A1A1A]"
              onClick={() => setIsMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/signin">
              <MarketingButton variant="secondary" className="w-full">
                Sign In
              </MarketingButton>
            </Link>
            <a href="/api/slack/install">
              <MarketingButton className="w-full">Add to Slack</MarketingButton>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
