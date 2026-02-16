import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const ReorderSchema = z.object({
  collectionIds: z.array(z.string().min(1)),
});

// PUT: reorder collections
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = ReorderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { collectionIds } = result.data;

  await prisma.$transaction(
    collectionIds.map((id, index) =>
      prisma.collection.updateMany({
        where: { id, workspaceId: session.user.workspaceId! },
        data: { sortOrder: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
