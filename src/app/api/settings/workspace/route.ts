import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PATCH() {
  const session = await auth();

  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No workspace-level settings to update currently.
  // Style management is now per-channel via /api/settings/channels and /api/settings/channel-styles.
  return NextResponse.json({ ok: true });
}
