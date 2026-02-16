import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TIER_MAX_CHANNELS } from "@/lib/stripe";
import SettingsGeneral from "@/components/dashboard/settings-general";

export default async function SettingsGeneralPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const [workspace, channels, subscription, styles] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.channel.findMany({
      where: { workspaceId, isActive: true },
      include: { channelStyles: true },
    }),
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.style.findMany({
      where: {
        isActive: true,
        OR: [{ workspaceId: null }, { workspaceId }],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tier = subscription?.tier || "FREE";

  const allStyles = styles.map((s) => ({
    id: s.id,
    name: s.name,
    displayName: s.displayName,
    description: s.description,
    isBuiltIn: s.workspaceId === null,
    isFree: s.isFree,
  }));

  return (
    <SettingsGeneral
      workspaceName={workspace?.slackTeamName || ""}
      needsReconnection={workspace?.needsReconnection || false}
      channels={channels.map((ch) => ({
        id: ch.id,
        slackChannelId: ch.slackChannelId,
        channelName: ch.channelName,
        isActive: ch.isActive,
        isPaused: ch.isPaused,
        styleMode: ch.styleMode,
        postToChannelId: ch.postToChannelId,
        postToChannelName: ch.postToChannelName,
        quoteOriginal: ch.quoteOriginal,
        disabledStyleIds: ch.channelStyles.map((cs) => cs.styleId),
      }))}
      styles={allStyles}
      subscriptionTier={tier}
      maxChannels={TIER_MAX_CHANNELS[tier] || 1}
    />
  );
}
