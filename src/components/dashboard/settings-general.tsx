"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  subscriptionStatus: string;
}

export default function SettingsGeneral({
  workspaceName,
  needsReconnection,
  channels: initialChannels,
  styles,
  subscriptionTier,
  subscriptionStatus,
}: SettingsGeneralProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/slack-channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSlackChannels(data);
      })
      .catch(() => {});
  }, []);

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
    } finally {
      setSaving(null);
    }
  }

  async function toggleChannelStyle(channelId: string, styleId: string) {
    const channel = channels.find((ch) => ch.id === channelId);
    if (!channel) return;

    const isCurrentlyDisabled = channel.disabledStyleIds.includes(styleId);

    // Optimistic update
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
        // Re-enable: delete the ChannelStyle record
        await fetch(
          `/api/settings/channel-styles?channelId=${channelId}&styleId=${styleId}`,
          { method: "DELETE" },
        );
      } else {
        // Disable: create a ChannelStyle record
        await fetch("/api/settings/channel-styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, styleId }),
        });
      }
    } catch {
      // Revert on failure
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
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Settings</h1>

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
            <h4 className="text-sm font-medium text-[#1A1A1A]">
              Connected Channels
            </h4>
            <p className="mt-1 text-xs text-[#9A9A9A]">
              Configure style mode, enabled styles, and routing for each channel
            </p>
            <div className="mt-3 space-y-3">
              {channels.map((channel) => {
                const enabledCount =
                  styles.length - channel.disabledStyleIds.length;
                const isExpanded = expandedChannel === channel.id;

                return (
                  <div
                    key={channel.id}
                    className="rounded-lg border border-[#E5E5E5] bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        # {channel.channelName}
                      </span>
                      <Badge variant={channel.isPaused ? "warning" : "success"}>
                        {channel.isPaused ? "Paused" : "Active"}
                      </Badge>
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
                        <span>{isExpanded ? "Hide" : "Show"}</span>
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4A4A4A]">Current Plan</span>
              <Badge>{subscriptionTier}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4A4A4A]">Status</span>
              <Badge
                variant={
                  subscriptionStatus === "ACTIVE" ? "success" : "warning"
                }
              >
                {subscriptionStatus}
              </Badge>
            </div>
          </div>
          <a
            href="/dashboard/settings/billing"
            className="text-sm text-[#7C3AED] hover:underline"
          >
            Manage Billing
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardTitle>Art Styles</CardTitle>
          <CardDescription>
            Browse available styles and manage custom styles
          </CardDescription>
          <a
            href="/dashboard/settings/styles"
            className="text-sm text-[#7C3AED] hover:underline"
          >
            Manage Styles
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
