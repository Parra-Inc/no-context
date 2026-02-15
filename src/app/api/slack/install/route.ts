import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/signin";
  const userId = searchParams.get("userId");

  log.info(
    `Slack install: initiating OAuth flow returnTo=${returnTo} userId=${userId || "none"}`,
  );

  const clientId = process.env.SLACK_CLIENT_ID;
  const scopes = [
    "channels:history",
    "channels:read",
    "chat:write",
    "files:write",
    "reactions:write",
    "team:read",
    "users:read",
    "users:read.email",
  ].join(",");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/slack/callback`;

  // Create state with CSRF token and context for the callback
  const csrfToken = crypto.randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ returnTo, userId, token: csrfToken });
  const encodedState = Buffer.from(statePayload).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("slack_oauth_state", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodedState}`;

  log.info("Slack install: redirecting to Slack OAuth");

  return NextResponse.redirect(slackUrl);
}
