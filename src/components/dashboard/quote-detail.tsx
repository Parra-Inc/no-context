"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Download,
  Link2,
  Check,
  ImageIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Generation {
  id: string;
  styleId: string;
  styleName: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

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
    status: string;
  };
  generations: Generation[];
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

export function QuoteDetail({ quote, generations }: QuoteDetailProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(quote.isFavorited);
  const [copied, setCopied] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPendingGeneration = generations.some(
    (g) => g.status === "PENDING" || g.status === "PROCESSING",
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Poll for in-progress generations
  useEffect(() => {
    if (hasPendingGeneration && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        router.refresh();
      }, 4000);
    } else if (!hasPendingGeneration) {
      stopPolling();
    }

    return stopPolling;
  }, [hasPendingGeneration, router, stopPolling]);

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

  const handleReroll = async () => {
    setIsRerolling(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/regenerate`, {
        method: "POST",
      });

      if (res.status === 429) {
        toast.error("Monthly quota exceeded");
        return;
      }

      if (!res.ok) {
        toast.error("Failed to start generation");
        return;
      }

      toast.success("Generating new image...");
      router.refresh();
    } catch {
      toast.error("Failed to start generation");
    } finally {
      setIsRerolling(false);
    }
  };

  // The most recent generation is the main displayed image
  const latestGeneration =
    generations.length > 0 ? generations[generations.length - 1] : null;
  const displayImageUrl = latestGeneration?.imageUrl ?? quote.imageUrl;
  const displayStyleName = latestGeneration?.styleName ?? quote.styleName;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/gallery"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Gallery
      </Link>

      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        {displayImageUrl ? (
          <div className="relative aspect-[4/3]">
            <Image
              src={displayImageUrl}
              alt={quote.quoteText}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : hasPendingGeneration ? (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-50 to-orange-50">
            <Loader2 className="text-muted-foreground/50 h-10 w-10 animate-spin" />
            <p className="text-muted-foreground text-sm">Generating image...</p>
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50">
            <ImageIcon className="text-muted-foreground/30 h-16 w-16" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-quote text-foreground text-xl leading-relaxed">
            &ldquo;{quote.quoteText}&rdquo;
          </p>
          {quote.attributedTo && (
            <p className="text-muted-foreground mt-1 text-base">
              — {quote.attributedTo}
            </p>
          )}
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {quote.slackUserAvatarUrl && (
            <Image
              src={quote.slackUserAvatarUrl}
              alt={quote.slackUserName || ""}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          {quote.slackUserName && <span>Posted by {quote.slackUserName}</span>}
          <span className="text-muted-foreground/30">&middot;</span>
          <span>#{quote.channelName}</span>
          <span className="text-muted-foreground/30">&middot;</span>
          <span className="text-muted-foreground/60">
            {timeAgo(quote.createdAt)}
          </span>
        </div>

        {displayStyleName && (
          <Badge variant="secondary">{displayStyleName}</Badge>
        )}

        <div className="border-border flex flex-wrap gap-3 border-t pt-4">
          <Button
            variant={isFavorited ? "default" : "secondary"}
            size="sm"
            onClick={toggleFavorite}
          >
            <motion.div
              key={String(isFavorited)}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="mr-2 inline-flex"
            >
              <Heart
                className="h-4 w-4"
                fill={isFavorited ? "currentColor" : "none"}
              />
            </motion.div>
            {isFavorited ? "Favorited" : "Favorite"}
          </Button>
          {displayImageUrl && (
            <a href={displayImageUrl} download target="_blank" rel="noreferrer">
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReroll}
            disabled={isRerolling || hasPendingGeneration}
          >
            {isRerolling || hasPendingGeneration ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Re-roll
          </Button>
        </div>
      </div>

      {/* Image Generation History */}
      {generations.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-medium">
            All Generations
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...generations].reverse().map((gen) => (
              <div
                key={gen.id}
                className="border-border bg-card overflow-hidden rounded-lg border shadow-sm"
              >
                {gen.imageUrl ? (
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={gen.imageUrl}
                      alt={`${gen.styleName} generation`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </div>
                ) : gen.status === "PENDING" || gen.status === "PROCESSING" ? (
                  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-50 to-orange-50">
                    <Loader2 className="text-muted-foreground/50 h-6 w-6 animate-spin" />
                    <p className="text-muted-foreground text-xs">
                      Generating...
                    </p>
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50">
                    <ImageIcon className="text-muted-foreground/30 h-8 w-8" />
                  </div>
                )}
                <div className="flex items-center justify-between p-2">
                  <span className="text-muted-foreground truncate text-xs">
                    {gen.styleName}
                  </span>
                  {gen.status === "FAILED" && (
                    <Badge
                      variant="secondary"
                      className="text-destructive text-[10px]"
                    >
                      Failed
                    </Badge>
                  )}
                  {(gen.status === "PENDING" ||
                    gen.status === "PROCESSING") && (
                    <Badge variant="secondary" className="text-[10px]">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
