"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  Users,
  Flag,
  MapPin,
  Calendar,
  BookOpen,
  Clock,
} from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { buildSearchIndex, type SearchEntry } from "@/lib/search-index";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECENT_KEY = "paddock-recent-searches";
const MAX_RECENT = 5;

const TYPE_CONFIG: Record<
  SearchEntry["type"],
  { label: string; icon: typeof Users; badgeColor: string }
> = {
  driver: {
    label: "Drivers",
    icon: Users,
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  team: {
    label: "Teams",
    icon: Flag,
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  circuit: {
    label: "Circuits",
    icon: MapPin,
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  season: {
    label: "Seasons",
    icon: Calendar,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  learn: {
    label: "Learn",
    icon: BookOpen,
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
};

const GROUP_ORDER: SearchEntry["type"][] = [
  "driver",
  "team",
  "circuit",
  "season",
  "learn",
];

// ---------------------------------------------------------------------------
// Recent searches helpers
// ---------------------------------------------------------------------------

function loadRecent(): SearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as SearchEntry[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(entry: SearchEntry) {
  try {
    const existing = loadRecent().filter((e) => e.href !== entry.href);
    const updated = [entry, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // localStorage not available - silently fail
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchEntry[]>([]);
  const router = useRouter();
  const indexRef = useRef<SearchEntry[] | null>(null);
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);

  // Lazily build the search index on first open
  const ensureIndex = useCallback(() => {
    if (!indexRef.current) {
      indexRef.current = buildSearchIndex();
      fuseRef.current = new Fuse(indexRef.current, {
        keys: ["title", "subtitle"],
        threshold: 0.35,
        includeScore: true,
      });
    }
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build index + load recents when dialog opens
  useEffect(() => {
    if (open) {
      ensureIndex();
      setRecentSearches(loadRecent());
      setQuery("");
    }
  }, [open, ensureIndex]);

  // Fuzzy search results
  const results = useMemo(() => {
    if (!query.trim() || !fuseRef.current) return [];
    return fuseRef.current.search(query, { limit: 20 }).map((r) => r.item);
  }, [query]);

  // Group results by type
  const grouped = useMemo(() => {
    const map = new Map<SearchEntry["type"], SearchEntry[]>();
    for (const entry of results) {
      const list = map.get(entry.type) ?? [];
      list.push(entry);
      map.set(entry.type, list);
    }
    return map;
  }, [results]);

  // Navigate to a result
  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      saveRecent(entry);
      setOpen(false);
      router.push(entry.href);
    },
    [router],
  );

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showResults = query.trim().length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search The Paddock"
      description="Find drivers, teams, circuits, seasons, and more"
      className="sm:max-w-xl glass border border-[rgba(255,255,255,0.08)] shadow-[0_0_40px_rgba(255,107,44,0.06)]"
    >
      <Command
        shouldFilter={false}
        className="bg-transparent"
      >
        <CommandInput
          placeholder="Search drivers, teams, circuits..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-80">
          {/* Empty state when searching */}
          {showResults && results.length === 0 && (
            <CommandEmpty className="text-text-secondary">
              No results found for &quot;{query}&quot;
            </CommandEmpty>
          )}

          {/* Recent searches */}
          {showRecent && (
            <CommandGroup heading="Recent">
              {recentSearches.map((entry) => {
                const config = TYPE_CONFIG[entry.type];
                const Icon = config.icon;
                return (
                  <CommandItem
                    key={`recent-${entry.href}`}
                    value={entry.href}
                    onSelect={() => handleSelect(entry)}
                    className="group cursor-pointer transition-colors hover:bg-[rgba(255,107,44,0.06)]"
                  >
                    <Clock className="size-4 text-text-tertiary" />
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      <span className="truncate text-text-primary">
                        {entry.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${config.badgeColor}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <Icon className="size-3.5 text-text-tertiary" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Prompt when input is empty and no recents */}
          {!showResults && !showRecent && (
            <div className="py-10 text-center text-sm text-text-secondary">
              Start typing to search across The Paddock
            </div>
          )}

          {/* Search results grouped by type */}
          {showResults &&
            GROUP_ORDER.map((type) => {
              const entries = grouped.get(type);
              if (!entries?.length) return null;
              const config = TYPE_CONFIG[type];
              const GroupIcon = config.icon;

              return (
                <CommandGroup
                  key={type}
                  heading={
                    <span className="flex items-center gap-1.5">
                      <GroupIcon className="size-3.5" />
                      {config.label}
                    </span>
                  }
                >
                  {entries.map((entry) => (
                    <CommandItem
                      key={entry.href}
                      value={entry.href}
                      onSelect={() => handleSelect(entry)}
                      className="group cursor-pointer transition-colors hover:bg-[rgba(255,107,44,0.06)]"
                    >
                      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-text-primary">
                          {entry.title}
                        </span>
                        <span className="truncate text-xs text-text-secondary">
                          {entry.subtitle}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none ${config.badgeColor}`}
                      >
                        {config.label}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
        </CommandList>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-3 py-2 text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[rgba(255,255,255,0.08)] bg-surface-2 px-1 py-0.5 text-[10px]">
                &uarr;&darr;
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[rgba(255,255,255,0.08)] bg-surface-2 px-1 py-0.5 text-[10px]">
                &crarr;
              </kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[rgba(255,255,255,0.08)] bg-surface-2 px-1 py-0.5 text-[10px]">
              esc
            </kbd>
            close
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
