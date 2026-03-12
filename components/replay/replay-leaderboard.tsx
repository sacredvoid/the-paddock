"use client";

import type { ReplayFrame } from "@/lib/replay";

// ---------------------------------------------------------------------------
// Team colors (mirrors replay-canvas)
// ---------------------------------------------------------------------------

const TEAM_COLORS: Record<string, string> = {
  "red-bull": "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  "aston-martin": "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  haas: "#B6BABD",
  "kick-sauber": "#52E252",
  rb: "#6692FF",
};

function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId] ?? "#888888";
}

// ---------------------------------------------------------------------------
// Tire compound colors
// ---------------------------------------------------------------------------

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#F5C542",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#43B02A",
  WET: "#3B82F6",
};

function getCompoundColor(compound: string): string {
  return COMPOUND_COLORS[compound.toUpperCase()] ?? "#888888";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReplayLeaderboardProps {
  frame: ReplayFrame;
  totalLaps: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplayLeaderboard({ frame, totalLaps }: ReplayLeaderboardProps) {
  // Sort drivers by position, retired at the back
  const sortedDrivers = [...frame.drivers].sort((a, b) => {
    if (a.status === "retired" && b.status !== "retired") return 1;
    if (b.status === "retired" && a.status !== "retired") return -1;
    return a.position - b.position;
  });

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface-1 p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Standings
        </span>
        <span className="stats-number text-sm font-bold text-text-primary">
          Lap {frame.lap}
          <span className="text-text-tertiary"> / {totalLaps}</span>
        </span>
      </div>

      {/* Driver list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {sortedDrivers.map((driver) => {
          const isRetired = driver.status === "retired";
          const isPitting = driver.status === "pit";

          return (
            <div
              key={driver.id}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors ${
                isRetired
                  ? "opacity-40"
                  : isPitting
                    ? "bg-surface-2/50"
                    : ""
              }`}
            >
              {/* Position */}
              <span
                className={`stats-number w-5 text-right font-bold ${
                  isRetired ? "text-text-tertiary" : "text-text-primary"
                }`}
              >
                {isRetired ? "RET" : driver.position}
              </span>

              {/* Team color bar */}
              <div
                className="h-4 w-1 rounded-full"
                style={{ backgroundColor: getTeamColor(driver.teamId) }}
              />

              {/* Driver abbreviation */}
              <span
                className={`w-10 font-semibold ${
                  isRetired ? "text-text-tertiary" : "text-text-primary"
                }`}
              >
                {driver.abbreviation}
              </span>

              {/* Gap to leader */}
              <span className="stats-number ml-auto w-16 text-right text-text-secondary">
                {isRetired
                  ? "DNF"
                  : driver.position === 1
                    ? "LEADER"
                    : `+${driver.gapToLeader.toFixed(3)}s`}
              </span>

              {/* Tire compound indicator */}
              <div
                className="h-3 w-3 rounded-full border border-[rgba(255,255,255,0.15)]"
                style={{ backgroundColor: getCompoundColor(driver.compound) }}
                title={driver.compound}
              />

              {/* Pit stop count */}
              <span className="stats-number w-5 text-center text-text-tertiary">
                {driver.pitStops > 0 ? driver.pitStops : ""}
              </span>

              {/* Pit indicator */}
              {isPitting && (
                <span className="text-[10px] font-bold uppercase text-yellow-400">
                  PIT
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
