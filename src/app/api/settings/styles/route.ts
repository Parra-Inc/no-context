import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
  const { name, description } = body;

  if (!name || !description) {
    return NextResponse.json(
      { error: "name and description are required" },
      { status: 400 },
    );
  }

  if (description.length > 200) {
    return NextResponse.json(
      { error: "Style description must be 200 characters or less" },
      { status: 400 },
    );
  }

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
