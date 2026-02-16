import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSlackClient } from "@/lib/slack";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function GET() {
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

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { slackBotToken: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const slackClient = getSlackClient(workspace.slackBotToken);

  const result = await slackClient.conversations.list({
    types: "public_channel",
    exclude_archived: true,
    limit: 200,
  });

  const channels = (result.channels || [])
    .filter((ch) => ch.is_member)
    .map((ch) => ({
      id: ch.id!,
      name: ch.name!,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(channels);
}
