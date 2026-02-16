import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe, PRICE_IDS, createCheckoutSession } from "@/lib/stripe";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    workspaceId = await getWorkspaceFromRequest(session.user.id);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slug: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { tier, interval = "monthly" } = await request.json();

  const priceKey = `${tier}_${interval.toUpperCase()}`;
  const priceId = PRICE_IDS[priceKey];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  // Create a Stripe customer if needed
  if (!subscription?.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || undefined,
      metadata: { workspaceId },
    });

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { workspaceId },
        data: { stripeCustomerId: customer.id },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          workspaceId,
          stripeCustomerId: customer.id,
        },
      });
    }
  }

  // If user already has an active subscription, use billing portal for plan changes
  if (subscription.stripeSubscriptionId) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${workspace.slug}/settings/billing`,
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
    workspaceId,
    workspace.slug,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
