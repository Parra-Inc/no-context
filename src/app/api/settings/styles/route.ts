import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

const CreateStyleSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  prompt: z.string().min(1).max(500),
});

// GET: returns all active styles (built-in + workspace custom)
export async function GET() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const styles = await prisma.style.findMany({
    where: {
      isActive: true,
      OR: [{ workspaceId: null }, { workspaceId: session.user.workspaceId }],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(styles);
}

// POST: create a custom style (Team+ only)
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

  const { name, displayName, prompt } = result.data;

  const style = await prisma.style.create({
    data: {
      workspaceId: session.user.workspaceId,
      name,
      displayName,
      description: displayName,
      prompt,
      createdBy: session.user.slackUserId,
    },
  });

  return NextResponse.json(style, { status: 201 });
}

// DELETE: soft-delete a custom style
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

  // Only allow deleting custom styles (those with a workspaceId)
  await prisma.style.update({
    where: {
      id: styleId,
      workspaceId: session.user.workspaceId,
    },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
