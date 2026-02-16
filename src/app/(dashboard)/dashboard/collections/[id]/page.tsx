import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CollectionDetailClient } from "@/components/dashboard/collection-detail-client";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.workspaceId) {
    redirect("/signin");
  }

  const collection = await prisma.collection.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
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
