"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { RaceTelemetry, SafetyCar } from "@/lib/types";
import { getTeamColor } from "@/lib/team-colors";

interface GapChartProps {
  telemetry: RaceTelemetry;
}

interface GapPoint {
  lap: number;
  [driverId: string]: number | undefined;
}

const SC_COLORS: Record<string, string> = {
  SC: "rgba(251, 191, 36, 0.15)",
  VSC: "rgba(255, 107, 44, 0.12)",
  RED: "rgba(239, 68, 68, 0.15)",
};

export function GapChart({ telemetry }: GapChartProps) {
  // Determine top finishers for the default selection
  const allDriverEntries = useMemo(() => {
    return Object.entries(telemetry.drivers)
      .map(([driverId, driver]) => {
        const lastLap =
          driver.laps.length > 0
            ? driver.laps[driver.laps.length - 1]
            : null;
        return {
          driverId,
          abbreviation: driver.abbreviation,
          teamId: driver.teamId,
          color: getTeamColor(driver.teamId),
          finalPosition: lastLap?.position ?? 99,
        };
      })
      .sort((a, b) => a.finalPosition - b.finalPosition);
  }, [telemetry]);

  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(() => {
    return new Set(allDriverEntries.slice(0, 8).map((d) => d.driverId));
  });

  const chartData = useMemo(() => {
    // Find the leader's cumulative time for each lap
    // Gap = (driver cumulative time) - (leader cumulative time) for each lap

    // Build cumulative times for each driver
    const cumulativeTimes: Record<string, Record<number, number>> = {};

    for (const [driverId, driver] of Object.entries(telemetry.drivers)) {
      cumulativeTimes[driverId] = {};
      let cumTime = 0;
      for (const lap of driver.laps) {
        if (lap.timeMs > 0) {
          cumTime += lap.timeMs;
          cumulativeTimes[driverId][lap.lap] = cumTime;
        }
      }
    }

    // For each lap, find the leader (P1) and compute gap for each driver
    const data: GapPoint[] = [];

    for (let lap = 1; lap <= telemetry.totalLaps; lap++) {
      const point: GapPoint = { lap };

      // Find the P1 driver for this lap
      let leaderTime: number | null = null;
      for (const [driverId, driver] of Object.entries(telemetry.drivers)) {
        const lapData = driver.laps.find((l) => l.lap === lap);
        if (
          lapData?.position === 1 &&
          cumulativeTimes[driverId]?.[lap] != null
        ) {
          leaderTime = cumulativeTimes[driverId][lap];
          break;
        }
      }

      if (leaderTime == null) continue;

      for (const driverId of selectedDrivers) {
        const driverCum = cumulativeTimes[driverId]?.[lap];
        if (driverCum != null) {
          // Gap in seconds
          const gapSec = (driverCum - leaderTime) / 1000;
          point[driverId] = Math.max(0, parseFloat(gapSec.toFixed(1)));
        }
      }

      data.push(point);
    }

    return data;
  }, [telemetry, selectedDrivers]);

  const toggleDriver = (driverId: string) => {
    setSelectedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) {
        next.delete(driverId);
      } else {
        next.add(driverId);
      }
      return next;
    });
  };

  const maxGap = useMemo(() => {
    let max = 0;
    for (const point of chartData) {
      for (const driverId of selectedDrivers) {
        const val = point[driverId];
        if (val != null && typeof val === "number" && val > max) {
          max = val;
        }
      }
    }
    // Cap at reasonable value to avoid extreme outliers
    return Math.min(max, 120);
  }, [chartData, selectedDrivers]);

  return (
    <div className="w-full">
      {/* Driver selection */}
      <div className="mb-4 flex flex-wrap gap-2">
        {allDriverEntries.map(({ driverId, abbreviation, color }) => (
          <button
            key={driverId}
            onClick={() => toggleDriver(driverId)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-opacity ${
              selectedDrivers.has(driverId) ? "opacity-100" : "opacity-30"
            }`}
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="stats-number text-text-primary">
              {abbreviation}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="lap"
              tick={{ fill: "#8B8B8D", fontSize: 11 }}
              tickLine={{ stroke: "rgba(255,255,255,0.06)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              label={{
                value: "Lap",
                position: "insideBottomRight",
                offset: -5,
                fill: "#8B8B8D",
                fontSize: 11,
              }}
            />
            <YAxis
              domain={[0, maxGap > 0 ? maxGap : 30]}
              tick={{ fill: "#8B8B8D", fontSize: 11 }}
              tickLine={{ stroke: "rgba(255,255,255,0.06)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              label={{
                value: "Gap to leader (s)",
                angle: -90,
                position: "insideLeft",
                fill: "#8B8B8D",
                fontSize: 11,
              }}
              tickFormatter={(v: number) => `${v}s`}
            />
            <Tooltip
              content={<GapTooltip drivers={telemetry.drivers} />}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            />

            {/* Safety car bands */}
            {telemetry.safetyCars.map((sc: SafetyCar, i: number) => (
              <ReferenceArea
                key={`sc-${i}`}
                x1={sc.startLap}
                x2={sc.endLap}
                fill={SC_COLORS[sc.type] || SC_COLORS.SC}
                stroke="none"
              />
            ))}

            {/* Driver lines */}
            {allDriverEntries
              .filter(({ driverId }) => selectedDrivers.has(driverId))
              .map(({ driverId, color }) => (
                <Line
                  key={driverId}
                  dataKey={driverId}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GapTooltip({
  active,
  payload,
  label,
  drivers,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: number;
  drivers: RaceTelemetry["drivers"];
}) {
  if (!active || !payload || !label) return null;

  const sorted = [...payload]
    .filter((p) => p.value != null)
    .sort((a, b) => a.value - b.value);

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        backgroundColor: "#111113",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <p className="mb-2 text-xs font-medium text-text-secondary">
        Lap {label}
      </p>
      <div className="space-y-1">
        {sorted.map((entry) => {
          const driver = drivers[entry.dataKey];
          return (
            <div
              key={entry.dataKey}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-primary">
                {driver?.abbreviation ?? entry.dataKey}
              </span>
              <span className="stats-number ml-auto font-medium text-text-primary">
                {entry.value === 0 ? "Leader" : `+${entry.value}s`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
