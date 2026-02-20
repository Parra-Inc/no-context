"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MessageList } from "./components/MessageList";
import {
  WebSocketProvider,
  useWebSocket,
} from "./components/WebSocketProvider";
import type { MessageWithDetails } from "@/lib/types";

function SlackogContent() {
  const [selectedChannel, setSelectedChannel] = useState("C000000001");
  const { subscribe, messages, addMessage } = useWebSocket();

  useEffect(() => {
    // Subscribe to the selected channel
    subscribe(selectedChannel);

    // Fetch initial messages
    fetch(`/api/messages/${selectedChannel}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.messages) {
          // Replace messages for this channel
          data.messages.forEach((msg: MessageWithDetails) => {
            addMessage(selectedChannel, msg);
          });
        }
      })
      .catch((error) => console.error("Error fetching messages:", error));
  }, [selectedChannel, subscribe, addMessage]);

  const channelMessages = messages.get(selectedChannel) || [];

  return (
    <div className="flex h-screen">
      <Sidebar
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
      />

      <div className="flex flex-1 flex-col">
        {/* Channel header */}
        <div className="flex h-14 items-center border-b border-gray-700 px-4">
          <h2 className="text-lg font-semibold"># general</h2>
        </div>

        {/* Messages */}
        <MessageList messages={channelMessages} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <WebSocketProvider>
      <SlackogContent />
    </WebSocketProvider>
  );
}
