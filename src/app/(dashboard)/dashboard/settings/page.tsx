import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import SettingsGeneral from "@/components/dashboard/settings-general";

export default async function SettingsPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

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
        disabledStyleIds: ch.channelStyles.map((cs) => cs.styleId),
      }))}
      styles={styles.map((s) => ({
        id: s.id,
        name: s.name,
        displayName: s.displayName,
        description: s.description,
        isBuiltIn: s.workspaceId === null,
      }))}
      subscriptionTier={subscription?.tier || "FREE"}
      subscriptionStatus={subscription?.status || "ACTIVE"}
    />
  );
}
