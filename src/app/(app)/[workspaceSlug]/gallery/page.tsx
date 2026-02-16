"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Search,
  SlidersHorizontal,
  X,
  SearchX,
  ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QuoteCard } from "@/components/quote-card";
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

interface Channel {
  id: string;
  channelName: string;
  isActive: boolean;
}

interface Style {
  id: string;
  name: string;
  displayName: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

function GallerySkeleton() {
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
              <div className="flex gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search & filters
  const [search, setSearch] = useState("");
  const [channelId, setChannelId] = useState("");
  const [styleId, setStyleId] = useState("");
  const [author, setAuthor] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Channel and style lists for dropdowns
  const [channels, setChannels] = useState<Channel[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);

  const router = useRouter();
  const { workspaceId, workspaceSlug } = useWorkspace();

  // Debounce refs
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const authorTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedAuthor, setDebouncedAuthor] = useState("");

  // Fetch channels and styles on mount
  useEffect(() => {
    const headers = { "X-Workspace-Id": workspaceId };
    fetch("/api/settings/channels", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data.filter((c: Channel) => c.isActive));
        }
      })
      .catch(() => {});
    fetch("/api/settings/styles", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStyles(data);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  // Debounce author
  useEffect(() => {
    if (authorTimer.current) clearTimeout(authorTimer.current);
    authorTimer.current = setTimeout(() => setDebouncedAuthor(author), 300);
    return () => {
      if (authorTimer.current) clearTimeout(authorTimer.current);
    };
  }, [author]);

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
          sort,
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (channelId) params.set("channelId", channelId);
        if (styleId) params.set("styleId", styleId);
        if (debouncedAuthor) params.set("author", debouncedAuthor);
        if (favoritesOnly) params.set("favorites", "true");

        const res = await fetch(`/api/quotes?${params}`, {
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
    [
      debouncedSearch,
      channelId,
      styleId,
      debouncedAuthor,
      favoritesOnly,
      sort,
      workspaceId,
    ],
  );

  // Reset to page 1 when filters change
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

    // Optimistic update
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
      // Revert on error
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isFavorited: !q.isFavorited } : q,
        ),
      );
      toast.error("Failed to update favorite");
    }
  };

  const activeFilterCount = [
    channelId,
    styleId,
    author,
    favoritesOnly,
    sort !== "newest",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setChannelId("");
    setStyleId("");
    setAuthor("");
    setFavoritesOnly(false);
    setSort("newest");
  };

  const hasActiveFilters =
    debouncedSearch || channelId || styleId || debouncedAuthor || favoritesOnly;

  return (
    <div className="space-y-8">
      <h1 className="text-foreground text-2xl font-bold">Gallery</h1>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filtersOpen ? "default" : "secondary"}
          size="default"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="relative"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {filtersOpen ? "Close" : "Filters"}
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter bar */}
      {filtersOpen && (
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Channel filter */}
            <div className="min-w-[160px] flex-1">
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Channel
              </label>
              <Select
                value={channelId || "all"}
                onValueChange={(v) => setChannelId(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      # {ch.channelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style filter */}
            <div className="min-w-[160px] flex-1">
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Style
              </label>
              <Select
                value={styleId || "all"}
                onValueChange={(v) => setStyleId(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All styles</SelectItem>
                  {styles.map((style) => (
                    <SelectItem key={style.name} value={style.name}>
                      {style.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Author filter */}
            <div className="min-w-[160px] flex-1">
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Author
              </label>
              <Input
                placeholder="Filter by author..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            {/* Sort */}
            <div className="min-w-[140px]">
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Sort
              </label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="favorites">Favorites first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Favorites toggle */}
            <div>
              <Button
                variant={favoritesOnly ? "default" : "secondary"}
                size="default"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
              >
                <Heart
                  className="mr-2 h-4 w-4"
                  fill={favoritesOnly ? "currentColor" : "none"}
                />
                Favorites
              </Button>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <div>
                <Button variant="ghost" size="default" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      {pagination && !loading && (
        <p className="text-muted-foreground text-sm">
          {pagination.total} {pagination.total === 1 ? "quote" : "quotes"} found
        </p>
      )}

      {/* Loading skeletons */}
      {loading && <GallerySkeleton />}

      {/* Gallery grid */}
      {!loading && quotes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quotes.map((quote) => {
            const styleName =
              styles.find((s) => s.name === quote.styleId)?.displayName || null;

            return (
              <QuoteCard
                key={quote.id}
                imageUrl={quote.imageUrl}
                quoteText={quote.quoteText}
                author={quote.attributedTo}
                styleName={styleName}
                channelName={quote.channel.channelName}
                timeAgo={timeAgo(quote.createdAt)}
                isFavorited={quote.isFavorited}
                onFavoriteToggle={(e) => toggleFavorite(e, quote.id)}
                onClick={() =>
                  router.push(`/${workspaceSlug}/gallery/${quote.id}`)
                }
              />
            );
          })}
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
          {hasActiveFilters ? (
            <>
              <SearchX className="text-muted-foreground/30 h-10 w-10" />
              <p className="text-muted-foreground mt-4 text-sm font-medium">
                No quotes match your filters
              </p>
              <p className="text-muted-foreground/60 mt-1 text-xs">
                Try adjusting your search or clearing some filters.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear all filters
              </Button>
            </>
          ) : (
            <>
              <ImageIcon className="text-muted-foreground/30 h-10 w-10" />
              <p className="text-muted-foreground mt-4 text-sm font-medium">
                No quotes yet
              </p>
              <p className="text-muted-foreground/60 mt-1 text-xs">
                Post something in your connected Slack channel to get started.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
