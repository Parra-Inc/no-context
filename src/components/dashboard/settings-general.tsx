"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArtStyle } from "@/lib/styles";

interface Channel {
  id: string;
  slackChannelId: string;
  channelName: string;
  isActive: boolean;
  isPaused: boolean;
  styleId: string | null;
  postToChannelId: string | null;
  postToChannelName: string | null;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface SettingsGeneralProps {
  workspaceName: string;
  defaultStyleId: string;
  needsReconnection: boolean;
  channels: Channel[];
  artStyles: ArtStyle[];
  customStyles: { id: string; name: string; description: string }[];
  subscriptionTier: string;
  subscriptionStatus: string;
}

export default function SettingsGeneral({
  workspaceName,
  defaultStyleId: initialDefaultStyleId,
  needsReconnection,
  channels: initialChannels,
  artStyles,
  customStyles,
  subscriptionTier,
  subscriptionStatus,
}: SettingsGeneralProps) {
  const [defaultStyleId, setDefaultStyleId] = useState(initialDefaultStyleId);
  const [channels, setChannels] = useState(initialChannels);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/slack-channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSlackChannels(data);
      })
      .catch(() => {});
  }, []);

  const allStyles = [
    ...artStyles.map((s) => ({ id: s.id, displayName: s.displayName })),
    ...customStyles.map((s) => ({ id: s.name, displayName: s.name })),
  ];

  async function updateDefaultStyle(styleId: string) {
    setSaving("defaultStyle");
    setDefaultStyleId(styleId);
    try {
      await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultStyleId: styleId }),
      });
    } catch {
      setDefaultStyleId(initialDefaultStyleId);
    } finally {
      setSaving(null);
    }
  }

  async function updateChannelStyle(channelId: string, styleId: string | null) {
    setSaving(`style-${channelId}`);
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, styleId } : ch)),
    );
    try {
      await fetch("/api/settings/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, styleId }),
      });
    } finally {
      setSaving(null);
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
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[#4A4A4A]">Default Style</span>
                <p className="text-xs text-[#9A9A9A]">
                  Used when a channel has no style override
                </p>
              </div>
              <select
                value={defaultStyleId}
                onChange={(e) => updateDefaultStyle(e.target.value)}
                disabled={saving === "defaultStyle"}
                className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
              >
                {allStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-[#E5E5E5] pt-4">
            <h4 className="text-sm font-medium text-[#1A1A1A]">
              Connected Channels
            </h4>
            <p className="mt-1 text-xs text-[#9A9A9A]">
              Configure style and routing for each channel
            </p>
            <div className="mt-3 space-y-3">
              {channels.map((channel) => (
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
                        Art Style
                      </label>
                      <select
                        value={channel.styleId || ""}
                        onChange={(e) =>
                          updateChannelStyle(channel.id, e.target.value || null)
                        }
                        disabled={saving === `style-${channel.id}`}
                        className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                      >
                        <option value="">
                          Default (
                          {
                            allStyles.find((s) => s.id === defaultStyleId)
                              ?.displayName
                          }
                          )
                        </option>
                        {allStyles.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#4A4A4A]">
                        Post To
                      </label>
                      <select
                        value={channel.postToChannelId || ""}
                        onChange={(e) =>
                          updateChannelRouting(
                            channel.id,
                            e.target.value || null,
                          )
                        }
                        disabled={saving === `routing-${channel.id}`}
                        className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                      >
                        <option value="">Same channel (thread reply)</option>
                        {slackChannels.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            # {ch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
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
