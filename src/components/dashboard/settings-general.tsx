"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronDown, Hash, Palette, Crown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { INFINITY } from "@/lib/tier-constants";

interface Channel {
  id: string;
  slackChannelId: string;
  channelName: string;
  isActive: boolean;
  isPaused: boolean;
  styleMode: "RANDOM" | "AI";
  postToChannelId: string | null;
  postToChannelName: string | null;
  disabledStyleIds: string[];
}

interface Style {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isBuiltIn: boolean;
  isFree: boolean;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface SettingsGeneralProps {
  workspaceName: string;
  needsReconnection: boolean;
  channels: Channel[];
  styles: Style[];
  subscriptionTier: string;
  maxChannels: number;
}

export default function SettingsGeneral({
  workspaceName,
  needsReconnection,
  channels: initialChannels,
  styles,
  subscriptionTier,
  maxChannels,
}: SettingsGeneralProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [selectedSlackChannel, setSelectedSlackChannel] = useState("");
  const [addingChannel, setAddingChannel] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);

  useEffect(() => {
    fetch("/api/settings/slack-channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSlackChannels(data);
      })
      .catch(() => {});
  }, []);

  async function addChannel() {
    if (!selectedSlackChannel) return;

    const slackChannel = slackChannels.find(
      (ch) => ch.id === selectedSlackChannel,
    );
    if (!slackChannel) return;

    setAddingChannel(true);
    try {
      const res = await fetch("/api/settings/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackChannelId: slackChannel.id,
          channelName: slackChannel.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add channel");
        return;
      }

      const channel = await res.json();
      setChannels((prev) => [...prev, { ...channel, disabledStyleIds: [] }]);
      setAddChannelOpen(false);
      setSelectedSlackChannel("");
      toast.success(`#${slackChannel.name} connected`);
    } catch {
      toast.error("Failed to add channel");
    } finally {
      setAddingChannel(false);
    }
  }

  async function removeChannel(channel: Channel) {
    setChannels((prev) => prev.filter((ch) => ch.id !== channel.id));
    setDeleteTarget(null);

    try {
      await fetch(`/api/settings/channels?id=${channel.id}`, {
        method: "DELETE",
      });
      toast.success(`#${channel.channelName} removed`);
    } catch {
      setChannels((prev) => [...prev, channel]);
      toast.error("Failed to remove channel");
    }
  }

  async function toggleChannelPause(channelId: string) {
    const channel = channels.find((ch) => ch.id === channelId);
    if (!channel) return;

    const newPaused = !channel.isPaused;
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId ? { ...ch, isPaused: newPaused } : ch,
      ),
    );

    try {
      await fetch("/api/settings/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, isPaused: newPaused }),
      });
      toast.success(
        newPaused
          ? `#${channel.channelName} paused`
          : `#${channel.channelName} resumed`,
      );
    } catch {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, isPaused: !newPaused } : ch,
        ),
      );
      toast.error("Failed to update channel");
    }
  }

  async function updateChannelStyleMode(
    channelId: string,
    styleMode: "RANDOM" | "AI",
  ) {
    setSaving(`mode-${channelId}`);
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, styleMode } : ch)),
    );
    try {
      await fetch("/api/settings/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, styleMode }),
      });
      toast.success("Style mode updated");
    } catch {
      toast.error("Failed to update style mode");
    } finally {
      setSaving(null);
    }
  }

  async function toggleChannelStyle(channelId: string, styleId: string) {
    const channel = channels.find((ch) => ch.id === channelId);
    if (!channel) return;

    const isCurrentlyDisabled = channel.disabledStyleIds.includes(styleId);

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        return {
          ...ch,
          disabledStyleIds: isCurrentlyDisabled
            ? ch.disabledStyleIds.filter((id) => id !== styleId)
            : [...ch.disabledStyleIds, styleId],
        };
      }),
    );

    try {
      if (isCurrentlyDisabled) {
        await fetch(
          `/api/settings/channel-styles?channelId=${channelId}&styleId=${styleId}`,
          { method: "DELETE" },
        );
      } else {
        await fetch("/api/settings/channel-styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, styleId }),
        });
      }
    } catch {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== channelId) return ch;
          return {
            ...ch,
            disabledStyleIds: isCurrentlyDisabled
              ? [...ch.disabledStyleIds, styleId]
              : ch.disabledStyleIds.filter((id) => id !== styleId),
          };
        }),
      );
      toast.error("Failed to update style");
    }
  }

  async function updateChannelRouting(
    channelId: string,
    postToChannelId: string | null,
    overrideName?: string,
  ) {
    const slackChannel = slackChannels.find((ch) => ch.id === postToChannelId);
    const postToChannelName = overrideName || slackChannel?.name || null;

    setSaving(`routing-${channelId}`);
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? { ...ch, postToChannelId, postToChannelName }
          : ch,
      ),
    );
    try {
      await fetch("/api/settings/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, postToChannelId, postToChannelName }),
      });
      toast.success("Routing updated");
    } catch {
      toast.error("Failed to update routing");
    } finally {
      setSaving(null);
    }
  }

  const connectedSlackIds = channels.map((ch) => ch.slackChannelId);
  const availableSlackChannels = slackChannels.filter(
    (ch) => !connectedSlackIds.includes(ch.id),
  );
  const atChannelLimit = channels.length >= maxChannels;

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardTitle>General</CardTitle>
          <CardDescription>Workspace and channel settings</CardDescription>
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Workspace</span>
              <span className="text-foreground text-sm font-medium">
                {workspaceName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Slack Connection
              </span>
              {needsReconnection ? (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Disconnected</Badge>
                  <a href="/api/slack/install">
                    <Button size="xs" variant="default">
                      Reconnect
                    </Button>
                  </a>
                </div>
              ) : (
                <Badge variant="success">Connected</Badge>
              )}
            </div>
          </div>

          <div className="border-border border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-foreground text-sm font-medium">
                  Connected Channels
                </h4>
                <p className="text-muted-foreground/60 mt-0.5 text-xs">
                  {channels.length} of{" "}
                  {maxChannels >= INFINITY ? "unlimited" : maxChannels} channels
                  used
                </p>
              </div>
              <Dialog open={addChannelOpen} onOpenChange={setAddChannelOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={atChannelLimit}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Channel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Channel</DialogTitle>
                    <DialogDescription>
                      Select a Slack channel to monitor for out-of-context
                      quotes.
                    </DialogDescription>
                  </DialogHeader>
                  <Select
                    value={selectedSlackChannel}
                    onValueChange={setSelectedSlackChannel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlackChannels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          # {ch.name}
                        </SelectItem>
                      ))}
                      {availableSlackChannels.length === 0 && (
                        <SelectItem value="none" disabled>
                          No available channels
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <DialogFooter>
                    <Button
                      variant="secondary"
                      onClick={() => setAddChannelOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addChannel}
                      disabled={!selectedSlackChannel || addingChannel}
                    >
                      {addingChannel ? "Adding..." : "Add Channel"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {atChannelLimit && (
              <p className="text-muted-foreground/60 mt-2 text-xs">
                You&apos;ve reached the channel limit for your{" "}
                {subscriptionTier} plan.{" "}
                <Link
                  href="/dashboard/settings/billing"
                  className="text-primary hover:underline"
                >
                  Upgrade
                </Link>{" "}
                to add more.
              </p>
            )}

            <div className="mt-3 space-y-3">
              {channels.map((channel) => {
                const availableStyles =
                  subscriptionTier === "FREE"
                    ? styles.filter((s) => s.isFree)
                    : styles;
                const enabledCount =
                  availableStyles.length -
                  availableStyles.filter((s) =>
                    channel.disabledStyleIds.includes(s.id),
                  ).length;
                const isExpanded = expandedChannel === channel.id;

                return (
                  <div
                    key={channel.id}
                    className={`overflow-hidden rounded-xl border transition-all ${channel.isPaused ? "border-border/50 opacity-60" : "border-border"}`}
                  >
                    <div
                      className={`p-4 ${channel.isPaused ? "bg-muted/30" : "bg-muted/50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="text-muted-foreground/60 h-4 w-4" />
                          <span className="text-foreground text-sm font-medium">
                            {channel.channelName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!channel.isPaused}
                            onCheckedChange={() =>
                              toggleChannelPause(channel.id)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(channel)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-muted-foreground mb-1 block text-xs">
                            Style Mode
                          </label>
                          <Select
                            value={channel.styleMode}
                            onValueChange={(v) =>
                              updateChannelStyleMode(
                                channel.id,
                                v as "RANDOM" | "AI",
                              )
                            }
                            disabled={saving === `mode-${channel.id}`}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RANDOM">Random</SelectItem>
                              <SelectItem value="AI">AI Selection</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-muted-foreground mb-1 block text-xs">
                            Post To
                          </label>
                          <Select
                            value={
                              channel.postToChannelId === null
                                ? "same"
                                : channel.postToChannelId ===
                                    channel.slackChannelId
                                  ? "same-new"
                                  : channel.postToChannelId
                            }
                            onValueChange={(v) => {
                              if (v === "same") {
                                updateChannelRouting(channel.id, null);
                              } else if (v === "same-new") {
                                updateChannelRouting(
                                  channel.id,
                                  channel.slackChannelId,
                                  channel.channelName,
                                );
                              } else {
                                updateChannelRouting(channel.id, v);
                              }
                            }}
                            disabled={saving === `routing-${channel.id}`}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="same">
                                Same channel (thread reply)
                              </SelectItem>
                              <SelectItem value="same-new">
                                Same channel (new message)
                              </SelectItem>
                              {slackChannels.map((ch) => (
                                <SelectItem key={ch.id} value={ch.id}>
                                  # {ch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Styles toggle section */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedChannel(isExpanded ? null : channel.id)
                      }
                      className="border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between border-t px-4 py-2.5 text-xs transition-colors"
                    >
                      <span>
                        {enabledCount} of {availableStyles.length} styles
                        enabled
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                      style={{
                        gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="border-border grid grid-cols-2 gap-2 border-t p-4 sm:grid-cols-3">
                          {styles.map((style) => {
                            const isEnabled =
                              !channel.disabledStyleIds.includes(style.id);
                            const isPremiumLocked =
                              !style.isFree && subscriptionTier === "FREE";
                            return (
                              <div
                                key={style.id}
                                className={`overflow-hidden rounded-lg border transition-all ${
                                  isPremiumLocked
                                    ? "border-border/50 bg-muted/30 opacity-50"
                                    : isEnabled
                                      ? "border-border bg-background"
                                      : "border-border/50 bg-muted/30 opacity-50"
                                }`}
                              >
                                {style.isBuiltIn ? (
                                  <div className="bg-muted relative aspect-[3/2]">
                                    <Image
                                      src={`/images/dashboard/styles/${style.name}.png`}
                                      alt={`${style.displayName} preview`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50vw, 33vw"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex aspect-[3/2] items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100">
                                    <Palette className="h-6 w-6 text-violet-400" />
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium">
                                      {style.displayName}
                                    </p>
                                    {!style.isBuiltIn && (
                                      <p className="text-muted-foreground text-[10px]">
                                        Custom
                                      </p>
                                    )}
                                  </div>
                                  {isPremiumLocked ? (
                                    <Badge
                                      variant="secondary"
                                      className="shrink-0 gap-0.5 px-1.5 py-0 text-[10px] leading-tight"
                                    >
                                      <Crown className="h-2.5 w-2.5" />
                                      Premium
                                    </Badge>
                                  ) : (
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={() =>
                                        toggleChannelStyle(channel.id, style.id)
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {channels.length === 0 && (
                <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
                  <Hash className="text-muted-foreground/30 h-8 w-8" />
                  <p className="text-muted-foreground mt-2 text-sm">
                    No channels connected yet.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => setAddChannelOpen(true)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add your first channel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>#{deleteTarget?.channelName}</strong>? No Context will
              stop monitoring this channel for quotes. Existing quotes will be
              preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && removeChannel(deleteTarget)}
            >
              Remove Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
