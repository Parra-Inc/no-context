"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TOKEN_PACKS = [
  { id: "PACK_10", credits: 10, price: "$4.99", perImage: "$0.50" },
  { id: "PACK_25", credits: 25, price: "$9.99", perImage: "$0.40" },
  { id: "PACK_50", credits: 50, price: "$14.99", perImage: "$0.30" },
  {
    id: "PACK_100",
    credits: 100,
    price: "$24.99",
    perImage: "$0.25",
    popular: true,
  },
  { id: "PACK_250", credits: 250, price: "$49.99", perImage: "$0.20" },
  { id: "PACK_500", credits: 500, price: "$74.99", perImage: "$0.15" },
  { id: "PACK_1000", credits: 1000, price: "$119.99", perImage: "$0.12" },
  { id: "PACK_2000", credits: 2000, price: "$199.99", perImage: "$0.10" },
];

interface CheckoutContentProps {
  token: string;
  workspaceName: string;
  workspaceIcon: string | null;
}

export function CheckoutContent({
  token,
  workspaceName,
  workspaceIcon,
}: CheckoutContentProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function buyPack(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch(`/api/checkout/${token}/token-packs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start checkout");
        return;
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Workspace identity */}
        <div className="mb-6 flex flex-col items-center gap-3">
          {workspaceIcon && (
            <Image
              src={workspaceIcon}
              alt={workspaceName}
              width={64}
              height={64}
              className="rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A]"
            />
          )}
          <h1 className="text-center text-2xl font-bold text-[#1A1A1A]">
            {workspaceName}
          </h1>
        </div>

        {/* Warning banner */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Only continue if you clicked this link from your Slack workspace and
            you are sure this is the correct workspace.
          </p>
        </div>

        {/* Section 1: Admin */}
        <div className="mb-6 rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              I am a workspace admin
            </h2>
          </div>
          <p className="mb-4 text-sm text-[#4A4A4A]">
            Sign in to manage your subscription, upgrade your plan, and view
            billing history from the dashboard.
          </p>
          <Link
            href="/signin"
            className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-[#1A1A1A] bg-white px-6 text-sm font-bold text-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            Sign in to dashboard
          </Link>
        </div>

        {/* Section 2: Buy images */}
        <div className="rounded-xl border-2 border-[#1A1A1A] bg-white p-6 shadow-[3px_3px_0px_0px_#1A1A1A]">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              I just want more images
            </h2>
          </div>
          <p className="mb-6 text-sm text-[#4A4A4A]">
            Buy extra image generations for your workspace. These credits never
            expire and are used after the monthly quota runs out.
          </p>

          {/* Token pack grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TOKEN_PACKS.map((pack) => {
              const isLoading = loading === pack.id;

              return (
                <button
                  key={pack.id}
                  onClick={() => buyPack(pack.id)}
                  disabled={isLoading}
                  className={`group relative cursor-pointer rounded-xl border-2 p-4 text-center transition-all hover:shadow-sm disabled:cursor-wait disabled:opacity-70 ${
                    pack.popular
                      ? "border-[#7C3AED] ring-1 ring-[#7C3AED]/20 hover:ring-[#7C3AED]/40"
                      : "border-gray-200 hover:border-[#7C3AED]/30"
                  }`}
                >
                  {pack.popular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">
                      Popular
                    </Badge>
                  )}
                  <div className="text-2xl font-bold text-[#1A1A1A]">
                    {pack.credits}
                  </div>
                  <div className="text-[10px] tracking-wider text-[#4A4A4A]/60 uppercase">
                    images
                  </div>
                  <div className="mt-3 text-base font-bold text-[#1A1A1A]">
                    {pack.price}
                  </div>
                  <div className="text-[10px] text-[#4A4A4A]/60">
                    {pack.perImage} each
                  </div>
                  {isLoading && (
                    <Loader2 className="absolute top-2 right-2 h-3.5 w-3.5 animate-spin text-[#4A4A4A]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-4 text-xs text-[#4A4A4A]/60">
          <Link href="/privacy" className="hover:text-[#4A4A4A]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#4A4A4A]">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
