"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";

const TOKEN_PACKS = [
  {
    id: "PACK_10",
    credits: 10,
    price: "$4.99",
    perImage: "$0.50",
    popular: false,
  },
  {
    id: "PACK_25",
    credits: 25,
    price: "$9.99",
    perImage: "$0.40",
    popular: false,
  },
  {
    id: "PACK_50",
    credits: 50,
    price: "$14.99",
    perImage: "$0.30",
    popular: false,
  },
  {
    id: "PACK_100",
    credits: 100,
    price: "$24.99",
    perImage: "$0.25",
    popular: true,
  },
  {
    id: "PACK_250",
    credits: 250,
    price: "$49.99",
    perImage: "$0.20",
    popular: false,
  },
  {
    id: "PACK_500",
    credits: 500,
    price: "$74.99",
    perImage: "$0.15",
    popular: false,
  },
  {
    id: "PACK_1000",
    credits: 1000,
    price: "$119.99",
    perImage: "$0.12",
    popular: false,
  },
  {
    id: "PACK_2000",
    credits: 2000,
    price: "$199.99",
    perImage: "$0.10",
    popular: false,
  },
];

interface TokenPackGridProps {
  bonusCredits: number;
}

export function TokenPackGrid({ bonusCredits }: TokenPackGridProps) {
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = useState<string | null>(null);

  async function buyPack(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/stripe/token-packs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
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
        <p className="text-primary mb-4 text-xs font-medium">
          {bonusCredits} bonus {bonusCredits === 1 ? "credit" : "credits"}{" "}
          remaining
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {TOKEN_PACKS.map((pack) => {
          const isLoading = loading === pack.id;

          return (
            <button
              key={pack.id}
              onClick={() => buyPack(pack.id)}
              disabled={isLoading}
              className={`group relative cursor-pointer rounded-xl border p-4 text-center transition-all hover:shadow-sm disabled:cursor-wait disabled:opacity-70 ${
                pack.popular
                  ? "border-primary/40 ring-primary/20 hover:ring-primary/40 ring-1"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {pack.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">
                  Popular
                </Badge>
              )}
              <div className="text-foreground text-2xl font-bold">
                {pack.credits}
              </div>
              <div className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
                images
              </div>
              <div className="text-foreground mt-3 text-base font-bold">
                {pack.price}
              </div>
              <div className="text-muted-foreground/60 text-[10px]">
                {pack.perImage} each
              </div>
              {isLoading && (
                <Loader2 className="text-muted-foreground absolute top-2 right-2 h-3.5 w-3.5 animate-spin" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
