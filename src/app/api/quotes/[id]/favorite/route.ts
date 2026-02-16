import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function POST(
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
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: { isFavorited: !quote.isFavorited },
  });

  return NextResponse.json({ isFavorited: updated.isFavorited });
}
