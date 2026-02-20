"use client";

import { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { MessageWithDetails } from "@/lib/types";

interface MessageListProps {
  messages: MessageWithDetails[];
  onThreadClick?: (message: MessageWithDetails) => void;
}

export function MessageList({ messages, onThreadClick }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="mb-2 text-4xl">💬</div>
          <div>No messages yet</div>
          <div className="mt-1 text-sm">
            Messages sent to this channel will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="py-4">
        {messages.map((message) => (
          <Message
            key={message.ts}
            message={message}
            onThreadClick={
              onThreadClick ? () => onThreadClick(message) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
