import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { assertWorkspace } from "@/lib/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Zap,
  Hash,
  ImageIcon,
  Heart,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentQuotes } from "@/components/dashboard/recent-quotes";

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { workspaceSlug } = await params;
  const { workspace } = await assertWorkspace(session.user.id, workspaceSlug);
  const workspaceId = workspace.id;

  const [channels, totalQuotes, totalFavorites, recentQuotes, usage, styles] =
    await Promise.all([
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
      prisma.style.findMany({
        where: {
          OR: [{ workspaceId }, { workspaceId: null }],
          isActive: true,
        },
        select: { name: true, displayName: true },
      }),
    ]);

  const used = usage?.quotesUsed || 0;

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
      {workspace.needsReconnection && (
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
          <Link href={`/${workspaceSlug}/settings`}>
            <Button size="sm" variant="destructive">
              Reconnect
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <h1 className="text-foreground text-2xl font-bold">
        Welcome
        {session.user.name && !session.user.name.includes("@")
          ? `, ${session.user.name}`
          : ""}{" "}
        👋
      </h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-3xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-muted-foreground/60 mt-0.5 text-xs">
                    {stat.detail}
                  </p>
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
          <h2 className="text-foreground text-lg font-semibold">
            Recent Quotes
          </h2>
          <Link
            href={`/${workspaceSlug}/gallery`}
            className="text-primary text-sm hover:underline"
          >
            View All
          </Link>
        </div>
        {recentQuotes.length > 0 ? (
          <RecentQuotes
            initialQuotes={recentQuotes.map((quote) => ({
              id: quote.id,
              quoteText: quote.quoteText,
              attributedTo: quote.attributedTo,
              styleId: quote.styleId,
              imageUrl: quote.imageUrl,
              isFavorited: quote.isFavorited,
              createdAt: quote.createdAt.toISOString(),
              channelName: quote.channel.channelName,
              styleName:
                styles.find((s) => s.name === quote.styleId)?.displayName ||
                null,
              timeAgo: timeAgo(quote.createdAt),
            }))}
          />
        ) : (
          <div className="border-border mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
            <ImageIcon className="text-muted-foreground/30 h-10 w-10" />
            <p className="text-muted-foreground mt-3 text-sm font-medium">
              No quotes yet
            </p>
            <p className="text-muted-foreground/60 mt-1 text-xs">
              Post something in your connected Slack channel to get started.
            </p>
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">
            Connected Channels
          </h2>
          <Link
            href={`/${workspaceSlug}/settings`}
            className="text-primary text-sm hover:underline"
          >
            Manage
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="border-border bg-card flex items-center justify-between rounded-xl border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">
                    {channel.channelName}
                  </span>
                  <p className="text-muted-foreground/60 text-xs">
                    {channel._count.quotes}{" "}
                    {channel._count.quotes === 1 ? "quote" : "quotes"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={channel.isPaused ? "warning" : "success"}>
                  {channel.isPaused ? "Paused" : "Active"}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {channel.styleMode === "AI" ? "AI Selection" : "Random"}
                </span>
                <Link
                  href={`/${workspaceSlug}/settings`}
                  className="text-muted-foreground/60 hover:text-muted-foreground"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
              <Hash className="text-muted-foreground/30 h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                No channels connected yet.
              </p>
              <Link href={`/${workspaceSlug}/settings`} className="mt-3">
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
