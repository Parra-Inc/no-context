import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CollectionDetailClient } from "@/components/dashboard/collection-detail-client";
import { assertWorkspace } from "@/lib/workspace";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; id: string }>;
}) {
  const session = await auth();
  const { workspaceSlug, id } = await params;

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);

  const collection = await prisma.collection.findFirst({
    where: { id, workspaceId: workspace.id },
    select: { id: true, name: true, emoji: true },
  });

  if (!collection) notFound();

  return (
    <CollectionDetailClient
      collectionId={collection.id}
      initialName={collection.name}
      initialEmoji={collection.emoji}
    />
  );
}
