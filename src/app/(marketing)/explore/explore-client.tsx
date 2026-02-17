"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SearchX, ImageIcon } from "lucide-react";
import { QuoteCard } from "@/components/quote-card";
import { ART_STYLES } from "@/lib/styles";
import { FadeIn } from "@/components/marketing/fade-in";

interface ExploreQuote {
  id: string;
  quoteText: string;
  styleId: string;
  imageUrl: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function ExploreSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ExploreClient() {
  const [quotes, setQuotes] = useState<ExploreQuote[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search & filters
  const [search, setSearch] = useState("");
  const [styleId, setStyleId] = useState("");
  const [sort, setSort] = useState("newest");

  // Debounce ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
          sort,
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (styleId) params.set("styleId", styleId);

        const res = await fetch(`/api/explore?${params}`);
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
    [debouncedSearch, styleId, sort],
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

  const hasActiveFilters = debouncedSearch || styleId;

  const clearFilters = () => {
    setSearch("");
    setStyleId("");
    setSort("newest");
  };

  return (
    <div className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl text-[#1A1A1A] md:text-4xl">
              Explore
            </h1>
            <p className="mt-4 text-lg text-[#4A4A4A]">
              Browse AI-generated artwork from out-of-context workplace quotes.
            </p>
          </div>
        </FadeIn>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={styleId || "all"}
            onValueChange={(v) => setStyleId(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All styles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {ART_STYLES.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {style.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {pagination && !loading && (
          <p className="text-muted-foreground mt-4 text-sm">
            {pagination.total} {pagination.total === 1 ? "quote" : "quotes"}{" "}
            found
          </p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-8">
            <ExploreSkeleton />
          </div>
        )}

        {/* Gallery grid */}
        {!loading && quotes.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quotes.map((quote) => {
              const style = ART_STYLES.find((s) => s.id === quote.styleId);
              return (
                <QuoteCard
                  key={quote.id}
                  imageUrl={quote.imageUrl}
                  quoteText={quote.quoteText}
                  styleName={style?.displayName || null}
                />
              );
            })}
          </div>
        )}

        {/* Load More pagination */}
        {pagination && pagination.totalPages > 1 && !loading && (
          <div className="mt-8 flex flex-col items-center gap-2">
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
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E5E5] py-16">
            {hasActiveFilters ? (
              <>
                <SearchX className="h-10 w-10 text-[#A0A0A0]" />
                <p className="mt-4 text-sm font-medium text-[#4A4A4A]">
                  No quotes match your filters
                </p>
                <p className="mt-1 text-xs text-[#A0A0A0]">
                  Try adjusting your search or clearing some filters.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-[#A0A0A0]" />
                <p className="mt-4 text-sm font-medium text-[#4A4A4A]">
                  No quotes yet
                </p>
                <p className="mt-1 text-xs text-[#A0A0A0]">
                  Check back soon for AI-generated artwork.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
