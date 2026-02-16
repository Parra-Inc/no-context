import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  TIER_QUOTAS,
  TIER_MAX_CHANNELS,
  TIER_HAS_WATERMARK,
  TIER_IMAGE_SIZE,
} from "@/lib/stripe";
import prisma from "@/lib/prisma";
import {
  notifyTokenPackPurchase,
  notifySubscriptionPurchase,
  notifySubscriptionCanceled,
} from "@/lib/slack-notifications";
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
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || ""]: "ENTERPRISE",
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || ""]: "ENTERPRISE",
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

      // Handle token pack one-time payments
      if (
        session.metadata?.type === "token_pack" &&
        session.mode === "payment"
      ) {
        const packId = session.metadata.tokenPackId;
        const creditsToAdd = parseInt(session.metadata.creditsToAdd || "0", 10);
        const workspaceId = session.metadata.workspaceId;

        if (!creditsToAdd || !workspaceId) {
          console.error(
            "Token pack webhook: missing metadata",
            session.metadata,
          );
          break;
        }

        // Idempotency: skip if already processed
        const existing = await prisma.tokenPurchase.findUnique({
          where: { stripeSessionId: session.id },
        });
        if (existing) break;

        await prisma.$transaction([
          prisma.subscription.update({
            where: { workspaceId },
            data: { bonusCredits: { increment: creditsToAdd } },
          }),
          prisma.tokenPurchase.create({
            data: {
              workspaceId,
              stripeSessionId: session.id,
              stripeCustomerId: customerId,
              packType: packId || "UNKNOWN",
              creditsAdded: creditsToAdd,
              amountPaid: session.amount_total || 0,
            },
          }),
        ]);

        const tokenWorkspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { slackTeamName: true },
        });

        notifyTokenPackPurchase({
          workspaceId,
          teamName: tokenWorkspace?.slackTeamName || workspaceId,
          packType: packId || "UNKNOWN",
          credits: creditsToAdd,
          amountCents: session.amount_total || 0,
        });

        break;
      }

      // Handle subscription checkout
      const subscriptionId = session.subscription as string;

      if (!subscriptionId) break;

      const subRaw = await stripe.subscriptions.retrieve(subscriptionId);
      const sub = subRaw as unknown as StripeSubscriptionData;
      const priceId = sub.items.data[0]?.price?.id || "";
      const tier = tierFromPriceId(priceId);

      const updatedSub = await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          tier,
          status: "ACTIVE",
          monthlyQuota: TIER_QUOTAS[tier] || 5,
          maxChannels: TIER_MAX_CHANNELS[tier] ?? 1,
          hasWatermark: TIER_HAS_WATERMARK[tier] ?? true,
          imageSize: TIER_IMAGE_SIZE[tier] || "1792x1024",
          currentPeriodStart: sub.current_period_start
            ? new Date(sub.current_period_start * 1000)
            : null,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null,
        },
        include: { workspace: { select: { slackTeamName: true } } },
      });

      notifySubscriptionPurchase({
        workspaceId: updatedSub.workspaceId,
        teamName: updatedSub.workspace.slackTeamName,
        tier,
        priceId,
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
          maxChannels: TIER_MAX_CHANNELS[tier] ?? 1,
          hasWatermark: TIER_HAS_WATERMARK[tier] ?? true,
          imageSize: TIER_IMAGE_SIZE[tier] || "1792x1024",
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

      const canceledSub = await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          tier: "FREE",
          status: "CANCELED",
          monthlyQuota: TIER_QUOTAS.FREE,
          maxChannels: TIER_MAX_CHANNELS.FREE,
          hasWatermark: TIER_HAS_WATERMARK.FREE,
          imageSize: TIER_IMAGE_SIZE.FREE,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
        include: { workspace: { select: { slackTeamName: true } } },
      });

      notifySubscriptionCanceled({
        workspaceId: canceledSub.workspaceId,
        teamName: canceledSub.workspace.slackTeamName,
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
