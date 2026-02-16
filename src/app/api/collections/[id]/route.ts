import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";
import { getWorkspaceFromRequest } from "@/lib/workspace";

const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().max(10).nullable().optional(),
});

// GET: get collection detail with paginated quotes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    workspaceId = await getWorkspaceFromRequest(session.user.id);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const search = searchParams.get("search") || "";

  const collection = await prisma.collection.findFirst({
    where: { id, workspaceId },
    select: { id: true, name: true, emoji: true },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  const where = {
    collectionQuotes: { some: { collectionId: id } },
    workspaceId,
    status: "COMPLETED" as const,
    ...(search
      ? {
          OR: [
            { quoteText: { contains: search, mode: "insensitive" as const } },
            {
              attributedTo: { contains: search, mode: "insensitive" as const },
            },
          ],
        }
      : {}),
  };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        quoteText: true,
        attributedTo: true,
        slackUserAvatarUrl: true,
        styleId: true,
        imageUrl: true,
        isFavorited: true,
        createdAt: true,
        channel: { select: { channelName: true } },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({
    collection,
    quotes: quotes.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// PATCH: update collection name/emoji
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

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

  const body = await request.json();
  const result = UpdateCollectionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const collection = await prisma.collection.updateMany({
    where: { id, workspaceId },
    data: result.data,
  });

  if (collection.count === 0) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE: delete collection (keeps quotes)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

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

  const deleted = await prisma.collection.deleteMany({
    where: { id, workspaceId },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
