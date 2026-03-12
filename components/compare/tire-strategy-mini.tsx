"use client";

import { useState, useEffect, useCallback } from "react";

interface TelemetryLap {
  lap: number;
  position: number;
  time: string;
  timeMs: number;
  compound: string;
  stint: number;
}

interface TelemetryDriver {
  abbreviation: string;
  teamId: string;
  laps: TelemetryLap[];
}

interface TelemetryData {
  year: number;
  round: number;
  raceName: string;
  circuitId: string;
  totalLaps: number;
  drivers: Record<string, TelemetryDriver>;
  pitStops: Array<{
    driverId: string;
    lap: number;
    stop: number;
    duration: string;
    time: string;
  }>;
  safetyCars: Array<{
    type: string;
    startLap: number;
    endLap: number;
  }>;
}

interface SelectedDriver {
  slug: string;
  name: string;
  abbreviation: string;
  color: string;
}

interface TireStrategyMiniProps {
  selectedDrivers: SelectedDriver[];
  season: number;
  round: number;
}

const COMPOUND_COLORS: Record<string, { bg: string; text: string }> = {
  SOFT: { bg: "#EF4444", text: "#FFF" },
  MEDIUM: { bg: "#EAB308", text: "#000" },
  HARD: { bg: "#E5E5E5", text: "#000" },
  INTERMEDIATE: { bg: "#22C55E", text: "#000" },
  WET: { bg: "#3B82F6", text: "#FFF" },
};

interface Stint {
  compound: string;
  startLap: number;
  endLap: number;
}

function extractStints(laps: TelemetryLap[]): Stint[] {
  if (laps.length === 0) return [];

  const stints: Stint[] = [];
  let currentCompound = laps[0].compound;
  let startLap = laps[0].lap;

  for (let i = 1; i < laps.length; i++) {
    if (laps[i].compound !== currentCompound) {
      stints.push({
        compound: currentCompound,
        startLap,
        endLap: laps[i - 1].lap,
      });
      currentCompound = laps[i].compound;
      startLap = laps[i].lap;
    }
  }
  stints.push({
    compound: currentCompound,
    startLap,
    endLap: laps[laps.length - 1].lap,
  });

  return stints;
}

export function TireStrategyMini({
  selectedDrivers,
  season,
  round,
}: TireStrategyMiniProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/telemetry/${season}/${round}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setTelemetry(data as TelemetryData);
    } catch {
      setTelemetry(null);
    } finally {
      setLoading(false);
    }
  }, [season, round]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-secondary">
        Loading...
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
        No strategy data available.
      </div>
    );
  }

  const totalLaps = telemetry.totalLaps;

  // Lap scale ticks
  const ticks = [];
  const step = Math.ceil(totalLaps / 6);
  for (let i = 0; i <= totalLaps; i += step) {
    ticks.push(i || 1);
  }
  if (ticks[ticks.length - 1] !== totalLaps) {
    ticks.push(totalLaps);
  }

  return (
    <div>
      {/* Strategy bars */}
      <div className="space-y-2">
        {selectedDrivers.map((driver) => {
          const driverData = telemetry.drivers[driver.slug];
          if (!driverData) {
            return (
              <div
                key={driver.slug}
                className="flex items-center gap-2 text-xs text-text-tertiary"
              >
                <span
                  className="w-10 shrink-0 text-right font-medium"
                  style={{ color: driver.color }}
                >
                  {driver.abbreviation}
                </span>
                <span>No data</span>
              </div>
            );
          }

          const stints = extractStints(driverData.laps);

          return (
            <div key={driver.slug} className="flex items-center gap-2">
              <span
                className="w-10 shrink-0 text-right text-xs font-medium"
                style={{ color: driver.color }}
              >
                {driverData.abbreviation}
              </span>
              <div className="relative flex h-6 flex-1 overflow-hidden rounded">
                {stints.map((stint, i) => {
                  const width =
                    ((stint.endLap - stint.startLap + 1) / totalLaps) * 100;
                  const colors = COMPOUND_COLORS[stint.compound] || {
                    bg: "#666",
                    text: "#FFF",
                  };

                  return (
                    <div
                      key={i}
                      className="relative flex items-center justify-center text-[9px] font-bold"
                      style={{
                        width: `${width}%`,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                      title={`${stint.compound}: Lap ${stint.startLap}-${stint.endLap}`}
                    >
                      {width > 8 && (
                        <span className="truncate px-0.5">
                          {stint.compound.charAt(0)}
                          <span className="ml-0.5 text-[8px] opacity-80">
                            {stint.endLap - stint.startLap + 1}L
                          </span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lap scale */}
      <div className="mt-1 flex items-center gap-2">
        <span className="w-10 shrink-0" />
        <div className="relative flex-1">
          <div className="flex justify-between text-[9px] text-text-tertiary">
            {ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Compound legend */}
      <div className="mt-2 flex gap-3">
        {Object.entries(COMPOUND_COLORS)
          .slice(0, 3)
          .map(([name, colors]) => (
            <div key={name} className="flex items-center gap-1 text-[10px]">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: colors.bg }}
              />
              <span className="text-text-tertiary">{name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
