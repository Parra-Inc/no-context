import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { SettingsBilling } from "@/components/dashboard/settings-billing";
import { assertWorkspace } from "@/lib/workspace";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { workspaceSlug } = await params;
  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);
  const workspaceId = workspace.id;

  const [subscription, usage, tokenPurchases, channelCount] = await Promise.all(
    [
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
      prisma.tokenPurchase.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.channel.count({ where: { workspaceId } }),
    ],
  );

  // Fetch Stripe invoices if customer exists
  let invoices: Array<{
    id: string;
    number: string | null;
    status: string | null;
    amountPaid: number;
    currency: string;
    created: number;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  }> = [];

  if (subscription?.stripeCustomerId) {
    try {
      const invoicesResponse = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 50,
      });

      invoices = invoicesResponse.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        created: inv.created,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        invoicePdf: inv.invoice_pdf ?? null,
      }));
    } catch (err) {
      console.error("Failed to fetch Stripe invoices:", err);
    }
  }

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;
  const remaining = Math.max(quota - used, 0);
  const usagePercent = quota > 0 ? (used / quota) * 100 : 0;

  // Derive billing interval from the stored Stripe price ID
  const annualPriceIds = Object.entries(PRICE_IDS)
    .filter(([key]) => key.endsWith("_ANNUAL"))
    .map(([, id]) => id);
  const billingInterval: "monthly" | "annual" =
    subscription?.stripePriceId &&
    annualPriceIds.includes(subscription.stripePriceId)
      ? "annual"
      : "monthly";

  return (
    <SettingsBilling
      tier={tier}
      billingInterval={billingInterval}
      status={subscription?.status || "ACTIVE"}
      cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd || false}
      quota={quota}
      used={used}
      remaining={remaining}
      usagePercent={usagePercent}
      bonusCredits={subscription?.bonusCredits || 0}
      hasStripeCustomer={!!subscription?.stripeCustomerId}
      currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
      channelsUsed={channelCount}
      invoices={invoices}
      tokenPurchases={tokenPurchases.map((tp) => ({
        id: tp.id,
        packType: tp.packType,
        creditsAdded: tp.creditsAdded,
        amountPaid: tp.amountPaid,
        createdAt: tp.createdAt.toISOString(),
      }))}
    />
  );
}
