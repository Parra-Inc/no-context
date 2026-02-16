"use client";

import { useState } from "react";
import Link from "next/link";
import { QuoteCard } from "@/components/quote-card";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";

interface RecentQuote {
  id: string;
  quoteText: string;
  attributedTo: string | null;
  styleId: string;
  imageUrl: string | null;
  isFavorited: boolean;
  createdAt: string;
  channelName: string;
  styleName: string | null;
  timeAgo: string;
}

export function RecentQuotes({
  initialQuotes,
}: {
  initialQuotes: RecentQuote[];
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const { workspaceId, workspaceSlug } = useWorkspace();

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, isFavorited: !q.isFavorited } : q,
      ),
    );

    try {
      const res = await fetch(`/api/quotes/${id}/favorite`, {
        method: "POST",
        headers: { "X-Workspace-Id": workspaceId },
      });
      const data = await res.json();
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isFavorited: data.isFavorited } : q,
        ),
      );
    } catch {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isFavorited: !q.isFavorited } : q,
        ),
      );
      toast.error("Failed to update favorite");
    }
  };

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quotes.map((quote) => (
        <Link
          key={quote.id}
          href={`/${workspaceSlug}/gallery/${quote.id}`}
          className="h-full"
        >
          <QuoteCard
            imageUrl={quote.imageUrl}
            quoteText={quote.quoteText}
            author={quote.attributedTo}
            styleName={quote.styleName}
            channelName={quote.channelName}
            timeAgo={quote.timeAgo}
            isFavorited={quote.isFavorited}
            onFavoriteToggle={(e) => toggleFavorite(e, quote.id)}
          />
        </Link>
      ))}
    </div>
  );
}
