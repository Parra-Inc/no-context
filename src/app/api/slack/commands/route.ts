import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySlackSignature } from "@/lib/slack";
import { TIER_QUOTAS } from "@/lib/stripe";
import { ART_STYLES, getStyleById } from "@/lib/styles";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify signature
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  if (
    !verifySlackSignature(
      process.env.SLACK_SIGNING_SECRET!,
      body,
      timestamp,
      signature,
    )
  ) {
    log.warn("Slack commands: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const teamId = params.get("team_id");
  const command = params.get("text")?.trim().toLowerCase() || "status";
  const channelId = params.get("channel_id");
  const slackUserId = params.get("user_id");

  log.info(
    `Slack commands: received command=${command} team=${teamId} user=${slackUserId} channel=${channelId}`,
  );
  log.debug("Slack commands: raw body", body);

  // Persist the raw event
  await prisma.slackEvent
    .create({
      data: {
        eventType: `command:${command}`,
        teamId,
        channel: channelId,
        userId: slackUserId,
        rawBody: body,
        endpoint: "/api/slack/commands",
      },
    })
    .catch((err) => log.error("Failed to persist slack command event", err));

  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: teamId! },
    include: { subscription: true, channels: true },
  });

  if (!workspace) {
    log.warn(`Slack commands: workspace not found team=${teamId}`);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "No Context is not set up for this workspace. Visit our website to install.",
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  switch (command) {
    case "status": {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const usage = await prisma.usageRecord.findUnique({
        where: {
          workspaceId_periodStart: {
            workspaceId: workspace.id,
            periodStart,
          },
        },
      });

      const tier = workspace.subscription?.tier || "FREE";
      const quota = workspace.subscription?.monthlyQuota || TIER_QUOTAS.FREE;
      const used = usage?.quotesUsed || 0;

      log.info(
        `Slack commands: status response team=${teamId} tier=${tier} used=${used}/${quota}`,
      );

      return NextResponse.json({
        response_type: "ephemeral",
        text: [
          `*No Context Status*`,
          `Plan: ${tier} · ${used}/${quota} images used this month`,
          `Connected channels: ${workspace.channels.filter((c) => c.isActive).length}`,
          `<${appUrl}/dashboard|Open Dashboard>`,
        ].join("\n"),
      });
    }

    case "style": {
      const currentStyle = getStyleById(workspace.defaultStyleId);
      const styleList = ART_STYLES.map(
        (s) =>
          `${s.id === workspace.defaultStyleId ? "→ " : "  "}${s.displayName}`,
      ).join("\n");

      log.info(
        `Slack commands: style response team=${teamId} currentStyle=${workspace.defaultStyleId}`,
      );

      return NextResponse.json({
        response_type: "ephemeral",
        text: `*Current Style:* ${currentStyle?.displayName || workspace.defaultStyleId}\n\n*Available Styles:*\n${styleList}\n\nChange styles in the <${appUrl}/dashboard/settings|dashboard>.`,
      });
    }

    case "pause": {
      const channel = workspace.channels.find(
        (c) => c.slackChannelId === channelId,
      );

      if (!channel) {
        log.info(
          `Slack commands: pause failed - channel not connected channel=${channelId} team=${teamId}`,
        );
        return NextResponse.json({
          response_type: "ephemeral",
          text: "This channel is not connected to No Context.",
        });
      }

      await prisma.channel.update({
        where: { id: channel.id },
        data: { isPaused: true },
      });

      log.info(
        `Slack commands: channel paused channel=${channelId} team=${teamId}`,
      );

      return NextResponse.json({
        response_type: "ephemeral",
        text: "No Context is now paused in this channel. Use `/nocontext resume` to start again.",
      });
    }

    case "resume": {
      const channel = workspace.channels.find(
        (c) => c.slackChannelId === channelId,
      );

      if (!channel) {
        log.info(
          `Slack commands: resume failed - channel not connected channel=${channelId} team=${teamId}`,
        );
        return NextResponse.json({
          response_type: "ephemeral",
          text: "This channel is not connected to No Context.",
        });
      }

      await prisma.channel.update({
        where: { id: channel.id },
        data: { isPaused: false },
      });

      log.info(
        `Slack commands: channel resumed channel=${channelId} team=${teamId}`,
      );

      return NextResponse.json({
        response_type: "ephemeral",
        text: "No Context is back! Quotes in this channel will be illustrated again.",
      });
    }

    default:
      log.info(`Slack commands: unknown command=${command} team=${teamId}`);
      return NextResponse.json({
        response_type: "ephemeral",
        text: "Usage: `/nocontext [status | style | pause | resume]`",
      });
  }
}
