import { NextRequest, NextResponse } from "next/server";
import { stripe, TIER_QUOTAS } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import type { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

interface StripeSubscriptionData {
  customer: string;
  status: string;
  items: { data: Array<{ price?: { id: string } }> };
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
}

function tierFromPriceId(priceId: string): SubscriptionTier {
  const priceToTier: Record<string, SubscriptionTier> = {
    [process.env.STRIPE_PRICE_STARTER_MONTHLY || ""]: "STARTER",
    [process.env.STRIPE_PRICE_STARTER_ANNUAL || ""]: "STARTER",
    [process.env.STRIPE_PRICE_TEAM_MONTHLY || ""]: "TEAM",
    [process.env.STRIPE_PRICE_TEAM_ANNUAL || ""]: "TEAM",
    [process.env.STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "BUSINESS",
    [process.env.STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "BUSINESS",
  };
  return priceToTier[priceId] || "FREE";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!subscriptionId) break;

      const subRaw = await stripe.subscriptions.retrieve(subscriptionId);
      const sub = subRaw as unknown as StripeSubscriptionData;
      const priceId = sub.items.data[0]?.price?.id || "";
      const tier = tierFromPriceId(priceId);

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          tier,
          status: "ACTIVE",
          monthlyQuota: TIER_QUOTAS[tier] || 5,
          currentPeriodStart: sub.current_period_start
            ? new Date(sub.current_period_start * 1000)
            : null,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as StripeSubscriptionData;
      const customerId = sub.customer;
      const priceId = sub.items.data[0]?.price?.id || "";
      const tier = tierFromPriceId(priceId);

      let status: SubscriptionStatus = "ACTIVE";
      if (sub.status === "past_due") status = "PAST_DUE";
      if (sub.status === "trialing") status = "TRIALING";
      if (sub.status === "canceled") status = "CANCELED";
      if (sub.status === "unpaid") status = "UNPAID";

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          stripePriceId: priceId,
          tier,
          status,
          monthlyQuota: TIER_QUOTAS[tier] || 5,
          currentPeriodStart: sub.current_period_start
            ? new Date(sub.current_period_start * 1000)
            : null,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as StripeSubscriptionData;
      const customerId = sub.customer;

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          tier: "FREE",
          status: "CANCELED",
          monthlyQuota: TIER_QUOTAS.FREE,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as { customer: string };
      const customerId = invoice.customer;

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: { status: "PAST_DUE" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
