"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { BeatGrid, type BeatCardData } from "@/components/beat-card";
import { cn } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

type Props = {
  initialBeats: BeatCardData[];
  genres: string[];
  moods: string[];
  initialTotal: number;
  initialPages: number;
  initialQuery?: string;
};

const PAGE_SIZE = 100;

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "plays", label: "Most played" },
  { id: "title", label: "A–Z" },
] as const;

export function BeatExplorer({
  initialBeats,
  genres,
  moods,
  initialTotal,
  initialPages,
  initialQuery = "",
}: Props) {
  const [beats, setBeats] = useState(initialBeats);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(initialPages);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState("All");
  const [mood, setMood] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    return beats.filter((beat) => {
      if (genre !== "All" && beat.genre !== genre) return false;
      if (mood !== "All" && beat.mood !== mood) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        const haystack = [beat.title, beat.genre, beat.mood, beat.tags].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [beats, genre, mood, query]);

  const refresh = useCallback(async (nextSort: (typeof SORTS)[number]["id"]) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: nextSort, limit: String(PAGE_SIZE), page: "1" });
      const res = await fetch(`/api/beats?${params.toString()}`);
      const json = await safeJson(res);
      if (json.ok) {
        setBeats(json.beats as BeatCardData[]);
        setTotal(json.total as number);
        setPages(json.pages as number);
        setPage(1);
      }
    } catch {
      /* keep the current list on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  // Appends the next page so every beat in the store is reachable, no matter
  // how big the catalogue grows.
  const loadMore = useCallback(async () => {
    if (page >= pages) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE), page: String(page + 1) });
      const res = await fetch(`/api/beats?${params.toString()}`);
      const json = await safeJson(res);
      if (json.ok) {
        const next = json.beats as BeatCardData[];
        setBeats((current) => {
          const seen = new Set(current.map((b) => b.id));
          return [...current, ...next.filter((b) => !seen.has(b.id))];
        });
        setTotal(json.total as number);
        setPages(json.pages as number);
        setPage(page + 1);
      }
    } catch {
      /* keep the current list on failure */
    } finally {
      setLoadingMore(false);
    }
  }, [page, pages, sort]);

  // Sorting changes the server-side query; genre/mood/search filter the list locally
  // so typing stays instant.
  function changeSort(next: (typeof SORTS)[number]["id"]) {
    setSort(next);
    void refresh(next);
  }

  const anyFilter = query.trim() || genre !== "All" || mood !== "All";
  const moreAvailable = page < pages && !loadingMore;

  return (
    <div>
      <div className="surface-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, vibe or tag — e.g. 'amapiano', 'dark', 'accra'"
              className="input pl-10"
              aria-label="Search beats"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
            <select value={sort} onChange={(e) => changeSort(e.target.value as typeof sort)} className="select w-auto">
              {SORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FilterRow
            label="Genre"
            options={["All", ...genres]}
            value={genre}
            onChange={setGenre}
          />
          <FilterRow label="Mood" options={["All", ...moods]} value={mood} onChange={setMood} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {loading
            ? "Loading…"
            : `${filtered.length} of ${total} beat${total === 1 ? "" : "s"}${
                anyFilter ? " matching your filters" : ""
              }`}
        </p>
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGenre("All");
              setMood("All");
            }}
            className="text-xs text-zinc-400 hover:text-lime-300"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="mt-4">
        <BeatGrid beats={filtered} />
      </div>

      {moreAvailable && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button type="button" onClick={() => void loadMore()} className="btn btn-secondary btn-lg">
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading beats…
              </>
            ) : (
              <>Load more beats</>
            )}
          </button>
          <p className="text-xs text-zinc-500">
            Showing {beats.length} of {total} beats
          </p>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition",
            value === option
              ? "border-lime-400/60 bg-lime-400/15 text-lime-200"
              : "border-ink-700 bg-ink-850 text-zinc-400 hover:border-ink-600 hover:text-zinc-200"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
