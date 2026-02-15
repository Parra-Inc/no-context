import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: returns disabled style IDs for a channel
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId is required" },
      { status: 400 },
    );
  }

  // Verify the channel belongs to the workspace
  const channel = await prisma.channel.findUnique({
    where: { id: channelId, workspaceId: session.user.workspaceId },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const disabledStyles = await prisma.channelStyle.findMany({
    where: { channelId },
    select: { styleId: true },
  });

  return NextResponse.json(disabledStyles.map((cs) => cs.styleId));
}

// POST: disable a style for a channel (creates ChannelStyle record)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channelId, styleId } = body;

  if (!channelId || !styleId) {
    return NextResponse.json(
      { error: "channelId and styleId are required" },
      { status: 400 },
    );
  }

  // Verify the channel belongs to the workspace
  const channel = await prisma.channel.findUnique({
    where: { id: channelId, workspaceId: session.user.workspaceId },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const channelStyle = await prisma.channelStyle.create({
    data: { channelId, styleId },
  });

  return NextResponse.json(channelStyle, { status: 201 });
}

// DELETE: re-enable a style for a channel (removes ChannelStyle record)
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const styleId = searchParams.get("styleId");

  if (!channelId || !styleId) {
    return NextResponse.json(
      { error: "channelId and styleId are required" },
      { status: 400 },
    );
  }

  // Verify the channel belongs to the workspace
  const channel = await prisma.channel.findUnique({
    where: { id: channelId, workspaceId: session.user.workspaceId },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  await prisma.channelStyle.deleteMany({
    where: { channelId, styleId },
  });

  return NextResponse.json({ ok: true });
}
