import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CollectionsClient } from "@/components/dashboard/collections-client";
import { assertWorkspace } from "@/lib/workspace";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { workspaceSlug } = await params;
  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
    select: { tier: true },
  });

  const tier = subscription?.tier || "FREE";

  return <CollectionsClient subscriptionTier={tier} />;
}
