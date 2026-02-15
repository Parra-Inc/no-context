import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Hash,
  ImageIcon,
  Heart,
  Settings,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session!.user.workspaceId;

  if (!workspaceId) {
    redirect("/onboarding");
  }

  const [
    workspace,
    subscription,
    channels,
    totalQuotes,
    totalFavorites,
    recentQuotes,
    usage,
  ] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
    }),
    prisma.subscription.findUnique({
      where: { workspaceId },
    }),
    prisma.channel.findMany({
      where: { workspaceId, isActive: true },
      include: {
        _count: { select: { quotes: { where: { status: "COMPLETED" } } } },
      },
    }),
    prisma.quote.count({
      where: { workspaceId, status: "COMPLETED" },
    }),
    prisma.quote.count({
      where: { workspaceId, status: "COMPLETED", isFavorited: true },
    }),
    prisma.quote.findMany({
      where: { workspaceId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { channel: { select: { channelName: true } } },
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

  const stats = [
    {
      label: "This month",
      value: used,
      detail: "images generated",
      icon: Zap,
      color: "text-violet-600 bg-violet-100",
    },
    {
      label: "Active channels",
      value: channels.filter((c) => !c.isPaused).length,
      detail: `of ${channels.length} total`,
      icon: Hash,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "All time",
      value: totalQuotes,
      detail: "quotes captured",
      icon: ImageIcon,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Favorites",
      value: totalFavorites,
      detail: "saved quotes",
      icon: Heart,
      color: "text-rose-600 bg-rose-100",
    },
  ];

  return (
    <div className="space-y-8">
      {workspace?.needsReconnection && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Your Slack connection has been lost.
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              Reconnect to continue generating art from your channels.
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm" variant="destructive">
              Reconnect
            </Button>
          </Link>
        </div>
      )}

      {/* Header with usage */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workspace?.slackTeamIcon && (
              <img
                src={workspace.slackTeamIcon}
                alt={workspace.slackTeamName ?? ""}
                className="h-10 w-10 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                {workspace?.slackTeamName}
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge variant="outline">{tier}</Badge>
                <span className="text-sm text-[#4A4A4A]">
                  {remaining} images remaining this month
                </span>
              </div>
            </div>
          </div>
          {usagePercent >= 80 && tier === "FREE" && (
            <Link href="/dashboard/settings/billing">
              <Button size="sm">
                Upgrade
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-[#4A4A4A]">Monthly usage</span>
            <span className="font-medium text-[#1A1A1A]">
              {used} / {quota}
            </span>
          </div>
          <Progress
            value={used}
            max={quota}
            className={
              usagePercent >= 90
                ? "[&>div]:bg-red-500"
                : usagePercent >= 70
                  ? "[&>div]:bg-yellow-500"
                  : ""
            }
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#1A1A1A]">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-[#4A4A4A]">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9A9A9A]">{stat.detail}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Quotes */}
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
        {recentQuotes.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/dashboard/gallery/${quote.id}`}
                className="group overflow-hidden rounded-xl border border-[#E5E5E5] bg-white transition-all hover:shadow-md"
              >
                {quote.imageUrl ? (
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={quote.imageUrl}
                      alt={quote.quoteText}
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50">
                    <ImageIcon className="h-8 w-8 text-[#9A9A9A]" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-quote line-clamp-2 text-xs text-[#1A1A1A]">
                    &ldquo;{quote.quoteText}&rdquo;
                  </p>
                  {quote.attributedTo && (
                    <p className="mt-1 text-[10px] text-[#9A9A9A]">
                      — {quote.attributedTo}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-[#9A9A9A]">
                    #{quote.channel.channelName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E5] py-12">
            <ImageIcon className="h-10 w-10 text-[#D4D4D4]" />
            <p className="mt-3 text-sm font-medium text-[#4A4A4A]">
              No quotes yet
            </p>
            <p className="mt-1 text-xs text-[#9A9A9A]">
              Post something in your connected Slack channel to get started.
            </p>
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Connected Channels
          </h2>
          <Link
            href="/dashboard/settings"
            className="text-sm text-[#7C3AED] hover:underline"
          >
            Manage
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {channel.channelName}
                  </span>
                  <p className="text-xs text-[#9A9A9A]">
                    {channel._count.quotes}{" "}
                    {channel._count.quotes === 1 ? "quote" : "quotes"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={channel.isPaused ? "warning" : "success"}>
                  {channel.isPaused ? "Paused" : "Active"}
                </Badge>
                <span className="text-xs text-[#4A4A4A]">
                  {channel.styleMode === "AI" ? "AI Selection" : "Random"}
                </span>
                <Link
                  href="/dashboard/settings"
                  className="text-[#9A9A9A] hover:text-[#4A4A4A]"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E5] py-8">
              <Hash className="h-8 w-8 text-[#D4D4D4]" />
              <p className="mt-2 text-sm text-[#4A4A4A]">
                No channels connected yet.
              </p>
              <Link href="/dashboard/settings" className="mt-2">
                <Button size="sm" variant="secondary">
                  Add a channel
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
