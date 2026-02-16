import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      workspaceId,
    },
    include: {
      channel: { select: { channelName: true } },
      imageGenerations: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          styleId: true,
          imageUrl: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}
