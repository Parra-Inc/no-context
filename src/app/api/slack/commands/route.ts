import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySlackSignature } from "@/lib/slack";
import { TIER_QUOTAS } from "@/lib/stripe";
import { ART_STYLES } from "@/lib/styles";
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
          `<${appUrl}/${workspace.slug}|Open Dashboard>`,
        ].join("\n"),
      });
    }

    case "style": {
      const channel = workspace.channels.find(
        (c) => c.slackChannelId === channelId,
      );
      const modeLabel = channel?.styleMode === "AI" ? "AI Selection" : "Random";
      const styleList = ART_STYLES.map((s) => `  ${s.displayName}`).join("\n");

      log.info(
        `Slack commands: style response team=${teamId} mode=${channel?.styleMode || "RANDOM"}`,
      );

      return NextResponse.json({
        response_type: "ephemeral",
        text: `*Style Mode:* ${modeLabel}\n\n*Available Styles:*\n${styleList}\n\nManage styles in the <${appUrl}/${workspace.slug}/settings|dashboard>.`,
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

    case "help": {
      log.info(`Slack commands: help response team=${teamId}`);

      return NextResponse.json({
        response_type: "ephemeral",
        text: [
          `*No Context — Help & Best Practices*`,
          ``,
          `No Context listens for out-of-context quotes in your Slack channels and turns them into AI-generated artwork. Here's how to get the most out of it:`,
          ``,
          `*How it works*`,
          `1. Someone says something funny or absurd in a connected channel`,
          `2. The bot detects it as an out-of-context quote`,
          `3. An AI-generated image inspired by the quote is posted in a thread`,
          ``,
          `*Best practices*`,
          `• *Keep it natural* — No Context works best when people talk normally. It picks up on genuinely funny, absurd, or out-of-context moments.`,
          `• *Don't force it* — Trying to game the bot usually produces worse results. The best quotes happen organically.`,
          `• *Connect the right channels* — Add it to casual or social channels where funny moments happen. It's less useful in focused work channels.`,
          `• *Use pause/resume* — Having a serious discussion? Use \`/nocontext pause\` to temporarily disable the bot and \`/nocontext resume\` when you're ready.`,
          `• *Check your quota* — Use \`/nocontext status\` to see how many images you have left this month. Upgrade your plan if you need more.`,
          `• *Explore styles* — Use \`/nocontext style\` to see the available art styles, or manage them in the dashboard.`,
          ``,
          `*Commands*`,
          `\`/nocontext help\` — Show this help message`,
          `\`/nocontext status\` — View usage, plan info, and connected channels`,
          `\`/nocontext style\` — See current style mode and available art styles`,
          `\`/nocontext pause\` — Pause the bot in this channel`,
          `\`/nocontext resume\` — Resume the bot in this channel`,
          ``,
          `*Need more help?*`,
          `Visit the <${appUrl}/${workspace.slug}|Dashboard> to manage channels, styles, and billing.`,
        ].join("\n"),
      });
    }

    default:
      log.info(`Slack commands: unknown command=${command} team=${teamId}`);
      return NextResponse.json({
        response_type: "ephemeral",
        text: "Unknown command. Try `/nocontext help` for usage and best practices.",
      });
  }
}
