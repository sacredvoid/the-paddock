"use client";

import type { PredictionOutput } from "@/lib/prediction";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PredictionResultsProps {
  predictions: PredictionOutput[];
  teamColors: Record<string, string>;
  gridPositions: Record<string, number>; // driverId -> grid position
}

// ---------------------------------------------------------------------------
// Position change indicator
// ---------------------------------------------------------------------------

function PositionDelta({
  grid,
  predicted,
}: {
  grid: number;
  predicted: number;
}) {
  const delta = grid - predicted; // positive = gained positions

  if (delta === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-text-tertiary">
        <Minus className="size-3" />
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-success">
        <ArrowUp className="size-3" />
        {delta}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5 text-xs text-danger">
      <ArrowDown className="size-3" />
      {Math.abs(delta)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Probability bar
// ---------------------------------------------------------------------------

function ProbBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-right text-[10px] uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="stats-number w-9 text-right text-xs text-text-secondary">
        {value}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PredictionResults({
  predictions,
  teamColors,
  gridPositions,
}: PredictionResultsProps) {
  const sorted = [...predictions].sort(
    (a, b) => a.predictedPosition - b.predictedPosition
  );

  return (
    <div className="space-y-2">
      {sorted.map((pred, idx) => {
        const teamColor = teamColors[pred.teamId] ?? "#8B8B8D";
        const grid = gridPositions[pred.driverId];

        return (
          <div
            key={pred.driverId}
            className="group flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-3 transition-colors hover:border-[rgba(255,255,255,0.10)]"
          >
            {/* Position number */}
            <div className="flex w-8 shrink-0 flex-col items-center gap-0.5">
              <span
                className={`stats-number text-lg font-bold ${
                  idx === 0
                    ? "text-glow"
                    : idx < 3
                      ? "text-text-primary"
                      : "text-text-secondary"
                }`}
              >
                P{pred.predictedPosition}
              </span>
              {grid != null && (
                <PositionDelta grid={grid} predicted={pred.predictedPosition} />
              )}
            </div>

            {/* Driver info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {pred.driverName}
                </span>
              </div>

              {/* Probability bars */}
              <div className="space-y-1">
                <ProbBar
                  label="Win"
                  value={pred.winProbability}
                  color="#EF4444"
                />
                <ProbBar
                  label="Podium"
                  value={pred.podiumProbability}
                  color="#FBBF24"
                />
                <ProbBar
                  label="Points"
                  value={pred.pointsProbability}
                  color="#34D399"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
