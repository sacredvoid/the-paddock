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
  ReferenceArea,
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

interface RaceOption {
  round: number;
  name: string;
}

interface SelectedDriver {
  slug: string;
  name: string;
  color: string;
}

interface LapTimeChartProps {
  selectedDrivers: SelectedDriver[];
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#EF4444",
  MEDIUM: "#EAB308",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#22C55E",
  WET: "#3B82F6",
};

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
    payload: Record<string, unknown>;
  }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111113] px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-text-secondary">Lap {label}</p>
      {payload.map((entry) => {
        const compound = entry.payload[`${entry.name}_compound`] as string;
        return (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary">{entry.name}:</span>
            <span className="stats-number font-medium text-text-primary">
              {(entry.value / 1000).toFixed(3)}s
            </span>
            {compound && (
              <span
                className="rounded px-1 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor:
                    (COMPOUND_COLORS[compound] || "#888") + "22",
                  color: COMPOUND_COLORS[compound] || "#888",
                }}
              >
                {compound}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LapTimeChart({ selectedDrivers }: LapTimeChartProps) {
  const [season, setSeason] = useState(2024);
  const [round, setRound] = useState(1);
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load race list for selected season
  useEffect(() => {
    let cancelled = false;
    async function loadRaces() {
      try {
        const res = await fetch(`/api/seasons/${season}`);
        if (!res.ok) throw new Error("Failed to load season");
        const data = await res.json();
        if (cancelled) return;
        setRaces(data.races || []);
        setRound(1);
      } catch {
        if (!cancelled) setRaces([]);
      }
    }
    loadRaces();
    return () => {
      cancelled = true;
    };
  }, [season]);

  // Load telemetry for selected race
  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/telemetry/${season}/${round}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setTelemetry(data as TelemetryData);
    } catch {
      setError("No telemetry data available for this race.");
      setTelemetry(null);
    } finally {
      setLoading(false);
    }
  }, [season, round]);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  // Build chart data
  const chartData = [];
  const missingDrivers: string[] = [];

  if (telemetry) {
    const totalLaps = telemetry.totalLaps;
    for (let lap = 1; lap <= totalLaps; lap++) {
      const point: Record<string, number | string | null> = { lap };
      for (const driver of selectedDrivers) {
        const driverTelemetry = telemetry.drivers[driver.slug];
        if (driverTelemetry) {
          const lapData = driverTelemetry.laps.find((l) => l.lap === lap);
          if (lapData) {
            point[driver.name] = lapData.timeMs;
            point[`${driver.name}_compound`] = lapData.compound;
          }
        }
      }
      chartData.push(point);
    }

    // Check which selected drivers are missing from telemetry
    for (const driver of selectedDrivers) {
      if (!telemetry.drivers[driver.slug]) {
        missingDrivers.push(driver.name);
      }
    }
  }

  // Compute Y axis domain
  let yMin = 80000;
  let yMax = 100000;
  if (chartData.length > 0) {
    const allTimes: number[] = [];
    for (const point of chartData) {
      for (const driver of selectedDrivers) {
        const val = point[driver.name];
        if (typeof val === "number") {
          allTimes.push(val);
        }
      }
    }
    if (allTimes.length > 0) {
      allTimes.sort((a, b) => a - b);
      const p5 = allTimes[Math.floor(allTimes.length * 0.05)];
      const p95 = allTimes[Math.floor(allTimes.length * 0.95)];
      yMin = Math.floor(p5 / 1000) * 1000 - 1000;
      yMax = Math.ceil(p95 / 1000) * 1000 + 1000;
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="rounded-md border border-[rgba(255,255,255,0.1)] bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-glow"
          >
            {[2025, 2024, 2023].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary">Race</label>
          <select
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
            className="rounded-md border border-[rgba(255,255,255,0.1)] bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-glow"
          >
            {races.map((r) => (
              <option key={r.round} value={r.round}>
                R{r.round} - {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Missing drivers note */}
      {missingDrivers.length > 0 && (
        <p className="mb-2 text-xs text-text-tertiary">
          {missingDrivers.join(", ")} did not participate in this race.
        </p>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
          Loading telemetry...
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
          {error}
        </div>
      ) : (
        <div className="h-72">
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
                domain={[yMin, yMax]}
                tick={{ fill: "#5C5C5E", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}s`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  color: "#EDEDEF",
                  paddingTop: 4,
                }}
              />

              {/* Safety car zones */}
              {telemetry?.safetyCars.map((sc, i) => (
                <ReferenceArea
                  key={i}
                  x1={sc.startLap}
                  x2={sc.endLap}
                  fill="#EAB308"
                  fillOpacity={0.08}
                  stroke="#EAB308"
                  strokeOpacity={0.2}
                />
              ))}

              {selectedDrivers.map((driver) => (
                <Line
                  key={driver.slug}
                  type="monotone"
                  dataKey={driver.name}
                  stroke={driver.color}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
