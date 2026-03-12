"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReplayCanvas } from "./replay-canvas";
import { ReplayLeaderboard } from "./replay-leaderboard";
import { ReplayControls } from "./replay-controls";
import { buildReplayFrames, interpolateFrame } from "@/lib/replay";
import type { ReplayFrame } from "@/lib/replay";
import type { RaceTelemetry } from "@/lib/types";
import { Flag } from "lucide-react";

// ---------------------------------------------------------------------------
// Telemetry years that have data
// ---------------------------------------------------------------------------

const AVAILABLE_YEARS = [2023, 2024, 2025];

// ---------------------------------------------------------------------------
// Types for lightweight season data
// ---------------------------------------------------------------------------

interface SeasonRaceInfo {
  round: number;
  name: string;
  circuitId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const initialYear = Number(searchParams.get("year")) || 2024;
  const initialRound = searchParams.get("round")
    ? Number(searchParams.get("round"))
    : null;

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedRound, setSelectedRound] = useState<number | null>(
    initialRound
  );

  // Data
  const [races, setRaces] = useState<SeasonRaceInfo[]>([]);
  const [telemetry, setTelemetry] = useState<RaceTelemetry | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Replay state
  const [frames, setFrames] = useState<ReplayFrame[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Canvas container sizing
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(700);
  const canvasHeight = Math.round(canvasWidth * (5 / 7)); // maintain 7:5 ratio

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setCanvasWidth(w);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Refs for animation loop
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const currentTimeMsRef = useRef(currentTimeMs);
  const framesRef = useRef(frames);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    currentTimeMsRef.current = currentTimeMs;
  }, [currentTimeMs]);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // -------------------------------------------------------------------------
  // URL sync
  // -------------------------------------------------------------------------

  const updateUrl = useCallback(
    (year: number, round: number | null) => {
      const params = new URLSearchParams();
      params.set("year", String(year));
      if (round) params.set("round", String(round));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // -------------------------------------------------------------------------
  // Fetch season race list (including circuitId)
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    setLoadingSeason(true);
    setRaces([]);

    import(`@/data/seasons/${selectedYear}.json`)
      .then((mod) => {
        if (cancelled) return;
        const data = mod.default as {
          races: { round: number; name: string; circuitId: string }[];
        };
        const raceList: SeasonRaceInfo[] = (data.races || []).map((r) => ({
          round: r.round,
          name: r.name,
          circuitId: r.circuitId,
        }));
        setRaces(raceList);
      })
      .catch(() => {
        if (!cancelled) setRaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSeason(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // Auto-select first round if none selected
  useEffect(() => {
    if (races.length > 0 && selectedRound === null) {
      const first = races[0].round;
      setSelectedRound(first);
      updateUrl(selectedYear, first);
    }
  }, [races, selectedRound, selectedYear, updateUrl]);

  // -------------------------------------------------------------------------
  // Fetch telemetry
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedRound) {
      setTelemetry(null);
      return;
    }

    let cancelled = false;
    setLoadingTelemetry(true);

    fetch(`/api/telemetry/${selectedYear}/${selectedRound}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (!cancelled) setTelemetry(data as RaceTelemetry | null);
      })
      .catch(() => {
        if (!cancelled) setTelemetry(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTelemetry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedRound]);

  // -------------------------------------------------------------------------
  // Build replay frames when telemetry changes
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!telemetry) {
      setFrames([]);
      setCurrentTimeMs(0);
      setPlaying(false);
      return;
    }

    const built = buildReplayFrames(telemetry);
    setFrames(built);
    setCurrentTimeMs(built.length > 0 ? built[0].timestamp : 0);
    setPlaying(false);
  }, [telemetry]);

  // -------------------------------------------------------------------------
  // Animation loop (requestAnimationFrame)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const tick = (now: number) => {
      if (!playingRef.current) {
        lastTickRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTickRef.current === null) {
        lastTickRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      const f = framesRef.current;
      if (f.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Advance time. We scale real-time so ~2 seconds of wall time = 1 lap
      // at 1x speed. The average lap timestamp delta varies, so we normalize.
      const avgLapDuration =
        f.length > 1
          ? (f[f.length - 1].timestamp - f[0].timestamp) / (f.length - 1)
          : 90000;
      const msPerLapWall = 2000; // how many real-ms per lap at 1x
      const timeScale = (avgLapDuration / msPerLapWall) * speedRef.current;
      const nextTime = currentTimeMsRef.current + dt * timeScale;

      const maxTime = f[f.length - 1].timestamp;
      if (nextTime >= maxTime) {
        setCurrentTimeMs(maxTime);
        setPlaying(false);
      } else {
        setCurrentTimeMs(nextTime);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Current interpolated frame
  // -------------------------------------------------------------------------

  const currentFrame = useMemo(
    () => interpolateFrame(frames, currentTimeMs),
    [frames, currentTimeMs]
  );

  // -------------------------------------------------------------------------
  // Current race info
  // -------------------------------------------------------------------------

  const currentRace = useMemo(
    () => races.find((r) => r.round === selectedRound) ?? null,
    [races, selectedRound]
  );

  const totalLaps = telemetry?.totalLaps ?? 0;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleTogglePlay = useCallback(() => {
    // If at the end, restart first
    if (
      !playing &&
      frames.length > 0 &&
      currentTimeMs >= frames[frames.length - 1].timestamp
    ) {
      setCurrentTimeMs(frames[0].timestamp);
    }
    setPlaying((p) => !p);
    lastTickRef.current = null;
  }, [playing, frames, currentTimeMs]);

  const handleSetSpeed = useCallback((s: number) => {
    setSpeed(s);
  }, []);

  const handleSeek = useCallback(
    (lap: number) => {
      if (frames.length === 0) return;
      const targetFrame = frames.find((f) => f.lap === lap);
      if (targetFrame) {
        setCurrentTimeMs(targetFrame.timestamp);
      }
    },
    [frames]
  );

  const handleRestart = useCallback(() => {
    if (frames.length === 0) return;
    setCurrentTimeMs(frames[0].timestamp);
    setPlaying(false);
    lastTickRef.current = null;
  }, [frames]);

  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      setSelectedRound(null);
      setTelemetry(null);
      setFrames([]);
      setPlaying(false);
      updateUrl(year, null);
    },
    [updateUrl]
  );

  const handleRoundChange = useCallback(
    (round: number) => {
      setSelectedRound(round);
      setPlaying(false);
      updateUrl(selectedYear, round);
    },
    [selectedYear, updateUrl]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasData = frames.length > 0 && !loadingTelemetry;

  return (
    <div className="space-y-4">
      {/* Race selector row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Year dropdown */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary">
            Season
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-glow focus:outline-none"
          >
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Round dropdown */}
        <div className="min-w-[220px]">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-secondary">
            Race
          </label>
          <select
            value={selectedRound ?? ""}
            onChange={(e) => handleRoundChange(Number(e.target.value))}
            disabled={loadingSeason || races.length === 0}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-glow focus:outline-none disabled:opacity-50"
          >
            {races.map((r) => (
              <option key={r.round} value={r.round}>
                R{r.round} - {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Race info */}
        {currentRace && telemetry && (
          <div className="flex items-center gap-2 pb-1">
            <Flag className="size-4 text-glow" />
            <span className="text-sm font-medium text-text-primary">
              {currentRace.name}
            </span>
            <span className="text-xs text-text-tertiary">
              {totalLaps} laps
            </span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingTelemetry && (
        <div className="flex h-[500px] items-center justify-center rounded-xl border border-border bg-surface-1">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-tertiary border-t-glow" />
            <p className="text-sm text-text-secondary">
              Loading race data...
            </p>
          </div>
        </div>
      )}

      {/* No data state */}
      {!loadingTelemetry && !loadingSeason && frames.length === 0 && (
        <div className="flex h-[500px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface-1">
          <Flag className="size-8 text-text-tertiary" />
          <p className="text-text-secondary">
            {selectedRound
              ? "No telemetry data available for this race"
              : "Select a race to start the replay"}
          </p>
        </div>
      )}

      {/* Main replay area */}
      {hasData && (
        <>
          {/* Canvas + Leaderboard */}
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Canvas */}
            <div ref={canvasContainerRef} className="relative overflow-hidden">
              <ReplayCanvas
                frame={currentFrame}
                circuitId={currentRace?.circuitId ?? ""}
                width={canvasWidth}
                height={canvasHeight}
              />
            </div>

            {/* Leaderboard */}
            <div style={{ maxHeight: canvasHeight || 500 }}>
              <ReplayLeaderboard frame={currentFrame} totalLaps={totalLaps} />
            </div>
          </div>

          {/* Controls */}
          <ReplayControls
            playing={playing}
            speed={speed}
            currentLap={currentFrame.lap}
            totalLaps={totalLaps}
            onTogglePlay={handleTogglePlay}
            onSetSpeed={handleSetSpeed}
            onSeek={handleSeek}
            onRestart={handleRestart}
          />
        </>
      )}
    </div>
  );
}
