import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const styleId = searchParams.get("styleId");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = {
    status: "COMPLETED",
    imageUrl: { not: null },
  };

  if (styleId) where.styleId = styleId;
  if (search) {
    where.quoteText = { contains: search, mode: "insensitive" };
  }

  const orderBy: Record<string, string> =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        quoteText: true,
        styleId: true,
        imageUrl: true,
        createdAt: true,
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
