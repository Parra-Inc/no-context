import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const channelId = searchParams.get("channelId");
  const styleId = searchParams.get("styleId");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";
  const favoritesOnly = searchParams.get("favorites") === "true";
  const author = searchParams.get("author");

  const where: Record<string, unknown> = {
    workspaceId,
    status: "COMPLETED",
  };

  if (channelId) where.channelId = channelId;
  if (styleId) where.styleId = styleId;
  if (favoritesOnly) where.isFavorited = true;
  if (search) {
    where.quoteText = { contains: search, mode: "insensitive" };
  }
  if (author) {
    where.attributedTo = { contains: author, mode: "insensitive" };
  }

  const orderBy: Record<string, string> =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "favorites"
        ? { isFavorited: "desc" }
        : { createdAt: "desc" };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        channel: { select: { channelName: true } },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({
    quotes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
