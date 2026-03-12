"use client";

import dynamic from "next/dynamic";
import type { RaceTelemetry } from "@/lib/types";
import { BarChart3, GitBranchPlus, Timer, Flag } from "lucide-react";

const LapChart = dynamic(
  () => import("./lap-chart").then((mod) => ({ default: mod.LapChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const TireStrategy = dynamic(
  () =>
    import("./tire-strategy").then((mod) => ({ default: mod.TireStrategy })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const GapChart = dynamic(
  () => import("./gap-chart").then((mod) => ({ default: mod.GapChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const RaceEventsTimeline = dynamic(
  () =>
    import("./race-events-timeline").then((mod) => ({
      default: mod.RaceEventsTimeline,
    })),
  {
    loading: () => <ChartSkeleton height="h-16" />,
    ssr: false,
  }
);

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`${height} w-full animate-pulse rounded-lg`}
      style={{ backgroundColor: "#1A1A1E" }}
    />
  );
}

interface RaceAnalysisChartsProps {
  telemetry: RaceTelemetry;
}

export function RaceAnalysisCharts({ telemetry }: RaceAnalysisChartsProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-text-primary">
        <BarChart3 className="size-5 text-glow" />
        Race Analysis
      </h2>

      <div className="space-y-8">
        {/* Race Events Timeline */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#111113",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Flag className="size-4 text-amber-400" />
            Race Events
          </h3>
          <RaceEventsTimeline telemetry={telemetry} />
        </div>

        {/* Lap Position Chart */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#111113",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <GitBranchPlus className="size-4 text-glow" />
            Position Changes
          </h3>
          <LapChart telemetry={telemetry} />
        </div>

        {/* Tire Strategy */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#111113",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-glow text-[8px] font-bold text-glow">
              T
            </span>
            Tire Strategy
          </h3>
          <TireStrategy telemetry={telemetry} />
        </div>

        {/* Gap to Leader */}
        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "#111113",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Timer className="size-4 text-glow" />
            Gap to Leader
          </h3>
          <GapChart telemetry={telemetry} />
        </div>
      </div>
    </section>
  );
}
