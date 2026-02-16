"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface QuoteCardProps {
  imageUrl: string | null;
  quoteText: string;
  author?: string | null;
  styleName?: string | null;
  channelName?: string | null;
  timeAgo?: string | null;
  isFavorited?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  className?: string;
  imageSizes?: string;
}

export function QuoteCard({
  imageUrl,
  quoteText,
  author,
  styleName,
  channelName,
  timeAgo,
  isFavorited,
  onFavoriteToggle,
  onClick,
  className,
  imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
}: QuoteCardProps) {
  const showFooter = channelName || timeAgo || onFavoriteToggle;

  return (
    <div
      className={cn("group h-full", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:shadow-md">
        {imageUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={imageUrl}
              alt={quoteText}
              fill
              className="object-cover transition-transform group-hover:scale-[1.02]"
              sizes={imageSizes}
            />
            {styleName && (
              <div className="absolute bottom-2 left-2">
                <Badge
                  variant="secondary"
                  className="bg-black/60 text-[10px] text-white backdrop-blur-sm"
                >
                  {styleName}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-50 to-orange-50">
            <ImageIcon className="text-muted-foreground/30 h-8 w-8" />
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <p className="font-quote text-foreground line-clamp-2 text-sm">
            &ldquo;{quoteText}&rdquo;
          </p>
          {author && (
            <p className="text-muted-foreground mt-1 text-xs">— {author}</p>
          )}
          {showFooter && (
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center gap-2">
                {channelName && (
                  <span className="text-muted-foreground/60 text-xs">
                    #{channelName}
                  </span>
                )}
                {timeAgo && (
                  <span className="text-muted-foreground/30 text-[10px]">
                    {timeAgo}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {onFavoriteToggle && (
                  <button
                    onClick={onFavoriteToggle}
                    className="text-muted-foreground hover:text-coral transition-colors"
                  >
                    <motion.div
                      key={String(isFavorited)}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                      className="inline-flex"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={isFavorited ? "var(--coral)" : "none"}
                        stroke={isFavorited ? "var(--coral)" : "currentColor"}
                      />
                    </motion.div>
                  </button>
                )}
                {imageUrl && (
                  <a
                    href={imageUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
