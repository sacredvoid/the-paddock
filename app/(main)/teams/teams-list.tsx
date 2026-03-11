"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flag, Search } from "lucide-react";
import type { Team } from "@/lib/types";

interface TeamsListProps {
  teams: Team[];
  logoUrls: Record<string, string | null>;
}

type FilterMode = "all" | "active" | "historic";

export function TeamsList({ teams, logoUrls }: TeamsListProps) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = teams;

    if (filter === "active") {
      result = result.filter((t) => t.isActive);
    } else if (filter === "historic") {
      result = result.filter((t) => !t.isActive);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nationality.toLowerCase().includes(q)
      );
    }

    // Active teams first, then sorted by championships descending
    return [...result].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      const aChamps = a.stats?.championships ?? 0;
      const bChamps = b.stats?.championships ?? 0;
      return bChamps - aChamps;
    });
  }, [teams, filter, search]);

  const activeCount = teams.filter((t) => t.isActive).length;
  const historicCount = teams.filter((t) => !t.isActive).length;

  const filterButtons: { mode: FilterMode; label: string; count: number }[] = [
    { mode: "all", label: "All", count: teams.length },
    { mode: "active", label: "Active", count: activeCount },
    { mode: "historic", label: "Historic", count: historicCount },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {filterButtons.map(({ mode, label, count }) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === mode
                  ? "bg-f1-red text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
              <span className="ml-1.5 stats-number text-xs opacity-70">
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-f1-red sm:w-64"
          />
        </div>
      </div>

      {/* Teams grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-6 py-16 text-center">
          <p className="text-text-secondary">
            No teams found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              logoUrl={logoUrls[team.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team,
  logoUrl,
}: {
  team: Team;
  logoUrl: string | null;
}) {
  const color = team.color || "#888888";
  const stats = team.stats;
  const yearsActive = stats
    ? `${stats.firstEntry}-${stats.lastEntry}`
    : "N/A";

  return (
    <Link href={`/teams/${team.slug}`} className="block">
      <Card
        className="border-border-subtle bg-surface transition-transform duration-200 hover:-translate-y-0.5"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <CardContent className="flex flex-col gap-3">
          {/* Header row: name + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {/* Team logo or color fallback */}
              {logoUrl ? (
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 p-1.5">
                  <Image
                    src={logoUrl}
                    alt={`${team.name} logo`}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h3
                  className="text-lg font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  {team.name}
                </h3>
                <span className="text-sm text-text-secondary">
                  {team.nationality}
                </span>
              </div>
            </div>
            {team.isActive ? (
              <Badge
                variant="outline"
                className="shrink-0 border-accent/30 text-accent"
              >
                Active
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 border-border-subtle text-text-secondary"
              >
                Historic
              </Badge>
            )}
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 border-t border-border-subtle pt-3">
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary">
                  Championships
                </span>
                <span className="stats-number text-lg font-bold text-text-primary flex items-center gap-1">
                  {stats.championships > 0 && (
                    <Trophy className="size-3.5 text-f1-red" />
                  )}
                  {stats.championships}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary">Wins</span>
                <span className="stats-number text-lg font-bold text-text-primary">
                  {stats.wins}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary">Races</span>
                <span className="stats-number text-lg font-bold text-text-primary">
                  {stats.races}
                </span>
              </div>
            </div>
          )}

          {/* Years active */}
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Flag className="size-3.5" />
            <span>{yearsActive}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
