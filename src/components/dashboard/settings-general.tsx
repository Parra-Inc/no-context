"use client";

import { useState, useEffect } from "react";
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
import {
  Plus,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

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
  onNavigateTab?: (tab: string) => void;
}

export default function SettingsGeneral({
  workspaceName,
  needsReconnection,
  channels: initialChannels,
  styles,
  subscriptionTier,
  maxChannels,
  onNavigateTab,
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
  ) {
    const slackChannel = slackChannels.find((ch) => ch.id === postToChannelId);
    const postToChannelName = slackChannel?.name || null;

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
              <span className="text-sm text-[#4A4A4A]">Workspace</span>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {workspaceName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4A4A4A]">Slack Connection</span>
              {needsReconnection ? (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Disconnected</Badge>
                  <a
                    href="/api/slack/install"
                    className="rounded-md bg-[#7C3AED] px-3 py-1 text-xs font-medium text-white hover:bg-[#6D28D9]"
                  >
                    Reconnect
                  </a>
                </div>
              ) : (
                <Badge variant="success">Connected</Badge>
              )}
            </div>
          </div>

          <div className="border-t border-[#E5E5E5] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A]">
                  Connected Channels
                </h4>
                <p className="mt-0.5 text-xs text-[#9A9A9A]">
                  {channels.length} of{" "}
                  {maxChannels === Infinity ? "unlimited" : maxChannels}{" "}
                  channels used
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
              <p className="mt-2 text-xs text-[#9A9A9A]">
                You&apos;ve reached the channel limit for your{" "}
                {subscriptionTier} plan.{" "}
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("billing")}
                  className="text-[#7C3AED] hover:underline"
                >
                  Upgrade
                </button>{" "}
                to add more.
              </p>
            )}

            <div className="mt-3 space-y-3">
              {channels.map((channel) => {
                const enabledCount =
                  styles.length - channel.disabledStyleIds.length;
                const isExpanded = expandedChannel === channel.id;

                return (
                  <div
                    key={channel.id}
                    className={`rounded-lg border p-4 ${channel.isPaused ? "border-yellow-200 bg-yellow-50/50" : "border-[#E5E5E5] bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-[#9A9A9A]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {channel.channelName}
                        </span>
                        <Badge
                          variant={channel.isPaused ? "warning" : "success"}
                        >
                          {channel.isPaused ? "Paused" : "Active"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleChannelPause(channel.id)}
                          title={
                            channel.isPaused
                              ? "Resume channel"
                              : "Pause channel"
                          }
                        >
                          {channel.isPaused ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                        </Button>
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
                        <label className="mb-1 block text-xs text-[#4A4A4A]">
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
                        <label className="mb-1 block text-xs text-[#4A4A4A]">
                          Post To
                        </label>
                        <Select
                          value={channel.postToChannelId || "same"}
                          onValueChange={(v) =>
                            updateChannelRouting(
                              channel.id,
                              v === "same" ? null : v,
                            )
                          }
                          disabled={saving === `routing-${channel.id}`}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same">
                              Same channel (thread reply)
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

                    {/* Styles toggle section */}
                    <div className="mt-3 border-t border-[#E5E5E5] pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChannel(isExpanded ? null : channel.id)
                        }
                        className="flex w-full items-center justify-between text-xs text-[#4A4A4A] hover:text-[#1A1A1A]"
                      >
                        <span>
                          {enabledCount} of {styles.length} styles enabled
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {styles.map((style) => {
                            const isEnabled =
                              !channel.disabledStyleIds.includes(style.id);
                            return (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() =>
                                  toggleChannelStyle(channel.id, style.id)
                                }
                                className={`rounded-lg border p-2 text-left transition-colors ${
                                  isEnabled
                                    ? "border-[#7C3AED] bg-white"
                                    : "border-[#E5E5E5] bg-gray-100 opacity-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-[#1A1A1A]">
                                    {style.displayName}
                                  </span>
                                  <div
                                    className={`h-3 w-3 rounded-full ${
                                      isEnabled ? "bg-[#7C3AED]" : "bg-gray-300"
                                    }`}
                                  />
                                </div>
                                {!style.isBuiltIn && (
                                  <span className="mt-0.5 text-[10px] text-[#9A9A9A]">
                                    Custom
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {channels.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#E5E5E5] py-8">
                  <Hash className="h-8 w-8 text-[#D4D4D4]" />
                  <p className="mt-2 text-sm text-[#4A4A4A]">
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
