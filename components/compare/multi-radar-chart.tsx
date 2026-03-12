"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DriverRadarData {
  name: string;
  color: string;
  winRate: number;
  poleRate: number;
  podiumRate: number;
  consistency: number;
  ptsPerRace: number;
}

interface MultiRadarChartProps {
  drivers: DriverRadarData[];
}

export function MultiRadarChart({ drivers }: MultiRadarChartProps) {
  if (drivers.length === 0) return null;

  // Normalize values to 0-100 scale
  const maxValues = {
    winRate: Math.max(...drivers.map((d) => d.winRate), 0.001),
    poleRate: Math.max(...drivers.map((d) => d.poleRate), 0.001),
    podiumRate: Math.max(...drivers.map((d) => d.podiumRate), 0.001),
    consistency: Math.max(...drivers.map((d) => d.consistency), 0.001),
    ptsPerRace: Math.max(...drivers.map((d) => d.ptsPerRace), 0.001),
  };

  const axes = [
    { key: "winRate", label: "Win Rate" },
    { key: "poleRate", label: "Pole Rate" },
    { key: "podiumRate", label: "Podium Rate" },
    { key: "consistency", label: "Consistency" },
    { key: "ptsPerRace", label: "Pts/Race" },
  ] as const;

  const chartData = axes.map((axis) => {
    const point: Record<string, string | number> = { axis: axis.label };
    for (const driver of drivers) {
      point[driver.name] =
        Math.round((driver[axis.key] / maxValues[axis.key]) * 100 * 10) / 10;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#8B8B8D", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        {drivers.map((driver) => (
          <Radar
            key={driver.name}
            name={driver.name}
            dataKey={driver.name}
            stroke={driver.color}
            fill={driver.color}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#EDEDEF", paddingTop: 8 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
