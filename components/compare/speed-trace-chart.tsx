"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DetailedTelemetryDriver } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverEntry {
  driverId: string;
  label: string;
  color: string;
  data: DetailedTelemetryDriver;
}

interface SpeedTraceChartProps {
  drivers: DriverEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Merge multiple driver telemetry arrays into a single dataset keyed by distance index. */
function buildSpeedData(drivers: DriverEntry[]) {
  if (drivers.length === 0) return [];
  // Use the first driver's distance array as the shared x-axis
  const primary = drivers[0].data;
  return primary.distance.map((dist, i) => {
    const point: Record<string, number> = { distance: dist };
    for (const d of drivers) {
      point[`speed_${d.driverId}`] = d.data.speed[i] ?? 0;
    }
    return point;
  });
}

function buildThrottleBrakeData(driver: DriverEntry) {
  return driver.data.distance.map((dist, i) => ({
    distance: dist,
    throttle: driver.data.throttle[i] ?? 0,
    brake: (driver.data.brake[i] ?? 0) * 100, // normalize to 0-100
  }));
}

/** Color for each gear (1-8). */
const GEAR_COLORS: Record<number, string> = {
  0: "#444444",
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#22C55E",
  5: "#14B8A6",
  6: "#3B82F6",
  7: "#8B5CF6",
  8: "#EC4899",
};

function formatDistance(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}km`;
  return `${Math.round(value)}m`;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
  payload: Record<string, number>;
}

function SpeedTooltip({
  active,
  payload,
  drivers,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
  drivers: DriverEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dist = payload[0]?.payload?.distance ?? 0;
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-text-secondary">
        {formatDistance(dist)}
      </p>
      {payload.map((entry) => {
        const driverId = entry.dataKey.replace("speed_", "");
        const driver = drivers.find((d) => d.driverId === driverId);
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-primary">
              {driver?.label ?? driverId}
            </span>
            <span className="stats-number ml-auto text-xs font-bold text-text-primary">
              {Math.round(entry.value)} km/h
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ThrottleBrakeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const dist = payload[0]?.payload?.distance ?? 0;
  const throttle = payload.find((p) => p.dataKey === "throttle")?.value ?? 0;
  const brake = payload.find((p) => p.dataKey === "brake")?.value ?? 0;
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-text-secondary">
        {formatDistance(dist)}
      </p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-[#34D399]" />
        <span className="text-xs text-text-primary">Throttle</span>
        <span className="stats-number ml-auto text-xs font-bold text-text-primary">
          {Math.round(throttle)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
        <span className="text-xs text-text-primary">Brake</span>
        <span className="stats-number ml-auto text-xs font-bold text-text-primary">
          {Math.round(brake)}%
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gear Strip
// ---------------------------------------------------------------------------

function GearStrip({ driver }: { driver: DriverEntry }) {
  const segments = useMemo(() => {
    const gears = driver.data.gear;
    const distances = driver.data.distance;
    if (gears.length === 0) return [];

    const segs: { gear: number; startPct: number; widthPct: number }[] = [];
    const totalDist = distances[distances.length - 1] - distances[0];
    let segStart = 0;
    let currentGear = gears[0];

    for (let i = 1; i < gears.length; i++) {
      if (gears[i] !== currentGear || i === gears.length - 1) {
        const endIdx = i === gears.length - 1 ? i : i - 1;
        const startPct =
          ((distances[segStart] - distances[0]) / totalDist) * 100;
        const widthPct =
          ((distances[endIdx] - distances[segStart]) / totalDist) * 100;
        segs.push({ gear: currentGear, startPct, widthPct });
        segStart = i;
        currentGear = gears[i];
      }
    }
    return segs;
  }, [driver]);

  return (
    <div className="flex h-5 w-full overflow-hidden rounded" role="img" aria-label={`Gear map for ${driver.label}`}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className="relative flex items-center justify-center text-[9px] font-bold text-white/80"
          style={{
            width: `${seg.widthPct}%`,
            backgroundColor: GEAR_COLORS[seg.gear] ?? "#444",
            minWidth: seg.widthPct > 2 ? undefined : "2px",
          }}
        >
          {seg.widthPct > 3 && seg.gear}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SpeedTraceChart({ drivers }: SpeedTraceChartProps) {
  const [activeThrottleDriver, setActiveThrottleDriver] = useState(0);

  const speedData = useMemo(() => buildSpeedData(drivers), [drivers]);
  const throttleBrakeData = useMemo(
    () =>
      drivers[activeThrottleDriver]
        ? buildThrottleBrakeData(drivers[activeThrottleDriver])
        : [],
    [drivers, activeThrottleDriver]
  );
  if (drivers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1">
        <p className="text-sm text-text-secondary">
          Select drivers to view speed traces
        </p>
      </div>
    );
  }

  // Compute axis domain for speed
  const allSpeeds = drivers.flatMap((d) => d.data.speed);
  const minSpeed = Math.max(0, Math.floor((Math.min(...allSpeeds) - 10) / 10) * 10);
  const maxSpeed = Math.ceil((Math.max(...allSpeeds) + 10) / 10) * 10;

  // Get max distance for x-axis
  const maxDistance = Math.max(...drivers.map((d) => d.data.distance[d.data.distance.length - 1]));

  return (
    <div className="space-y-1">
      {/* Panel 1: Speed Trace */}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">
            Speed Trace
          </h4>
          <span className="text-xs text-text-secondary">km/h</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={speedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, maxDistance]}
              tickFormatter={formatDistance}
              tick={{ fill: "#8B8B8D", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              tickCount={8}
            />
            <YAxis
              domain={[minSpeed, maxSpeed]}
              tick={{ fill: "#8B8B8D", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              content={
                <SpeedTooltip drivers={drivers} />
              }
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              formatter={(value: string) => {
                const driverId = value.replace("speed_", "");
                const driver = drivers.find((d) => d.driverId === driverId);
                return (
                  <span className="text-xs text-text-primary">
                    {driver?.label ?? driverId}
                  </span>
                );
              }}
            />
            {drivers.map((d) => (
              <Line
                key={d.driverId}
                type="monotone"
                dataKey={`speed_${d.driverId}`}
                stroke={d.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Panel 2: Throttle / Brake */}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium text-text-primary">
            Throttle &amp; Brake
          </h4>
          <div className="ml-auto flex gap-1">
            {drivers.map((d, idx) => (
              <button
                key={d.driverId}
                onClick={() => setActiveThrottleDriver(idx)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  idx === activeThrottleDriver
                    ? "text-white"
                    : "bg-surface-2 text-text-secondary hover:text-text-primary"
                }`}
                style={
                  idx === activeThrottleDriver
                    ? { backgroundColor: d.color }
                    : undefined
                }
              >
                {d.data.abbreviation}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={throttleBrakeData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, maxDistance]}
              tickFormatter={formatDistance}
              tick={{ fill: "#8B8B8D", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              tickCount={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#8B8B8D", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              content={<ThrottleBrakeTooltip />}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Area
              type="monotone"
              dataKey="throttle"
              stroke="#34D399"
              fill="rgba(52, 211, 153, 0.15)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="brake"
              stroke="#EF4444"
              fill="rgba(239, 68, 68, 0.15)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Panel 3: Gear Strip */}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-text-primary">Gear</h4>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <div key={g} className="flex items-center gap-0.5">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ backgroundColor: GEAR_COLORS[g] }}
                />
                <span className="stats-number text-[10px] text-text-secondary">
                  {g}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {drivers.map((d) => (
            <div key={d.driverId} className="flex items-center gap-2">
              <span
                className="w-10 shrink-0 text-right text-xs font-medium"
                style={{ color: d.color }}
              >
                {d.data.abbreviation}
              </span>
              <GearStrip driver={d} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
