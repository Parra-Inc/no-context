"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MessageWithDetails } from "@/lib/types";

interface MessageProps {
  message: MessageWithDetails;
  onThreadClick?: () => void;
}

export function Message({ message, onThreadClick }: MessageProps) {
  const [showCopyButton, setShowCopyButton] = useState(false);

  const formatTime = (ts: string) => {
    const timestamp = parseFloat(ts) * 1000;
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageUrl = (ts: string, channelId: string) => {
    const tsWithoutDot = ts.replace(".", "");
    return `${window.location.origin}/c/${channelId}/p${tsWithoutDot}`;
  };

  const copyMessageUrl = () => {
    const url = getMessageUrl(message.ts, message.channel_id);
    navigator.clipboard.writeText(url);
  };

  return (
    <div
      className="group px-4 py-2 transition-colors hover:bg-gray-800/30"
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => setShowCopyButton(false)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold">
          {message.user.name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-semibold text-white">
              {message.user.name}
            </span>
            <span
              className="text-xs text-gray-400"
              title={new Date(message.created_at).toLocaleString()}
            >
              {formatTime(message.ts)}
            </span>
            {showCopyButton && (
              <button
                onClick={copyMessageUrl}
                className="text-xs text-gray-400 transition-colors hover:text-white"
                title="Copy message link"
              >
                🔗
              </button>
            )}
          </div>

          {/* Message text */}
          <div className="prose prose-invert prose-sm max-w-none text-gray-200">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded border border-gray-700 bg-gray-800/50 p-3"
                >
                  {attachment.title && (
                    <div className="mb-1 font-semibold">{attachment.title}</div>
                  )}
                  {attachment.text && (
                    <div className="text-sm text-gray-300">
                      {attachment.text}
                    </div>
                  )}
                  {attachment.image_url && (
                    <img
                      src={attachment.image_url}
                      alt={attachment.fallback}
                      className="mt-2 max-w-md rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.reactions.map((reaction) => (
                <div
                  key={reaction.emoji}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-600 bg-gray-700/50 px-2 py-0.5 text-xs"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-300">{reaction.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Thread indicator */}
          {message.reply_count > 0 && onThreadClick && (
            <button
              onClick={onThreadClick}
              className="mt-2 flex items-center gap-1 text-sm text-blue-400 transition-colors hover:text-blue-300"
            >
              <span>💬</span>
              <span>
                {message.reply_count}{" "}
                {message.reply_count === 1 ? "reply" : "replies"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
