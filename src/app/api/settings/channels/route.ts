import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TIER_MAX_CHANNELS } from "@/lib/stripe";
import { z } from "zod/v4";

const CreateChannelSchema = z.object({
  slackChannelId: z.string().min(1),
  channelName: z.string().min(1),
});

const UpdateChannelSchema = z.object({
  channelId: z.string().min(1),
  styleMode: z.enum(["RANDOM", "AI"]).optional(),
  postToChannelId: z.string().nullable().optional(),
  postToChannelName: z.string().nullable().optional(),
});

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

  const result = CreateChannelSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { slackChannelId, channelName } = result.data;

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
    update: { channelName, isActive: true },
    create: {
      workspaceId: session.user.workspaceId,
      slackChannelId,
      channelName,
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

  const result = UpdateChannelSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { channelId, styleMode, postToChannelId, postToChannelName } =
    result.data;

  const data: Record<string, unknown> = {};

  if (styleMode !== undefined) {
    data.styleMode = styleMode;
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
