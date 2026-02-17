import Link from "next/link";
import { Logo } from "@/components/logo";
import { COPYRIGHT_HOLDER } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Logo size="sm" />
            <p className="mt-2 text-sm text-[#4A4A4A]">
              The Slack bot that turns your team&apos;s funniest quotes into
              art.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Product</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#how-it-works"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#styles"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Gallery
                </a>
              </li>
              <li>
                <Link
                  href="/explore"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Explore
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Company</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Legal</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="cursor-pointer text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6">
          <p className="text-center text-xs text-[#4A4A4A]">
            &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. Made
            exclusively with good vibes.
          </p>
        </div>
      </div>
    </footer>
  );
}
