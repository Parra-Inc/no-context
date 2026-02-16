import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";
import { getWorkspaceFromRequest } from "@/lib/workspace";

const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().max(10).optional(),
});

// GET: list all collections for workspace with quote counts and cover image
export async function GET() {
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

  const collections = await prisma.collection.findMany({
    where: { workspaceId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      collectionQuotes: {
        include: {
          quote: {
            select: { imageUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { collectionQuotes: true },
      },
    },
  });

  const result = collections.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    sortOrder: c.sortOrder,
    coverImage: c.collectionQuotes[0]?.quote.imageUrl || null,
    quoteCount: c._count.collectionQuotes,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

// POST: create a new collection (paid tiers only)
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

  // Check tier — only paid plans can create collections
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  const tier = subscription?.tier || "FREE";
  if (tier === "FREE") {
    return NextResponse.json(
      { error: "Collections require a paid plan. Upgrade to get started." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const result = CreateCollectionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, emoji } = result.data;

  // Increment sortOrder of existing collections to place new one at top
  await prisma.collection.updateMany({
    where: { workspaceId },
    data: { sortOrder: { increment: 1 } },
  });

  const collection = await prisma.collection.create({
    data: {
      workspaceId,
      name,
      emoji: emoji || null,
      sortOrder: 0,
    },
  });

  return NextResponse.json(collection, { status: 201 });
}
