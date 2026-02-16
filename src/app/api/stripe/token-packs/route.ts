import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  stripe,
  TOKEN_PACKS,
  createTokenPackCheckoutSession,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packId } = await request.json();
  const pack = TOKEN_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });

  // Create a Stripe customer + subscription record for free users
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

  const checkoutSession = await createTokenPackCheckoutSession(
    subscription.stripeCustomerId!,
    session.user.workspaceId,
    pack,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
