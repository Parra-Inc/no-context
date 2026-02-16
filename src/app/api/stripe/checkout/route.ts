import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe, PRICE_IDS, createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier, interval = "monthly" } = await request.json();

  const priceKey = `${tier}_${interval.toUpperCase()}`;
  const priceId = PRICE_IDS[priceKey];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });

  // Create a Stripe customer if needed
  if (!subscription?.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: { workspaceId: session.user.workspaceId },
    });

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { workspaceId: session.user.workspaceId },
        data: { stripeCustomerId: customer.id },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          workspaceId: session.user.workspaceId,
          stripeCustomerId: customer.id,
        },
      });
    }
  }

  // If user already has an active subscription, use billing portal for plan changes
  if (subscription.stripeSubscriptionId) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings/billing`,
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: subscription.stripeSubscriptionId,
          items: [
            {
              id: (
                await stripe.subscriptions.retrieve(
                  subscription.stripeSubscriptionId,
                )
              ).items.data[0].id,
              price: priceId,
              quantity: 1,
            },
          ],
        },
      },
    });

    return NextResponse.json({ url: portalSession.url });
  }

  // New subscription checkout
  const checkoutSession = await createCheckoutSession(
    subscription.stripeCustomerId!,
    priceId,
    session.user.workspaceId,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
