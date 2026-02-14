import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  const workspaceQuery = prisma.workspace.findUnique({
    where: { id: workspaceId },
  });
  const subscriptionQuery = prisma.subscription.findUnique({
    where: { workspaceId },
  });
  const channelsQuery = prisma.channel.findMany({
    where: { workspaceId, isActive: true },
  });
  const totalQuotesQuery = prisma.quote.count({
    where: { workspaceId, status: "COMPLETED" },
  });
  const recentQuotesQuery = prisma.quote.findMany({
    where: { workspaceId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { channel: { select: { channelName: true } } },
  });
  const usageQuery = prisma.usageRecord.findFirst({
    where: {
      workspaceId,
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  const [workspace, subscription, channels, totalQuotes, recentQuotes, usage] =
    await Promise.all([
      workspaceQuery,
      subscriptionQuery,
      channelsQuery,
      totalQuotesQuery,
      recentQuotesQuery,
      usageQuery,
    ]);

  const tier = subscription?.tier || "FREE";
  const quota = subscription?.monthlyQuota || 5;
  const used = usage?.quotesUsed || 0;

  return (
    <div className="space-y-8">
      {workspace?.needsReconnection && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Your Slack connection has been lost. Please{" "}
            <Link
              href="/dashboard/settings"
              className="underline hover:text-red-900"
            >
              reconnect in Settings
            </Link>{" "}
            to continue generating art.
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          {workspace?.slackTeamIcon && (
            <img
              src={workspace.slackTeamIcon}
              alt={workspace.slackTeamName}
              className="h-10 w-10 rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              {workspace?.slackTeamName}
            </h1>
            <p className="text-sm text-[#4A4A4A]">
              Plan: {tier} · {used} / {quota} images used this month
            </p>
          </div>
        </div>
        <Progress value={used} max={quota} className="mt-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-[#1A1A1A]">{used}</p>
            <p className="text-sm text-[#4A4A4A]">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-[#1A1A1A]">
              {channels.length}
            </p>
            <p className="text-sm text-[#4A4A4A]">Channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-[#1A1A1A]">{totalQuotes}</p>
            <p className="text-sm text-[#4A4A4A]">All time</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Recent Quotes
          </h2>
          <Link
            href="/dashboard/gallery"
            className="text-sm text-[#7C3AED] hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentQuotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/dashboard/gallery/${quote.id}`}
              className="group overflow-hidden rounded-xl border border-[#E5E5E5] bg-white transition-shadow hover:shadow-md"
            >
              {quote.imageUrl ? (
                <div className="aspect-square bg-gradient-to-br from-violet-100 to-orange-100" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-50 text-4xl">
                  🎨
                </div>
              )}
              <div className="p-3">
                <p className="font-quote truncate text-xs text-[#1A1A1A]">
                  &ldquo;{quote.quoteText}&rdquo;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Connected Channels
        </h2>
        <div className="mt-4 space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  # {channel.channelName}
                </span>
                <Badge variant={channel.isPaused ? "warning" : "success"}>
                  {channel.isPaused ? "Paused" : "Active"}
                </Badge>
              </div>
              <span className="text-xs text-[#4A4A4A]">
                {channel.styleId || "Default"}
              </span>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="text-sm text-[#4A4A4A]">
              No channels connected yet.{" "}
              <Link
                href="/dashboard/settings"
                className="text-[#7C3AED] hover:underline"
              >
                Add a channel
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
