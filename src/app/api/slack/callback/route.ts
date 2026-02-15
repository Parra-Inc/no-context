import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { stripe, TIER_QUOTAS } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      }
    } catch {
      // Malformed state — fall back to defaults
    }
  }

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=slack_oauth_denied`);
  }

  if (!code) {
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
      console.error("Slack OAuth error:", tokenData.error);
      return NextResponse.redirect(`${appUrl}/?error=slack_oauth_failed`);
    }

    const {
      access_token: botToken,
      team: { id: slackTeamId, name: slackTeamName },
      bot_user_id: slackBotUserId,
      authed_user: { id: slackInstallerUserId },
    } = tokenData;

    // Resolve or create a database User for the installer
    let userId = linkUserId;

    if (!userId) {
      // Try to find existing user by Slack ID
      const existingUser = await prisma.user.findUnique({
        where: { slackUserId: slackInstallerUserId },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Fetch installer's profile from Slack to get their email
        try {
          const userInfoResponse = await fetch(
            `https://slack.com/api/users.info?${new URLSearchParams({ user: slackInstallerUserId })}`,
            { headers: { Authorization: `Bearer ${botToken}` } },
          );
          const userInfo = await userInfoResponse.json();

          if (userInfo.ok && userInfo.user?.profile?.email) {
            const installerEmail = userInfo.user.profile.email.toLowerCase();

            // Check if a user with this email already exists
            const emailUser = await prisma.user.findUnique({
              where: { email: installerEmail },
            });

            if (emailUser) {
              // Link Slack identity to existing email user
              await prisma.user.update({
                where: { id: emailUser.id },
                data: { slackUserId: slackInstallerUserId },
              });
              userId = emailUser.id;
            } else {
              // Create a new user
              const newUser = await prisma.user.create({
                data: {
                  email: installerEmail,
                  slackUserId: slackInstallerUserId,
                  name: userInfo.user.real_name || userInfo.user.name || null,
                },
              });
              userId = newUser.id;
            }
          }
        } catch {
          // Failed to fetch user info — userId remains null
        }
      }
    }

    if (!userId) {
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
      // Non-critical — skip
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
        },
      });
    }

    // Link the user to the workspace
    await prisma.user.update({
      where: { id: userId },
      data: { workspaceId: workspace.id },
    });

    return NextResponse.redirect(`${appUrl}${returnTo}`);
  } catch (error) {
    console.error("Slack OAuth callback error:", error);
    return NextResponse.redirect(`${appUrl}/?error=install_failed`);
  }
}
