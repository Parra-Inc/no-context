import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TIER_MAX_CHANNELS } from "@/lib/stripe";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const { tab } = await searchParams;

  const [workspace, channels, subscription, styles, usage] = await Promise.all([
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
    prisma.usageRecord.findFirst({
      where: {
        workspaceId,
        periodStart: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
    }),
  ]);

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;
  const remaining = Math.max(quota - used, 0);
  const usagePercent = quota > 0 ? (used / quota) * 100 : 0;

  const allStyles = styles.map((s) => ({
    id: s.id,
    name: s.name,
    displayName: s.displayName,
    description: s.description,
    isBuiltIn: s.workspaceId === null,
  }));

  return (
    <SettingsTabs
      initialTab={tab}
      general={{
        workspaceName: workspace?.slackTeamName || "",
        needsReconnection: workspace?.needsReconnection || false,
        channels: channels.map((ch) => ({
          id: ch.id,
          slackChannelId: ch.slackChannelId,
          channelName: ch.channelName,
          isActive: ch.isActive,
          isPaused: ch.isPaused,
          styleMode: ch.styleMode,
          postToChannelId: ch.postToChannelId,
          postToChannelName: ch.postToChannelName,
          disabledStyleIds: ch.channelStyles.map((cs) => cs.styleId),
        })),
        styles: allStyles,
        subscriptionTier: tier,
        maxChannels: TIER_MAX_CHANNELS[tier] || 1,
      }}
      billing={{
        tier,
        quota,
        used,
        remaining,
        usagePercent,
        bonusCredits: subscription?.bonusCredits || 0,
        hasStripeCustomer: !!subscription?.stripeCustomerId,
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
      }}
      styles={{
        subscriptionTier: tier,
        builtInStyles: allStyles
          .filter((s) => s.isBuiltIn)
          .map(({ id, name, displayName, description }) => ({
            id,
            name,
            displayName,
            description,
          })),
        customStyles: allStyles
          .filter((s) => !s.isBuiltIn)
          .map(({ id, name, displayName, description }) => ({
            id,
            name,
            displayName,
            description,
          })),
        canCreateCustom: ["TEAM", "BUSINESS"].includes(tier),
      }}
    />
  );
}
