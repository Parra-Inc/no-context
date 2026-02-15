import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SettingsBilling } from "@/components/dashboard/settings-billing";

export default async function BillingPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

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

  return (
    <SettingsBilling
      tier={tier}
      quota={quota}
      used={used}
      remaining={remaining}
      usagePercent={usagePercent}
      bonusCredits={subscription?.bonusCredits || 0}
      hasStripeCustomer={!!subscription?.stripeCustomerId}
      currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
    />
  );
}
