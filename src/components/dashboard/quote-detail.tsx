"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Download,
  Link2,
  Check,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface QuoteDetailProps {
  quote: {
    id: string;
    quoteText: string;
    attributedTo: string | null;
    slackUserAvatarUrl: string | null;
    slackUserName: string | null;
    imageUrl: string | null;
    isFavorited: boolean;
    createdAt: string;
    channelName: string;
    styleName: string | null;
  };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
  const [isFavorited, setIsFavorited] = useState(quote.isFavorited);
  const [copied, setCopied] = useState(false);

  const toggleFavorite = async () => {
    const prev = isFavorited;
    setIsFavorited(!prev);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/favorite`, {
        method: "POST",
      });
      const data = await res.json();
      setIsFavorited(data.isFavorited);
      toast.success(
        data.isFavorited ? "Added to favorites" : "Removed from favorites",
      );
    } catch {
      setIsFavorited(prev);
      toast.error("Failed to update favorite");
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/gallery"
        className="inline-flex items-center gap-2 text-sm text-[#4A4A4A] transition-colors hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Gallery
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
        {quote.imageUrl ? (
          <div className="relative aspect-[4/3]">
            <Image
              src={quote.imageUrl}
              alt={quote.quoteText}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50">
            <ImageIcon className="h-16 w-16 text-[#D4D4D4]" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="font-quote text-xl leading-relaxed text-[#1A1A1A]">
          &ldquo;{quote.quoteText}&rdquo;
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
            {quote.slackUserAvatarUrl && (
              <Image
                src={quote.slackUserAvatarUrl}
                alt={quote.attributedTo || quote.slackUserName || ""}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>
              {quote.attributedTo
                ? `— ${quote.attributedTo}`
                : quote.slackUserName
                  ? `— ${quote.slackUserName}`
                  : ""}
            </span>
          </div>
          <span className="text-[#D4D4D4]">&middot;</span>
          <span className="text-sm text-[#4A4A4A]">#{quote.channelName}</span>
          <span className="text-[#D4D4D4]">&middot;</span>
          <span className="text-sm text-[#9A9A9A]">
            {timeAgo(quote.createdAt)}
          </span>
        </div>

        {quote.styleName && (
          <Badge variant="secondary">{quote.styleName}</Badge>
        )}

        <div className="flex gap-3 border-t border-[#E5E5E5] pt-4">
          <Button
            variant={isFavorited ? "default" : "secondary"}
            size="sm"
            onClick={toggleFavorite}
          >
            <Heart
              className="mr-2 h-4 w-4"
              fill={isFavorited ? "currentColor" : "none"}
            />
            {isFavorited ? "Favorited" : "Favorite"}
          </Button>
          {quote.imageUrl && (
            <a href={quote.imageUrl} download target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={copyShareLink}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copied!" : "Share Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
