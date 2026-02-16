import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";
import { getWorkspaceFromRequest } from "@/lib/workspace";

const UpdateQuoteCollectionsSchema = z.object({
  collectionIds: z.array(z.string().min(1)),
});

// GET: list all collections with isInCollection flag for this quote
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id: quoteId } = await params;

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
      _count: {
        select: { collectionQuotes: true },
      },
      collectionQuotes: {
        where: { quoteId },
        select: { id: true },
      },
    },
  });

  const result = collections.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    quoteCount: c._count.collectionQuotes,
    isInCollection: c.collectionQuotes.length > 0,
  }));

  return NextResponse.json(result);
}

// PUT: update which collections a quote belongs to
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id: quoteId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    workspaceId = await getWorkspaceFromRequest(session.user.id);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Verify quote belongs to workspace
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, workspaceId },
    select: { id: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = UpdateQuoteCollectionsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { collectionIds } = result.data;

  // Delete all existing and create new ones in a transaction
  await prisma.$transaction([
    prisma.collectionQuote.deleteMany({ where: { quoteId } }),
    ...(collectionIds.length > 0
      ? [
          prisma.collectionQuote.createMany({
            data: collectionIds.map((collectionId) => ({
              quoteId,
              collectionId,
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
