import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const scopes = [
    "channels:history",
    "channels:read",
    "chat:write",
    "files:write",
    "reactions:write",
    "team:read",
    "users:read",
  ].join(",");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/slack/callback`;

  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(slackUrl);
}
