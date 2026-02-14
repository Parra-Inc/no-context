"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Download,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from "lucide-react";
import { ART_STYLES } from "@/lib/styles";
import { Lightbox } from "@/components/marketing/lightbox";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function GalleryPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & filters
  const [search, setSearch] = useState("");
  const [channelId, setChannelId] = useState("");
  const [styleId, setStyleId] = useState("");
  const [author, setAuthor] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Channel list for dropdown
  const [channels, setChannels] = useState<Channel[]>([]);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Debounce refs
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const authorTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedAuthor, setDebouncedAuthor] = useState("");

  // Fetch channels on mount
  useEffect(() => {
    fetch("/api/settings/channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data.filter((c: Channel) => c.isActive));
        }
      })
      .catch(() => {});
  }, []);

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
      setLoading(true);
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

        const res = await fetch(`/api/quotes?${params}`);
        const data = await res.json();
        if (append) {
          setQuotes((prev) => [...prev, ...data.quotes]);
        } else {
          setQuotes(data.quotes);
        }
        setPagination(data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, channelId, styleId, debouncedAuthor, favoritesOnly, sort],
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
    const res = await fetch(`/api/quotes/${id}/favorite`, { method: "POST" });
    const data = await res.json();
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, isFavorited: data.isFavorited } : q,
      ),
    );
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Gallery</h1>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#4A4A4A]" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5E5] bg-white py-2.5 pr-4 pl-10 text-sm text-[#1A1A1A] placeholder-[#4A4A4A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
          />
        </div>
        <Button
          variant={filtersOpen ? "default" : "secondary"}
          size="default"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="relative"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter bar */}
      {filtersOpen && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Channel filter */}
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">
                Channel
              </label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
              >
                <option value="">All channels</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    # {ch.channelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Style filter */}
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">
                Style
              </label>
              <select
                value={styleId}
                onChange={(e) => setStyleId(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
              >
                <option value="">All styles</option>
                {ART_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Author filter */}
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">
                Author
              </label>
              <input
                type="text"
                placeholder="Filter by author..."
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#4A4A4A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
              />
            </div>

            {/* Sort */}
            <div className="min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">
                Sort
              </label>
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#4A4A4A]" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white py-2 pr-3 pl-9 text-sm text-[#1A1A1A] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] focus:outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="favorites">Favorites first</option>
                </select>
              </div>
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
        <p className="text-sm text-[#4A4A4A]">
          {pagination.total} {pagination.total === 1 ? "quote" : "quotes"} found
        </p>
      )}

      {/* Gallery grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quotes.map((quote, index) => (
          <div
            key={quote.id}
            className="group cursor-pointer"
            onClick={() => setLightboxIndex(index)}
          >
            <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
              {quote.imageUrl ? (
                <div className="relative aspect-square">
                  <Image
                    src={quote.imageUrl}
                    alt={quote.quoteText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-50 text-4xl">
                  🎨
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="font-quote line-clamp-2 text-sm text-[#1A1A1A]">
                  &ldquo;{quote.quoteText}&rdquo;
                </p>
                {quote.attributedTo && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {quote.slackUserAvatarUrl && (
                      <Image
                        src={quote.slackUserAvatarUrl}
                        alt={quote.attributedTo}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <p className="text-xs text-[#4A4A4A]">
                      — {quote.attributedTo}
                    </p>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-xs text-[#4A4A4A]">
                    #{quote.channel.channelName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => toggleFavorite(e, quote.id)}
                      className="text-[#4A4A4A] transition-colors hover:text-[#F97066]"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={quote.isFavorited ? "#F97066" : "none"}
                        stroke={quote.isFavorited ? "#F97066" : "currentColor"}
                      />
                    </button>
                    {quote.imageUrl && (
                      <a
                        href={quote.imageUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#4A4A4A] hover:text-[#1A1A1A]"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-center text-sm text-[#4A4A4A]">Loading...</p>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !loading && (
        <div className="flex flex-col items-center gap-2">
          {page < pagination.totalPages && (
            <Button variant="secondary" onClick={loadMore}>
              Load More
            </Button>
          )}
          <p className="text-xs text-[#4A4A4A]">
            Showing {quotes.length} of {pagination.total} · Page {page} of{" "}
            {pagination.totalPages}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && quotes.length === 0 && (
        <p className="text-center text-sm text-[#4A4A4A]">
          {debouncedSearch ||
          channelId ||
          styleId ||
          debouncedAuthor ||
          favoritesOnly
            ? "No quotes match your filters. Try adjusting your search."
            : "No quotes yet. Post something in your connected channel!"}
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && quotes[lightboxIndex] && (
        <Lightbox
          items={quotes.map((q) => ({
            quote: q.quoteText,
            author: q.attributedTo || "Unknown",
            style:
              ART_STYLES.find((s) => s.id === q.styleId)?.displayName ||
              q.styleId,
            image: q.imageUrl || "",
          }))}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((i) =>
              i !== null ? (i - 1 + quotes.length) % quotes.length : null,
            )
          }
          onNext={() =>
            setLightboxIndex((i) =>
              i !== null ? (i + 1) % quotes.length : null,
            )
          }
        />
      )}
    </div>
  );
}
