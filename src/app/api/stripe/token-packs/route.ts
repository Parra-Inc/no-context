import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  stripe,
  TOKEN_PACKS,
  createTokenPackCheckoutSession,
} from "@/lib/stripe";
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

  const { packId } = await request.json();
  const pack = TOKEN_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  // Create a Stripe customer + subscription record for free users
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

  const checkoutSession = await createTokenPackCheckoutSession(
    subscription.stripeCustomerId!,
    workspaceId,
    pack,
    workspace.slug,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
