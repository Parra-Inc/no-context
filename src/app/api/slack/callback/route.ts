import { after, NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import {
  stripe,
  TIER_QUOTAS,
  TIER_MAX_CHANNELS,
  TIER_HAS_WATERMARK,
  TIER_IMAGE_SIZE,
} from "@/lib/stripe";
import { findOrCreateUserBySlack } from "@/lib/user";
import { notifyNewWorkspace } from "@/lib/slack-notifications";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  log.info(
    `Slack callback: received code=${code ? "present" : "missing"} error=${error || "none"}`,
  );

  // Persist the raw event
  await prisma.slackEvent
    .create({
      data: {
        eventType: error ? `oauth:error:${error}` : "oauth:callback",
        rawBody: JSON.stringify({
          code: code ? "[REDACTED]" : null,
          error,
          state: stateParam ? "[REDACTED]" : null,
        }),
        endpoint: "/api/slack/callback",
      },
    })
    .catch((err) => log.error("Failed to persist slack callback event", err));

  // Parse state to extract returnTo and userId
  let returnTo = "/signin";
  let linkUserId: string | null = null;

  if (stateParam) {
    try {
      const statePayload = JSON.parse(
        Buffer.from(stateParam, "base64url").toString(),
      );
      const cookieStore = await cookies();
      const storedToken = cookieStore.get("slack_oauth_state")?.value;
      cookieStore.delete("slack_oauth_state");

      if (storedToken && storedToken === statePayload.token) {
        returnTo = statePayload.returnTo || "/signin";
        linkUserId = statePayload.userId || null;
      } else {
        log.warn("Slack callback: CSRF token mismatch");
      }
    } catch {
      log.warn("Slack callback: malformed state parameter");
    }
  }

  if (error) {
    log.warn(`Slack callback: OAuth denied error=${error}`);
    return NextResponse.redirect(`${appUrl}/?error=slack_oauth_denied`);
  }

  if (!code) {
    log.warn("Slack callback: no code provided");
    return NextResponse.redirect(`${appUrl}/?error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${appUrl}/api/slack/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      log.error(
        "Slack callback: OAuth token exchange failed",
        undefined,
        tokenData.error,
      );
      return NextResponse.redirect(`${appUrl}/?error=slack_oauth_failed`);
    }

    const {
      access_token: botToken,
      team: { id: slackTeamId, name: slackTeamName },
      bot_user_id: slackBotUserId,
      authed_user: { id: slackInstallerUserId },
    } = tokenData;

    log.info(
      `Slack callback: OAuth success team=${slackTeamId} teamName=${slackTeamName}`,
    );

    // Resolve or create a database User for the installer
    let userId = linkUserId;

    if (!userId) {
      const user = await findOrCreateUserBySlack({
        slackUserId: slackInstallerUserId,
        botToken,
      });
      userId = user?.id ?? null;
    }

    if (!userId) {
      log.warn(`Slack callback: could not resolve user team=${slackTeamId}`);
      return NextResponse.redirect(`${appUrl}/?error=user_required`);
    }

    // Encrypt bot token
    const encryptedToken = encrypt(botToken);

    // Get team icon
    let slackTeamIcon: string | null = null;
    try {
      const teamInfoResponse = await fetch("https://slack.com/api/team.info", {
        headers: { Authorization: `Bearer ${botToken}` },
      });
      const teamInfo = await teamInfoResponse.json();
      if (teamInfo.ok) {
        slackTeamIcon =
          teamInfo.team.icon?.image_132 || teamInfo.team.icon?.image_68 || null;
      }
    } catch {
      log.debug("Slack callback: failed to fetch team icon (non-critical)");
    }

    // Upsert workspace with the database User ID as installer
    const workspace = await prisma.workspace.upsert({
      where: { slackTeamId },
      update: {
        slackTeamName,
        slackTeamIcon,
        slackBotToken: encryptedToken,
        slackBotUserId,
        installedByUserId: userId,
        isActive: true,
        needsReconnection: false,
        updatedAt: new Date(),
      },
      create: {
        slackTeamId,
        slackTeamName,
        slackTeamIcon,
        slackBotToken: encryptedToken,
        slackBotUserId,
        installedByUserId: userId,
      },
    });

    log.info(
      `Slack callback: workspace upserted id=${workspace.id} team=${slackTeamId}`,
    );

    // Create Stripe customer + free subscription if new
    const existingSub = await prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (!existingSub) {
      const customer = await stripe.customers.create({
        metadata: {
          workspaceId: workspace.id,
          slackTeamId,
          slackTeamName,
        },
      });

      await prisma.subscription.create({
        data: {
          workspaceId: workspace.id,
          stripeCustomerId: customer.id,
          tier: "FREE",
          status: "ACTIVE",
          monthlyQuota: TIER_QUOTAS.FREE,
          maxChannels: TIER_MAX_CHANNELS.FREE,
          hasWatermark: TIER_HAS_WATERMARK.FREE,
          imageSize: TIER_IMAGE_SIZE.FREE,
        },
      });

      log.info(
        `Slack callback: created free subscription for workspace=${workspace.id}`,
      );

      const installer = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      after(() =>
        notifyNewWorkspace({
          workspaceId: workspace.id,
          slackTeamName,
          slackTeamIcon,
          installedByEmail: installer?.email || null,
        }),
      );
    }

    // Link the user to the workspace
    await prisma.user.update({
      where: { id: userId },
      data: { workspaceId: workspace.id },
    });

    log.info(`Slack callback: complete, redirecting to ${returnTo}`);

    return NextResponse.redirect(`${appUrl}${returnTo}`);
  } catch (error) {
    log.error("Slack callback: OAuth flow error", error);
    return NextResponse.redirect(`${appUrl}/?error=install_failed`);
  }
}
