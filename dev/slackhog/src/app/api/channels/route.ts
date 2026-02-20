import { NextResponse } from "next/server";
import { queries } from "@/lib/db";
import type { Channel } from "@/lib/types";

export async function GET() {
  try {
    const channels = queries.getChannels.all() as Channel[];

    return NextResponse.json({
      ok: true,
      channels,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
