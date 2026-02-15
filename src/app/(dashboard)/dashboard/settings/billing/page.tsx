import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BillingActions } from "@/components/dashboard/billing-actions";
import {
  TIER_QUOTAS,
  TIER_MAX_CHANNELS,
  TIER_HAS_WATERMARK,
} from "@/lib/stripe";
import { Check, X } from "lucide-react";

const PLANS = [
  { tier: "FREE", name: "Free", price: "$0", period: "" },
  { tier: "STARTER", name: "Starter", price: "$9", period: "/mo" },
  { tier: "TEAM", name: "Team", price: "$29", period: "/mo" },
  { tier: "BUSINESS", name: "Business", price: "$79", period: "/mo" },
];

export default async function BillingPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const [subscription, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.usageRecord.findFirst({
      where: {
        workspaceId,
        periodStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
    }),
  ]);

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;
  const remaining = Math.max(quota - used, 0);
  const usagePercent = quota > 0 ? (used / quota) * 100 : 0;
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Billing</h1>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge>{tier}</Badge>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4A4A4A]">Usage this month</span>
              <span className="font-medium text-[#1A1A1A]">
                {used} / {quota} ({remaining} remaining)
              </span>
            </div>
            <Progress
              value={used}
              max={quota}
              className={`mt-2 ${usagePercent >= 90 ? "[&>div]:bg-red-500" : usagePercent >= 70 ? "[&>div]:bg-yellow-500" : ""}`}
            />
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-[#4A4A4A]">
              Current period ends:{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" },
              )}
            </p>
          )}
          <BillingActions tier={tier} hasStripeCustomer={hasStripeCustomer} />
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="mb-6">Compare Plans</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E5E5]">
                  <th className="pb-4 text-left font-medium text-[#4A4A4A]">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.tier}
                      className={`pb-4 text-center font-medium ${plan.tier === tier ? "text-[#7C3AED]" : "text-[#1A1A1A]"}`}
                    >
                      <div>{plan.name}</div>
                      <div className="mt-1 text-lg font-bold">
                        {plan.price}
                        <span className="text-xs font-normal text-[#9A9A9A]">
                          {plan.period}
                        </span>
                      </div>
                      {plan.tier === tier && (
                        <Badge className="mt-1 text-[10px]">Current</Badge>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-3 text-[#4A4A4A]">Monthly images</td>
                  {PLANS.map((plan) => (
                    <td
                      key={plan.tier}
                      className="py-3 text-center font-medium"
                    >
                      {TIER_QUOTAS[plan.tier]}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-3 text-[#4A4A4A]">Channels</td>
                  {PLANS.map((plan) => {
                    const max = TIER_MAX_CHANNELS[plan.tier];
                    return (
                      <td
                        key={plan.tier}
                        className="py-3 text-center font-medium"
                      >
                        {max === Infinity ? "Unlimited" : max}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-3 text-[#4A4A4A]">No watermark</td>
                  {PLANS.map((plan) => (
                    <td key={plan.tier} className="py-3 text-center">
                      {TIER_HAS_WATERMARK[plan.tier] ? (
                        <X className="mx-auto h-4 w-4 text-[#D4D4D4]" />
                      ) : (
                        <Check className="mx-auto h-4 w-4 text-green-600" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#E5E5E5]">
                  <td className="py-3 text-[#4A4A4A]">Custom styles</td>
                  {PLANS.map((plan) => (
                    <td key={plan.tier} className="py-3 text-center">
                      {["TEAM", "BUSINESS"].includes(plan.tier) ? (
                        <Check className="mx-auto h-4 w-4 text-green-600" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-[#D4D4D4]" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 text-[#4A4A4A]">AI style selection</td>
                  {PLANS.map((plan) => (
                    <td key={plan.tier} className="py-3 text-center">
                      <Check className="mx-auto h-4 w-4 text-green-600" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
