import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const portalSession = await createCustomerPortalSession(
    subscription.stripeCustomerId,
  );

  return NextResponse.json({ url: portalSession.url });
}
