"use client";

import { useEffect, useState } from "react";
import type { Channel } from "@/lib/types";
import { useWebSocket } from "./WebSocketProvider";

interface SidebarProps {
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
}

export function Sidebar({ selectedChannel, onChannelSelect }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { isConnected } = useWebSocket();

  useEffect(() => {
    // Fetch channels on mount
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setChannels(data.channels || []);
        }
      })
      .catch((error) => console.error("Error fetching channels:", error));
  }, []);

  return (
    <div className="flex h-full w-60 flex-col border-r border-purple-900 bg-purple-950">
      {/* Header */}
      <div className="border-b border-purple-900 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Slackhog</h1>
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-500"
            }`}
            title={isConnected ? "Connected" : "Disconnected"}
          />
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-1 px-2 text-xs font-semibold text-gray-400">
            Channels
          </div>
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={`w-full rounded px-2 py-1 text-left transition-colors hover:bg-purple-900 ${
                selectedChannel === channel.id
                  ? "bg-purple-900 font-semibold text-white"
                  : "text-gray-300"
              }`}
            >
              <span className="mr-1">#</span>
              {channel.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
