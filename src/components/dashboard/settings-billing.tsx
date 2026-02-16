"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { TokenPackGrid } from "@/components/dashboard/token-pack-grid";
import {
  BillingHistory,
  type InvoiceData,
  type TokenPurchaseData,
} from "@/components/dashboard/billing-history";
import { TIER_QUOTAS, TIER_MAX_CHANNELS } from "@/lib/tier-constants";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TIER_ORDER = ["FREE", "STARTER", "TEAM", "BUSINESS"];

const PLANS = [
  {
    tier: "FREE",
    name: "Free",
    price: 0,
    period: "",
    description: "Get started with the basics",
    features: [
      `${TIER_QUOTAS.FREE} images per month`,
      `${TIER_MAX_CHANNELS.FREE} channel`,
      "AI style selection",
    ],
  },
  {
    tier: "STARTER",
    name: "Starter",
    price: 8,
    period: "/mo",
    description: "For individuals getting serious",
    features: [
      `${TIER_QUOTAS.STARTER} images per month`,
      `${TIER_MAX_CHANNELS.STARTER} channel`,
      "No watermark",
      "AI style selection",
    ],
  },
  {
    tier: "TEAM",
    name: "Team",
    price: 20,
    period: "/mo",
    description: "For teams that want more",
    popular: true,
    features: [
      `${TIER_QUOTAS.TEAM} images per month`,
      `${TIER_MAX_CHANNELS.TEAM} channels`,
      "No watermark",
      "Custom styles",
      "AI style selection",
    ],
  },
  {
    tier: "BUSINESS",
    name: "Business",
    price: 60,
    period: "/mo",
    description: "For organizations at scale",
    features: [
      `${TIER_QUOTAS.BUSINESS} images per month`,
      "Unlimited channels",
      "No watermark",
      "Custom styles",
      "AI style selection",
      "Priority support",
    ],
  },
];

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAST_DUE: { label: "Past Due", variant: "warning" },
  CANCELED: { label: "Canceled", variant: "destructive" },
  TRIALING: { label: "Trial", variant: "outline" },
  UNPAID: { label: "Unpaid", variant: "destructive" },
};

interface SettingsBillingProps {
  tier: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  quota: number;
  used: number;
  remaining: number;
  usagePercent: number;
  bonusCredits: number;
  hasStripeCustomer: boolean;
  currentPeriodEnd: string | null;
  channelsUsed: number;
  invoices: InvoiceData[];
  tokenPurchases: TokenPurchaseData[];
}

