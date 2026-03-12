"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
  color: string;
}

interface PositionChartProps {
  selectedDrivers: SelectedDriver[];
  season: number;
  round: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111113] px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-text-secondary">Lap {label}</p>
      {payload
        .sort((a, b) => a.value - b.value)
        .map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="stats-number font-medium text-text-primary">
              P{entry.value}
            </span>
          </div>
        ))}
    </div>
  );
}

export function PositionChart({
  selectedDrivers,
  season,
  round,
}: PositionChartProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/telemetry/${season}/${round}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setTelemetry(data as TelemetryData);
    } catch {
      setError("No telemetry data available.");
      setTelemetry(null);
    } finally {
      setLoading(false);
    }
  }, [season, round]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const chartData = [];
  if (telemetry) {
    for (let lap = 1; lap <= telemetry.totalLaps; lap++) {
      const point: Record<string, number | string | null> = { lap };
      for (const driver of selectedDrivers) {
        const driverTelemetry = telemetry.drivers[driver.slug];
        if (driverTelemetry) {
          const lapData = driverTelemetry.laps.find((l) => l.lap === lap);
          if (lapData) {
            point[driver.name] = lapData.position;
          }
        }
      }
      chartData.push(point);
    }
  }

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-text-secondary">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-text-tertiary">
        {error}
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="lap"
            tick={{ fill: "#5C5C5E", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            label={{
              value: "Lap",
              position: "insideBottomRight",
              offset: -5,
              fill: "#5C5C5E",
              fontSize: 10,
            }}
          />
          <YAxis
            reversed
            domain={[1, 20]}
            tick={{ fill: "#5C5C5E", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickFormatter={(v: number) => `P${v}`}
            ticks={[1, 5, 10, 15, 20]}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: 11,
              color: "#EDEDEF",
              paddingTop: 4,
            }}
          />
          {selectedDrivers.map((driver) => (
            <Line
              key={driver.slug}
              type="stepAfter"
              dataKey={driver.name}
              stroke={driver.color}
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
