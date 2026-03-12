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

interface LapChartProps {
  telemetry: RaceTelemetry;
}

interface LapPositionPoint {
  lap: number;
  [driverId: string]: number | string | undefined;
}

const SC_COLORS: Record<string, string> = {
  SC: "rgba(251, 191, 36, 0.15)",
  VSC: "rgba(255, 107, 44, 0.12)",
  RED: "rgba(239, 68, 68, 0.15)",
};

export function LapChart({ telemetry }: LapChartProps) {
  const [hiddenDrivers, setHiddenDrivers] = useState<Set<string>>(new Set());

  const { chartData, driverEntries, maxPosition } = useMemo(() => {
    const entries = Object.entries(telemetry.drivers).map(
      ([driverId, driver]) => ({
        driverId,
        abbreviation: driver.abbreviation,
        teamId: driver.teamId,
        color: getTeamColor(driver.teamId),
      })
    );

    // Sort by final position (last lap position)
    entries.sort((a, b) => {
      const aLaps = telemetry.drivers[a.driverId].laps;
      const bLaps = telemetry.drivers[b.driverId].laps;
      const aPos = aLaps.length > 0 ? aLaps[aLaps.length - 1].position : 99;
      const bPos = bLaps.length > 0 ? bLaps[bLaps.length - 1].position : 99;
      return aPos - bPos;
    });

    // Build chart data: one point per lap
    const data: LapPositionPoint[] = [];
    let maxPos = 0;

    for (let lap = 1; lap <= telemetry.totalLaps; lap++) {
      const point: LapPositionPoint = { lap };
      for (const { driverId } of entries) {
        const driverData = telemetry.drivers[driverId];
        const lapData = driverData.laps.find((l) => l.lap === lap);
        if (lapData && lapData.position > 0) {
          point[driverId] = lapData.position;
          if (lapData.position > maxPos) maxPos = lapData.position;
        }
      }
      data.push(point);
    }

    return { chartData: data, driverEntries: entries, maxPosition: maxPos };
  }, [telemetry]);

  const toggleDriver = (driverId: string) => {
    setHiddenDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) {
        next.delete(driverId);
      } else {
        next.add(driverId);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* Driver legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {driverEntries.map(({ driverId, abbreviation, color }) => (
          <button
            key={driverId}
            onClick={() => toggleDriver(driverId)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-opacity ${
              hiddenDrivers.has(driverId)
                ? "opacity-30"
                : "opacity-100"
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
      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
              reversed
              domain={[1, maxPosition || 20]}
              tick={{ fill: "#8B8B8D", fontSize: 11 }}
              tickLine={{ stroke: "rgba(255,255,255,0.06)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              label={{
                value: "Position",
                angle: -90,
                position: "insideLeft",
                fill: "#8B8B8D",
                fontSize: 11,
              }}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip drivers={telemetry.drivers} />}
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
            {driverEntries.map(({ driverId, color }) => (
              <Line
                key={driverId}
                dataKey={driverId}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls
                hide={hiddenDrivers.has(driverId)}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Safety car legend */}
      {telemetry.safetyCars.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
          {telemetry.safetyCars.some((sc) => sc.type === "SC") && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: SC_COLORS.SC }} />
              Safety Car
            </span>
          )}
          {telemetry.safetyCars.some((sc) => sc.type === "VSC") && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: SC_COLORS.VSC }} />
              Virtual Safety Car
            </span>
          )}
          {telemetry.safetyCars.some((sc) => sc.type === "RED") && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-6 rounded" style={{ backgroundColor: SC_COLORS.RED }} />
              Red Flag
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CustomTooltip({
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

  // Sort by position
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
        {sorted.slice(0, 10).map((entry) => {
          const driver = drivers[entry.dataKey];
          const lapData = driver?.laps.find((l) => l.lap === label);
          return (
            <div
              key={entry.dataKey}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="stats-number w-5 text-right font-medium text-text-primary">
                P{entry.value}
              </span>
              <span className="text-text-primary">
                {driver?.abbreviation ?? entry.dataKey}
              </span>
              {lapData?.time && (
                <span className="stats-number ml-auto text-text-secondary">
                  {lapData.time}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
