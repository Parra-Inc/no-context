import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceFromRequest } from "@/lib/workspace";

export async function PATCH() {
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

  // No workspace-level settings to update currently.
  // Style management is now per-channel via /api/settings/channels and /api/settings/channel-styles.
  return NextResponse.json({ ok: true });
}
