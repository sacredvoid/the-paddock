"use client";

import { useMemo } from "react";
import type { RaceTelemetry } from "@/lib/types";
import { getTeamColor } from "@/lib/team-colors";

interface TireStrategyProps {
  telemetry: RaceTelemetry;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#EF4444",
  MEDIUM: "#FBBF24",
  HARD: "#F5F5F5",
  INTERMEDIATE: "#34D399",
  WET: "#60A5FA",
  UNKNOWN: "#6B7280",
};

const COMPOUND_TEXT_COLORS: Record<string, string> = {
  SOFT: "#FFFFFF",
  MEDIUM: "#111113",
  HARD: "#111113",
  INTERMEDIATE: "#111113",
  WET: "#FFFFFF",
  UNKNOWN: "#FFFFFF",
};

interface StintInfo {
  compound: string;
  startLap: number;
  endLap: number;
}

interface DriverStrategy {
  driverId: string;
  abbreviation: string;
  teamId: string;
  finalPosition: number;
  stints: StintInfo[];
}

export function TireStrategy({ telemetry }: TireStrategyProps) {
  const { strategies, totalLaps } = useMemo(() => {
    const strats: DriverStrategy[] = [];

    for (const [driverId, driver] of Object.entries(telemetry.drivers)) {
      if (driver.laps.length === 0) continue;

      const stints: StintInfo[] = [];
      let currentCompound = driver.laps[0].compound;
      let currentStint = driver.laps[0].stint;
      let stintStart = driver.laps[0].lap;

      for (let i = 1; i < driver.laps.length; i++) {
        const lap = driver.laps[i];
        if (lap.stint !== currentStint || lap.compound !== currentCompound) {
          stints.push({
            compound: currentCompound,
            startLap: stintStart,
            endLap: driver.laps[i - 1].lap,
          });
          currentCompound = lap.compound;
          currentStint = lap.stint;
          stintStart = lap.lap;
        }
      }
      // Push final stint
      stints.push({
        compound: currentCompound,
        startLap: stintStart,
        endLap: driver.laps[driver.laps.length - 1].lap,
      });

      const finalPos =
        driver.laps[driver.laps.length - 1]?.position ?? 99;

      strats.push({
        driverId,
        abbreviation: driver.abbreviation,
        teamId: driver.teamId,
        finalPosition: finalPos,
        stints,
      });
    }

    strats.sort((a, b) => a.finalPosition - b.finalPosition);

    return { strategies: strats, totalLaps: telemetry.totalLaps };
  }, [telemetry]);

  // Generate lap scale markers
  const lapMarkers = useMemo(() => {
    const step = totalLaps <= 30 ? 5 : totalLaps <= 50 ? 10 : 10;
    const markers: number[] = [1];
    for (let l = step; l < totalLaps; l += step) {
      markers.push(l);
    }
    markers.push(totalLaps);
    return markers;
  }, [totalLaps]);

  const ROW_HEIGHT = 28;
  const LEFT_PANEL = 80;
  const RIGHT_PADDING = 16;

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 600 }}>
        {/* Lap scale header */}
        <div
          className="relative mb-1 flex items-center"
          style={{ paddingLeft: LEFT_PANEL, paddingRight: RIGHT_PADDING }}
        >
          <div className="relative h-5 w-full">
            {lapMarkers.map((lap) => (
              <span
                key={lap}
                className="stats-number absolute -translate-x-1/2 text-[10px] text-text-secondary"
                style={{ left: `${((lap - 1) / (totalLaps - 1)) * 100}%` }}
              >
                {lap}
              </span>
            ))}
          </div>
        </div>

        {/* Driver rows */}
        {strategies.map((strat) => (
          <div
            key={strat.driverId}
            className="flex items-center"
            style={{ height: ROW_HEIGHT }}
          >
            {/* Driver label */}
            <div
              className="flex shrink-0 items-center gap-2"
              style={{ width: LEFT_PANEL }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getTeamColor(strat.teamId) }}
              />
              <span className="stats-number text-xs font-medium text-text-primary">
                {strat.abbreviation}
              </span>
              <span className="stats-number text-[10px] text-text-secondary">
                P{strat.finalPosition}
              </span>
            </div>

            {/* Stint bars */}
            <div
              className="relative flex-1"
              style={{ paddingRight: RIGHT_PADDING }}
            >
              <div className="relative h-5 w-full">
                {strat.stints.map((stint, idx) => {
                  const left =
                    ((stint.startLap - 1) / (totalLaps - 1)) * 100;
                  const right =
                    ((stint.endLap - 1) / (totalLaps - 1)) * 100;
                  const width = right - left;
                  const bgColor =
                    COMPOUND_COLORS[stint.compound] ??
                    COMPOUND_COLORS.UNKNOWN;
                  const textColor =
                    COMPOUND_TEXT_COLORS[stint.compound] ??
                    COMPOUND_TEXT_COLORS.UNKNOWN;
                  const stintLaps = stint.endLap - stint.startLap + 1;

                  return (
                    <div
                      key={idx}
                      className="absolute top-0 flex h-full items-center justify-center rounded-sm text-[9px] font-bold"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 0.5)}%`,
                        backgroundColor: bgColor,
                        color: textColor,
                        borderLeft: idx > 0 ? "2px solid #09090B" : "none",
                      }}
                      title={`${stint.compound} - Laps ${stint.startLap} to ${stint.endLap} (${stintLaps} laps)`}
                    >
                      {width > 4 && (
                        <span className="truncate px-1">
                          {stint.compound.charAt(0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Compound legend */}
        <div
          className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary"
          style={{ paddingLeft: LEFT_PANEL }}
        >
          {Object.entries(COMPOUND_COLORS)
            .filter(([key]) => key !== "UNKNOWN")
            .map(([compound, color]) => (
              <span key={compound} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-6 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                {compound.charAt(0) + compound.slice(1).toLowerCase()}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
