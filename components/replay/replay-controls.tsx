"use client";

import { Play, Pause, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReplayControlsProps {
  playing: boolean;
  speed: number;
  currentLap: number;
  totalLaps: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onSeek: (lap: number) => void;
  onRestart: () => void;
}

// ---------------------------------------------------------------------------
// Speed options
// ---------------------------------------------------------------------------

const SPEED_OPTIONS = [1, 2, 4, 8];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplayControls({
  playing,
  speed,
  currentLap,
  totalLaps,
  onTogglePlay,
  onSetSpeed,
  onSeek,
  onRestart,
}: ReplayControlsProps) {
  const progress = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const lap = Math.max(1, Math.round(pct * totalLaps));
    onSeek(lap);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3">
      {/* Scrubber bar */}
      <div
        className="group relative h-2 cursor-pointer rounded-full bg-surface-3"
        onClick={handleScrubberClick}
        role="slider"
        aria-label="Race progress"
        aria-valuenow={currentLap}
        aria-valuemin={1}
        aria-valuemax={totalLaps}
        tabIndex={0}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-glow transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
          style={{ left: `${progress}%` }}
        >
          <div className="h-4 w-4 rounded-full border-2 border-glow bg-surface-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100" />
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-glow text-white transition-colors hover:bg-glow/80"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4" fill="currentColor" />
          )}
        </button>

        {/* Restart */}
        <button
          onClick={onRestart}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          aria-label="Restart"
        >
          <RotateCcw className="size-4" />
        </button>

        {/* Current lap */}
        <span className="stats-number text-sm text-text-secondary">
          Lap{" "}
          <span className="font-bold text-text-primary">{currentLap}</span>
          <span className="text-text-tertiary"> / {totalLaps}</span>
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Speed buttons */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-text-tertiary">Speed</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                speed === s
                  ? "bg-glow/15 text-glow"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