export function SettingsBilling({
  tier,
  status,
  cancelAtPeriodEnd,
  quota,
  used,
  remaining,
  usagePercent,
  bonusCredits,
  hasStripeCustomer,
  currentPeriodEnd,
  channelsUsed,
  invoices,
  tokenPurchases,
}: SettingsBillingProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const statusInfo = STATUS_LABEL[status] || STATUS_LABEL.ACTIVE;
  const currentTierIndex = TIER_ORDER.indexOf(tier);
  const maxChannels = TIER_MAX_CHANNELS[tier] ?? 1;

  async function handlePlanChange(targetTier: string) {
    if (targetTier === tier || targetTier === "FREE") return;
    setLoadingTier(targetTier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier, interval: "monthly" }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start checkout");
        return;
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingTier(null);
    }
  }

  function getPlanAction(planTier: string) {
    if (planTier === tier)
      return {
        label: "Current plan",
        disabled: true,
        variant: "outline" as const,
      };
    const planIndex = TIER_ORDER.indexOf(planTier);
    if (planTier === "FREE")
      return {
        label: "Downgrade",
        disabled: true,
        variant: "outline" as const,
      };
    if (planIndex > currentTierIndex)
      return { label: "Upgrade", disabled: false, variant: "default" as const };
    return { label: "Downgrade", disabled: false, variant: "outline" as const };
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-foreground text-xl font-semibold">Billing</h2>
        <p className="text-muted-foreground/60 mt-1 text-sm">
          Manage your plan, usage, and payment history
        </p>
      </div>

      {/* Usage overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-foreground text-sm font-medium">
                {PLANS.find((p) => p.tier === tier)?.name || tier} plan
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <BillingActions tier={tier} hasStripeCustomer={hasStripeCustomer} />
          </div>

          {cancelAtPeriodEnd && currentPeriodEnd && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600" />
              <p className="text-xs text-yellow-700">
                Cancels{" "}
                {new Date(currentPeriodEnd).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {/* Images */}
            <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-medium">
                  Images
                </span>
                <span className="text-muted-foreground/60 text-xs tabular-nums">
                  {remaining} remaining
                  {bonusCredits > 0 && (
                    <span className="text-primary ml-1 font-medium">
                      +{bonusCredits} bonus
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums">
                  {used}
                </span>
                <span className="text-muted-foreground/60 mb-0.5 text-xs">
                  / {quota}
                </span>
              </div>
              <Progress
                value={used}
                max={quota}
                className={`mt-2 h-2 ${usagePercent >= 90 ? "[&>div]:bg-red-500" : usagePercent >= 70 ? "[&>div]:bg-yellow-500" : ""}`}
              />
            </div>

            {/* Channels */}
            <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-medium">
                  Channels
                </span>
                <span className="text-muted-foreground/60 text-xs tabular-nums">
                  {maxChannels === Infinity
                    ? "Unlimited"
                    : `${Math.max(maxChannels - channelsUsed, 0)} remaining`}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums">
                  {channelsUsed}
                </span>
                <span className="text-muted-foreground/60 mb-0.5 text-xs">
                  / {maxChannels === Infinity ? "Unlimited" : maxChannels}
                </span>
              </div>
              {maxChannels !== Infinity && (
                <Progress
                  value={channelsUsed}
                  max={maxChannels}
                  className="mt-2 h-2"
                />
              )}
            </div>

            {/* Reset date */}
            {currentPeriodEnd && !cancelAtPeriodEnd && (
              <p className="text-muted-foreground/60 text-xs">
                Resets{" "}
                {new Date(currentPeriodEnd).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-foreground text-base font-semibold">Plans</h3>
        <p className="text-muted-foreground/60 mt-1 text-sm">
          Choose the plan that works for your team
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const action = getPlanAction(plan.tier);
            const isCurrent = plan.tier === tier;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.tier}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/[0.02] ring-primary/20 ring-1"
                    : isPopular
                      ? "border-primary/30 hover:border-primary/50"
                      : "border-border hover:border-border/80"
                }`}
              >
                {isPopular && !isCurrent && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px]">
                    Most popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="border-primary text-primary absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-[10px]"
                  >
                    Current
                  </Badge>
                )}

                <div className="mt-1 mb-4">
                  <h4 className="text-foreground text-sm font-semibold">
                    {plan.name}
                  </h4>
                  <p className="text-muted-foreground/60 mt-0.5 text-xs">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-5">
                  <span className="text-foreground text-3xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground/60 text-sm">
                      {plan.period}
                    </span>
                  )}
                  {plan.price > 0 && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      ${(plan.price / TIER_QUOTAS[plan.tier]).toFixed(2)} per
                      image
                    </p>
                  )}
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-muted-foreground flex items-start gap-2 text-xs"
                    >
                      <Check className="text-primary mt-0.5 h-3 w-3 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={action.variant}
                  size="sm"
                  className="w-full"
                  disabled={action.disabled || loadingTier === plan.tier}
                  onClick={() => handlePlanChange(plan.tier)}
                >
                  {loadingTier === plan.tier ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    action.label
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Extra Image Generations */}
      <div>
        <h3 className="text-foreground text-base font-semibold">
          Extra Image Generations
        </h3>
        <p className="text-muted-foreground/60 mt-1 text-sm">
          Buy extra images that never expire. Used after your monthly quota runs
          out.
        </p>
        <div className="mt-5">
          <TokenPackGrid bonusCredits={bonusCredits} />
        </div>
      </div>

      <Separator />

      {/* Billing History */}
      <BillingHistory invoices={invoices} tokenPurchases={tokenPurchases} />
    </div>
  );
}
