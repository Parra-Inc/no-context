"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteCard } from "@/components/quote-card";
import { ArrowLeft, Search, ImageIcon, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-context";

interface Quote {
  id: string;
  quoteText: string;
  attributedTo: string | null;
  slackUserAvatarUrl: string | null;
  styleId: string;
  imageUrl: string | null;
  isFavorited: boolean;
  createdAt: string;
  channel: { channelName: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CollectionDetailClientProps {
  collectionId: string;
  initialName: string;
  initialEmoji: string | null;
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
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CollectionDetailClient({
  collectionId,
  initialName,
  initialEmoji,
}: CollectionDetailClientProps) {
  const router = useRouter();
  const { workspaceId, workspaceSlug } = useWorkspace();
  const [name, setName] = useState(initialName);
  const [emoji] = useState(initialEmoji);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(initialName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchQuotes = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "20",
        });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/collections/${collectionId}?${params}`, {
          headers: { "X-Workspace-Id": workspaceId },
        });
        const data = await res.json();

        if (append) {
          setQuotes((prev) => [...prev, ...data.quotes]);
        } else {
          setQuotes(data.quotes);
        }
        setPagination(data.pagination);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [collectionId, debouncedSearch, workspaceId],
  );

  useEffect(() => {
    setPage(1);
    fetchQuotes(1);
  }, [fetchQuotes]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuotes(nextPage, true);
  };

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

  const handleSaveName = async () => {
    if (editedName.trim() && editedName.trim() !== name) {
      try {
        const res = await fetch(`/api/collections/${collectionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Workspace-Id": workspaceId,
          },
          body: JSON.stringify({ name: editedName.trim() }),
        });
        if (res.ok) {
          setName(editedName.trim());
          toast.success("Collection updated");
        } else {
          toast.error("Failed to update collection");
          setEditedName(name);
        }
      } catch {
        toast.error("Failed to update collection");
        setEditedName(name);
      }
    } else {
      setEditedName(name);
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  return (
    <div className="space-y-8">
      <Link
        href={`/${workspaceSlug}/collections`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Collections
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        {emoji && <span className="text-3xl">{emoji}</span>}
        {isEditingName ? (
          <Input
            ref={nameInputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveName();
              } else if (e.key === "Escape") {
                setEditedName(name);
                setIsEditingName(false);
              }
            }}
            className="text-2xl font-bold"
          />
        ) : (
          <h1
            className="text-foreground cursor-pointer text-2xl font-bold transition-colors hover:opacity-70"
            onClick={() => setIsEditingName(true)}
          >
            {name}
          </h1>
        )}
        {pagination && !loading && (
          <span className="text-muted-foreground text-sm">
            {pagination.total} {pagination.total === 1 ? "quote" : "quotes"}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search quotes in collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {loading && <DetailSkeleton />}

      {/* Quote grid */}
      {!loading && quotes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              imageUrl={quote.imageUrl}
              quoteText={quote.quoteText}
              author={quote.attributedTo}
              channelName={quote.channel.channelName}
              timeAgo={timeAgo(quote.createdAt)}
              isFavorited={quote.isFavorited}
              onFavoriteToggle={(e) => toggleFavorite(e, quote.id)}
              onClick={() =>
                router.push(`/${workspaceSlug}/gallery/${quote.id}`)
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !loading && (
        <div className="flex flex-col items-center gap-2">
          {page < pagination.totalPages && (
            <Button
              variant="secondary"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          )}
          <p className="text-muted-foreground text-xs">
            Showing {quotes.length} of {pagination.total} · Page {page} of{" "}
            {pagination.totalPages}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && quotes.length === 0 && (
        <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
          {debouncedSearch ? (
            <>
              <SearchX className="text-muted-foreground/30 h-10 w-10" />
              <p className="text-muted-foreground mt-4 text-sm font-medium">
                No quotes match your search
              </p>
              <p className="text-muted-foreground/60 mt-1 text-xs">
                Try adjusting your search terms.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setSearch("")}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear search
              </Button>
            </>
          ) : (
            <>
              <ImageIcon className="text-muted-foreground/30 h-10 w-10" />
              <p className="text-muted-foreground mt-4 text-sm font-medium">
                No quotes in this collection
              </p>
              <p className="text-muted-foreground/60 mt-1 text-xs">
                Add quotes from the gallery or quote detail page.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
