import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CollectionsClient } from "@/components/dashboard/collections-client";

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    redirect("/signin");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { tier: true },
  });

  const tier = subscription?.tier || "FREE";

  return <CollectionsClient subscriptionTier={tier} />;
}
