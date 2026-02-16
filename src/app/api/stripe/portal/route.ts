import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCustomerPortalSession } from "@/lib/stripe";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function POST() {
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

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 },
    );
  }

  const portalSession = await createCustomerPortalSession(
    subscription.stripeCustomerId,
    workspace.slug,
  );

  return NextResponse.json({ url: portalSession.url });
}
