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
import { TIER_QUOTAS, TIER_MAX_CHANNELS, INFINITY } from "@/lib/tier-constants";
import { Switch } from "@/components/ui/switch";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";

const TIER_ORDER = ["FREE", "STARTER", "TEAM", "BUSINESS"];

const PLANS = [
  {
    tier: "FREE",
    name: "Free",
    price: 0,
    annualPrice: 0,
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
    annualPrice: 6,
    period: "/mo",
    description: "For individuals getting serious",
    features: [
      `${TIER_QUOTAS.STARTER} images per month`,
      `${TIER_MAX_CHANNELS.STARTER} channel`,
      "No watermark",
      "Collections",
      "AI style selection",
    ],
  },
  {
    tier: "TEAM",
    name: "Team",
    price: 20,
    annualPrice: 15,
    period: "/mo",
    description: "For teams that want more",
    popular: true,
    features: [
      `${TIER_QUOTAS.TEAM} images per month`,
      `${TIER_MAX_CHANNELS.TEAM} channels`,
      "No watermark",
      "Collections",
      "Custom styles",
      "AI style selection",
    ],
  },
  {
    tier: "BUSINESS",
    name: "Business",
    price: 60,
    annualPrice: 45,
    period: "/mo",
    description: "For organizations at scale",
    features: [
      `${TIER_QUOTAS.BUSINESS} images per month`,
      "Unlimited channels",
      "No watermark",
      "Collections",
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
  billingInterval: "monthly" | "annual";
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
  billingInterval,
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
  const { workspaceId } = useWorkspace();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(billingInterval === "annual");
  const statusInfo = STATUS_LABEL[status] || STATUS_LABEL.ACTIVE;
  const currentTierIndex = TIER_ORDER.indexOf(tier);
  const maxChannels = TIER_MAX_CHANNELS[tier] ?? 1;
  const currentInterval = isAnnual ? "annual" : "monthly";
  const intervalMatchesCurrent = currentInterval === billingInterval;

  async function handlePlanChange(targetTier: string) {
    if (
      (targetTier === tier && intervalMatchesCurrent) ||
      targetTier === "FREE"
    )
      return;
    setLoadingTier(targetTier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workspace-Id": workspaceId,
        },
        body: JSON.stringify({
          tier: targetTier,
          interval: isAnnual ? "annual" : "monthly",
        }),
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
    if (planTier === tier && (intervalMatchesCurrent || tier === "FREE"))
      return {
        label: "Current plan",
        disabled: true,
        variant: "outline" as const,
      };
    if (planTier === tier && !intervalMatchesCurrent)
      return {
        label: isAnnual ? "Switch to annual" : "Switch to monthly",
        disabled: false,
        variant: "default" as const,
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
                  Images / month
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
              {!cancelAtPeriodEnd && (
                <p className="text-muted-foreground/60 mt-2 text-[10px]">
                  Resets{" "}
                  {(currentPeriodEnd
                    ? new Date(currentPeriodEnd)
                    : new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        1,
                      )
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Channels */}
            <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-medium">
                  Channels
                </span>
                <span className="text-muted-foreground/60 text-xs tabular-nums">
                  {maxChannels >= INFINITY
                    ? "Unlimited"
                    : `${Math.max(maxChannels - channelsUsed, 0)} remaining`}
                </span>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums">
                  {channelsUsed}
                </span>
                <span className="text-muted-foreground/60 mb-0.5 text-xs">
                  / {maxChannels >= INFINITY ? "Unlimited" : maxChannels}
                </span>
              </div>
              {maxChannels < INFINITY && (
                <Progress
                  value={channelsUsed}
                  max={maxChannels}
                  className="mt-2 h-2"
                />
              )}
            </div>

            {/* Extra Image Generations */}
            {bonusCredits > 0 && (
              <div className="border-border bg-muted/30 rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-xs font-medium">
                    Extra Image Generations
                  </span>
                  <span className="text-muted-foreground/60 text-xs">
                    never expires
                  </span>
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-foreground text-2xl font-bold tracking-tight tabular-nums">
                    {bonusCredits}
                  </span>
                  <span className="text-muted-foreground/60 mb-0.5 text-xs">
                    available
                  </span>
                </div>
                <Progress value={100} className="[&>div]:bg-primary mt-2 h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-foreground text-base font-semibold">Plans</h3>
            <p className="text-muted-foreground/60 mt-1 text-sm">
              Choose the plan that works for your team
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${!isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span
                className={`text-sm ${isAnnual ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                Annual
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              save 25% with an annual plan
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const action = getPlanAction(plan.tier);
            const isCurrent =
              plan.tier === tier && (intervalMatchesCurrent || tier === "FREE");
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
                    ${isAnnual ? plan.annualPrice : plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground/60 text-sm">
                      {plan.period}
                    </span>
                  )}
                  {isAnnual && plan.annualPrice > 0 && (
                    <p className="text-muted-foreground/60 mt-1 text-xs">
                      ${plan.annualPrice * 12} billed annually
                    </p>
                  )}
                  {(isAnnual ? plan.annualPrice : plan.price) > 0 && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      $
                      {(
                        (isAnnual ? plan.annualPrice : plan.price) /
                        TIER_QUOTAS[plan.tier]
                      ).toFixed(2)}{" "}
                      per image
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
