"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BillingActionsProps {
  tier: string;
  hasStripeCustomer: boolean;
}

export function BillingActions({
  tier,
  hasStripeCustomer,
}: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function openBillingPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-3">
      {hasStripeCustomer && (
        <Button
          variant="secondary"
          onClick={openBillingPortal}
          disabled={loading === "portal"}
        >
          {loading === "portal" ? "Opening..." : "Manage Billing"}
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      )}
      {tier === "FREE" && (
        <Link href="/#pricing">
          <Button>Upgrade Plan</Button>
        </Link>
      )}
    </div>
  );
}
