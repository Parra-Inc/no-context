import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function POST() {
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

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
}
