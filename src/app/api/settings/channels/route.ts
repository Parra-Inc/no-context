import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TIER_MAX_CHANNELS } from "@/lib/stripe";

export async function GET() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channels = await prisma.channel.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(channels);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slackChannelId, channelName, styleId } = body;

  if (!slackChannelId || !channelName) {
    return NextResponse.json(
      { error: "slackChannelId and channelName are required" },
      { status: 400 },
    );
  }

  // Check channel limit
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: session.user.workspaceId },
  });

  const tier = subscription?.tier || "FREE";
  const maxChannels = TIER_MAX_CHANNELS[tier] || 1;

  const currentCount = await prisma.channel.count({
    where: { workspaceId: session.user.workspaceId, isActive: true },
  });

  if (currentCount >= maxChannels) {
    return NextResponse.json(
      {
        error: `Your ${tier} plan allows up to ${maxChannels} channel(s). Upgrade to add more.`,
      },
      { status: 403 },
    );
  }

  const channel = await prisma.channel.upsert({
    where: {
      workspaceId_slackChannelId: {
        workspaceId: session.user.workspaceId,
        slackChannelId,
      },
    },
    update: { channelName, isActive: true, styleId: styleId || null },
    create: {
      workspaceId: session.user.workspaceId,
      slackChannelId,
      channelName,
      styleId: styleId || null,
    },
  });

  return NextResponse.json(channel, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channelId, styleId, postToChannelId, postToChannelName } = body;

  if (!channelId) {
    return NextResponse.json(
      { error: "channelId is required" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};

  if (styleId !== undefined) {
    data.styleId = styleId || null;
  }

  if (postToChannelId !== undefined) {
    data.postToChannelId = postToChannelId || null;
    data.postToChannelName = postToChannelName || null;
  }

  const channel = await prisma.channel.update({
    where: { id: channelId, workspaceId: session.user.workspaceId },
    data,
  });

  return NextResponse.json(channel);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("id");

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
  }

  await prisma.channel.update({
    where: { id: channelId, workspaceId: session.user.workspaceId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
