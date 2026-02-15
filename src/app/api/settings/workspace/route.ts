import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ART_STYLES } from "@/lib/styles";
import { z } from "zod/v4";

const UpdateWorkspaceSchema = z.object({
  defaultStyleId: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const result = UpdateWorkspaceSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { defaultStyleId } = result.data;

  // Validate style exists (built-in or custom)
  const isBuiltIn = ART_STYLES.some((s) => s.id === defaultStyleId);
  if (!isBuiltIn) {
    const customStyle = await prisma.customStyle.findFirst({
      where: {
        workspaceId: session.user.workspaceId,
        name: defaultStyleId,
        isActive: true,
      },
    });
    if (!customStyle) {
      return NextResponse.json({ error: "Invalid style ID" }, { status: 400 });
    }
  }

  const workspace = await prisma.workspace.update({
    where: { id: session.user.workspaceId },
    data: { defaultStyleId },
  });

  return NextResponse.json({ defaultStyleId: workspace.defaultStyleId });
}
