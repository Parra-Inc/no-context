import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stripe, TOKEN_PACKS } from "@/lib/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { checkoutToken: token, isActive: true },
    select: { id: true, slackTeamName: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { packId } = await request.json();
  const pack = TOKEN_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const customer = await stripe.customers.create({
    metadata: {
      workspaceId: workspace.id,
      source: "public_checkout",
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/checkout/${token}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/${token}`,
    metadata: {
      workspaceId: workspace.id,
      tokenPackId: pack.id,
      creditsToAdd: String(pack.credits),
      type: "token_pack",
      source: "public_checkout",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
