"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Driver, DriverStats } from "@/lib/types";
import { getAllDrivers } from "@/lib/data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadarChartProps {
  driver1: Driver;
  driver2: Driver;
  color1?: string;
  color2?: string;
}

interface RadarDataPoint {
  axis: string;
  driver1: number;
  driver2: number;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function computePercentiles(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 };
  const sorted = [...values].sort((a, b) => a - b);
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

function buildPercentileRanges() {
  const allDrivers = getAllDrivers();
  const qualified = allDrivers.filter((d) => d.stats && d.stats.races >= 50);

  const winRates = qualified.map((d) => d.stats!.winRate);
  const poleRates = qualified.map((d) => d.stats!.poles / d.stats!.races);
  const podiumRates = qualified.map((d) => d.stats!.podiumRate);
  const consistencies = qualified.map(
    (d) => 1 - d.stats!.dnfs / d.stats!.races
  );
  const pointsPerRace = qualified.map((d) => d.stats!.points / d.stats!.races);

  return {
    winRate: computePercentiles(winRates),
    poleRate: computePercentiles(poleRates),
    podiumRate: computePercentiles(podiumRates),
    consistency: computePercentiles(consistencies),
    pointsPerRace: computePercentiles(pointsPerRace),
  };
}

function getDriverRadarValues(stats: DriverStats) {
  return {
    winRate: stats.winRate,
    poleRate: stats.poles / stats.races,
    podiumRate: stats.podiumRate,
    consistency: 1 - stats.dnfs / stats.races,
    pointsPerRace: stats.points / stats.races,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComparisonRadarChart({
  driver1,
  driver2,
  color1 = "#FF6B2C",
  color2 = "#3671C6",
}: RadarChartProps) {
  const ranges = buildPercentileRanges();

  const d1Stats = driver1.stats;
  const d2Stats = driver2.stats;

  if (!d1Stats || !d2Stats) {
    return (
      <div className="flex h-64 items-center justify-center text-text-secondary">
        Stats unavailable for comparison.
      </div>
    );
  }

  const d1Vals = getDriverRadarValues(d1Stats);
  const d2Vals = getDriverRadarValues(d2Stats);

  const data: RadarDataPoint[] = [
    {
      axis: "Win Rate",
      driver1: normalize(d1Vals.winRate, ranges.winRate.min, ranges.winRate.max),
      driver2: normalize(d2Vals.winRate, ranges.winRate.min, ranges.winRate.max),
    },
    {
      axis: "Pole Rate",
      driver1: normalize(
        d1Vals.poleRate,
        ranges.poleRate.min,
        ranges.poleRate.max
      ),
      driver2: normalize(
        d2Vals.poleRate,
        ranges.poleRate.min,
        ranges.poleRate.max
      ),
    },
    {
      axis: "Podium Rate",
      driver1: normalize(
        d1Vals.podiumRate,
        ranges.podiumRate.min,
        ranges.podiumRate.max
      ),
      driver2: normalize(
        d2Vals.podiumRate,
        ranges.podiumRate.min,
        ranges.podiumRate.max
      ),
    },
    {
      axis: "Consistency",
      driver1: normalize(
        d1Vals.consistency,
        ranges.consistency.min,
        ranges.consistency.max
      ),
      driver2: normalize(
        d2Vals.consistency,
        ranges.consistency.min,
        ranges.consistency.max
      ),
    },
    {
      axis: "Pts / Race",
      driver1: normalize(
        d1Vals.pointsPerRace,
        ranges.pointsPerRace.min,
        ranges.pointsPerRace.max
      ),
      driver2: normalize(
        d2Vals.pointsPerRace,
        ranges.pointsPerRace.min,
        ranges.pointsPerRace.max
      ),
    },
  ];

  const d1Name = `${driver1.firstName} ${driver1.lastName}`;
  const d2Name = `${driver2.firstName} ${driver2.lastName}`;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#EDEDEF", fontSize: 12 }}
        />
        <Radar
          name={d1Name}
          dataKey="driver1"
          stroke={color1}
          fill={color1}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name={d2Name}
          dataKey="driver2"
          stroke={color2}
          fill={color2}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Legend
          wrapperStyle={{ color: "#EDEDEF", fontSize: 13, paddingTop: 8 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
