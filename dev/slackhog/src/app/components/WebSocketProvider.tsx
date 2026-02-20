"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { MessageWithDetails } from "@/lib/types";

type WebSocketMessage =
  | {
      type: "message.new";
      channel: string;
      message: MessageWithDetails;
    }
  | {
      type: "reaction.added";
      channel: string;
      ts: string;
      reaction: string;
      user: string;
    }
  | {
      type: "reaction.removed";
      channel: string;
      ts: string;
      reaction: string;
      user: string;
    };

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  messages: Map<string, MessageWithDetails[]>;
  addMessage: (channel: string, message: MessageWithDetails) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Map<string, MessageWithDetails[]>>(
    new Map(),
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === "message.new") {
          setMessages((prev) => {
            const newMessages = new Map(prev);
            const channelMessages = newMessages.get(data.channel) || [];

            // Check if message already exists (by ts)
            if (!channelMessages.find((m) => m.ts === data.message.ts)) {
              newMessages.set(data.channel, [...channelMessages, data.message]);
            }

            return newMessages;
          });
        } else if (
          data.type === "reaction.added" ||
          data.type === "reaction.removed"
        ) {
          // Handle reactions
          setMessages((prev) => {
            const newMessages = new Map(prev);
            const channelMessages = newMessages.get(data.channel) || [];

            const updatedMessages = channelMessages.map((msg) => {
              if (msg.ts === data.ts) {
                const reactions = [...msg.reactions];
                const reactionIndex = reactions.findIndex(
                  (r) => r.emoji === data.reaction,
                );

                if (data.type === "reaction.added") {
                  if (reactionIndex >= 0) {
                    reactions[reactionIndex].count++;
                    reactions[reactionIndex].users.push(data.user);
                  } else {
                    reactions.push({
                      emoji: data.reaction,
                      count: 1,
                      users: [data.user],
                    });
                  }
                } else {
                  if (reactionIndex >= 0) {
                    reactions[reactionIndex].count--;
                    reactions[reactionIndex].users = reactions[
                      reactionIndex
                    ].users.filter((u) => u !== data.user);

                    if (reactions[reactionIndex].count === 0) {
                      reactions.splice(reactionIndex, 1);
                    }
                  }
                }

                return { ...msg, reactions };
              }
              return msg;
            });

            newMessages.set(data.channel, updatedMessages);
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const subscribe = (channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", channel }));
    }
  };

  const unsubscribe = (channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", channel }));
    }
  };

  const addMessage = (channel: string, message: MessageWithDetails) => {
    setMessages((prev) => {
      const newMessages = new Map(prev);
      const channelMessages = newMessages.get(channel) || [];
      newMessages.set(channel, [...channelMessages, message]);
      return newMessages;
    });
  };

  return (
    <WebSocketContext.Provider
      value={{ isConnected, subscribe, unsubscribe, messages, addMessage }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
