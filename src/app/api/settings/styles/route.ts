import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const CreateStyleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(200),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customStyles = await prisma.customStyle.findMany({
    where: { workspaceId: session.user.workspaceId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(customStyles);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId || !session?.user?.slackUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check tier — only Team+ can create custom styles
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });

  if (!subscription || !["TEAM", "BUSINESS"].includes(subscription.tier)) {
    return NextResponse.json(
      { error: "Custom styles require a Team or Business plan" },
      { status: 403 },
    );
  }

  const body = await request.json();

  const result = CreateStyleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, description } = result.data;

  const style = await prisma.customStyle.create({
    data: {
      workspaceId: session.user.workspaceId,
      name,
      description,
      createdBy: session.user.slackUserId,
    },
  });

  return NextResponse.json(style, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const styleId = searchParams.get("id");

  if (!styleId) {
    return NextResponse.json({ error: "Style ID required" }, { status: 400 });
  }

  await prisma.customStyle.update({
    where: { id: styleId, workspaceId: session.user.workspaceId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
