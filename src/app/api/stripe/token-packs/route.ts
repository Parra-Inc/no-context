import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TOKEN_PACKS, createTokenPackCheckoutSession } from "@/lib/stripe";

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

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 },
    );
  }

  const checkoutSession = await createTokenPackCheckoutSession(
    subscription.stripeCustomerId,
    session.user.workspaceId,
    pack,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
