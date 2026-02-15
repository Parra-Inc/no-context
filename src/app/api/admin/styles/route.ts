import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod/v4";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return null;
  }
  return session;
}

const CreateStyleSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with hyphens"),
  displayName: z.string().min(1),
  description: z.string().min(1).max(1000),
  enabledByDefault: z.boolean().default(true),
});

const UpdateStyleSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).optional(),
  description: z.string().min(1).max(1000).optional(),
  enabledByDefault: z.boolean().optional(),
});

// GET: return all global styles (workspaceId: null)
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const styles = await prisma.style.findMany({
    where: { workspaceId: null },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { channelStyles: true } },
    },
  });

  return NextResponse.json(styles);
}

// POST: create a new global style
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = CreateStyleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, displayName, description, enabledByDefault } = result.data;

  const existing = await prisma.style.findFirst({
    where: { workspaceId: null, name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A global style with this name already exists" },
      { status: 409 },
    );
  }

  const style = await prisma.$transaction(async (tx) => {
    const newStyle = await tx.style.create({
      data: {
        workspaceId: null,
        name,
        displayName,
        description,
        enabledByDefault,
        createdBy: session.user.id,
      },
    });

    if (!enabledByDefault) {
      const allChannels = await tx.channel.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      if (allChannels.length > 0) {
        await tx.channelStyle.createMany({
          data: allChannels.map((ch) => ({
            channelId: ch.id,
            styleId: newStyle.id,
          })),
        });
      }
    }

    return newStyle;
  });

  return NextResponse.json(style, { status: 201 });
}

// PUT: update a global style
export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = UpdateStyleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { id, enabledByDefault, ...updateData } = result.data;

  const existingStyle = await prisma.style.findUnique({
    where: { id, workspaceId: null },
  });
  if (!existingStyle) {
    return NextResponse.json({ error: "Style not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedStyle = await tx.style.update({
      where: { id },
      data: {
        ...updateData,
        ...(enabledByDefault !== undefined ? { enabledByDefault } : {}),
      },
    });

    if (
      enabledByDefault !== undefined &&
      enabledByDefault !== existingStyle.enabledByDefault
    ) {
      if (enabledByDefault) {
        // Switching to enabled: remove all ChannelStyle disable records
        await tx.channelStyle.deleteMany({ where: { styleId: id } });
      } else {
        // Switching to disabled: create ChannelStyle records for all active channels
        await tx.channelStyle.deleteMany({ where: { styleId: id } });
        const allChannels = await tx.channel.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        if (allChannels.length > 0) {
          await tx.channelStyle.createMany({
            data: allChannels.map((ch) => ({
              channelId: ch.id,
              styleId: id,
            })),
          });
        }
      }
    }

    return updatedStyle;
  });

  return NextResponse.json(updated);
}

// DELETE: hard-delete a global style (cascade cleans up ChannelStyle records)
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const styleId = searchParams.get("id");

  if (!styleId) {
    return NextResponse.json({ error: "Style ID required" }, { status: 400 });
  }

  const style = await prisma.style.findUnique({
    where: { id: styleId, workspaceId: null },
  });

  if (!style) {
    return NextResponse.json(
      { error: "Global style not found" },
      { status: 404 },
    );
  }

  await prisma.style.delete({ where: { id: styleId } });

  return NextResponse.json({ ok: true });
}
