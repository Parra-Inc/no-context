import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ART_STYLES } from "@/lib/styles";
import SettingsGeneral from "@/components/dashboard/settings-general";

export default async function SettingsPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const [workspace, channels, subscription, customStyles] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.channel.findMany({ where: { workspaceId, isActive: true } }),
    prisma.subscription.findUnique({ where: { workspaceId } }),
    prisma.customStyle.findMany({ where: { workspaceId, isActive: true } }),
  ]);

  return (
    <SettingsGeneral
      workspaceName={workspace?.slackTeamName || ""}
      defaultStyleId={workspace?.defaultStyleId || "watercolor"}
      needsReconnection={workspace?.needsReconnection || false}
      channels={channels.map((ch) => ({
        id: ch.id,
        slackChannelId: ch.slackChannelId,
        channelName: ch.channelName,
        isActive: ch.isActive,
        isPaused: ch.isPaused,
        styleId: ch.styleId,
        postToChannelId: ch.postToChannelId,
        postToChannelName: ch.postToChannelName,
      }))}
      artStyles={ART_STYLES}
      customStyles={customStyles.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      }))}
      subscriptionTier={subscription?.tier || "FREE"}
      subscriptionStatus={subscription?.status || "ACTIVE"}
    />
  );
}
