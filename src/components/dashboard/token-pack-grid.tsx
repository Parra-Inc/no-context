"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TOKEN_PACKS = [
  { id: "SMALL", credits: 10, price: "$5", perImage: "$0.50" },
  { id: "MEDIUM", credits: 30, price: "$12", perImage: "$0.40" },
  { id: "LARGE", credits: 75, price: "$25", perImage: "$0.33" },
  { id: "XL", credits: 200, price: "$50", perImage: "$0.25" },
];

interface TokenPackGridProps {
  hasStripeCustomer: boolean;
  bonusCredits: number;
}

export function TokenPackGrid({
  hasStripeCustomer,
  bonusCredits,
}: TokenPackGridProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function buyPack(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/stripe/token-packs", {
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
    <div>
      {bonusCredits > 0 && (
        <p className="mb-4 text-sm font-medium text-[#7C3AED]">
          You have {bonusCredits} bonus{" "}
          {bonusCredits === 1 ? "credit" : "credits"} remaining
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TOKEN_PACKS.map((pack) => (
          <div
            key={pack.id}
            className="rounded-xl border border-[#E5E5E5] p-4 text-center"
          >
            <div className="text-2xl font-bold text-[#1A1A1A]">
              {pack.credits}
            </div>
            <div className="text-xs text-[#4A4A4A]">images</div>
            <div className="mt-2 text-xl font-bold text-[#1A1A1A]">
              {pack.price}
            </div>
            <div className="text-xs text-[#9A9A9A]">{pack.perImage}/image</div>
            <Button
              className="mt-3 w-full"
              variant="secondary"
              size="sm"
              disabled={!hasStripeCustomer || loading === pack.id}
              onClick={() => buyPack(pack.id)}
            >
              {loading === pack.id ? "Loading..." : "Buy"}
            </Button>
          </div>
        ))}
      </div>
      {!hasStripeCustomer && (
        <p className="mt-3 text-xs text-[#9A9A9A]">
          Upgrade to a paid plan to enable token pack purchases.
        </p>
      )}
    </div>
  );
}
