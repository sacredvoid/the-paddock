"use client";

import { useMemo } from "react";
import type { RaceTelemetry, SafetyCar } from "@/lib/types";

interface RaceEventsTimelineProps {
  telemetry: RaceTelemetry;
}

const EVENT_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  SC: {
    bg: "rgba(251, 191, 36, 0.25)",
    border: "#FBBF24",
    label: "Safety Car",
  },
  VSC: {
    bg: "rgba(255, 107, 44, 0.25)",
    border: "#FF6B2C",
    label: "Virtual SC",
  },
  RED: {
    bg: "rgba(239, 68, 68, 0.25)",
    border: "#EF4444",
    label: "Red Flag",
  },
};

export function RaceEventsTimeline({ telemetry }: RaceEventsTimelineProps) {
  const { events, lapMarkers, totalLaps } = useMemo(() => {
    const tl = telemetry.totalLaps;
    const step = tl <= 30 ? 5 : tl <= 50 ? 10 : 10;
    const markers: number[] = [1];
    for (let l = step; l <= tl; l += step) {
      markers.push(l);
    }
    if (markers[markers.length - 1] !== tl) markers.push(tl);

    return {
      events: telemetry.safetyCars,
      lapMarkers: markers,
      totalLaps: tl,
    };
  }, [telemetry]);

  if (events.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border text-sm text-text-secondary"
        style={{
          backgroundColor: "#111113",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        No safety cars, VSC, or red flags in this race
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Lap scale */}
      <div className="relative mb-1 h-4">
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

      {/* Timeline bar */}
      <div
        className="relative h-10 w-full rounded-lg"
        style={{
          backgroundColor: "#1A1A1E",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Lap ticks */}
        {lapMarkers.map((lap) => (
          <div
            key={`tick-${lap}`}
            className="absolute top-0 h-full"
            style={{
              left: `${((lap - 1) / (totalLaps - 1)) * 100}%`,
              width: 1,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />
        ))}

        {/* Event bands */}
        {events.map((event: SafetyCar, i: number) => {
          const style = EVENT_COLORS[event.type] ?? EVENT_COLORS.SC;
          const left = ((event.startLap - 1) / (totalLaps - 1)) * 100;
          const width =
            ((event.endLap - event.startLap) / (totalLaps - 1)) * 100;

          return (
            <div
              key={i}
              className="group absolute top-0 flex h-full items-center justify-center"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.8)}%`,
                backgroundColor: style.bg,
                borderLeft: `2px solid ${style.border}`,
                borderRight: `2px solid ${style.border}`,
              }}
              title={`${style.label}: Laps ${event.startLap}-${event.endLap}`}
            >
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border px-2 py-1 text-[10px] group-hover:block"
                style={{
                  backgroundColor: "#111113",
                  borderColor: "rgba(255,255,255,0.06)",
                  color: "#EDEDEF",
                }}
              >
                {style.label}: L{event.startLap}
                {event.endLap !== event.startLap && `-L${event.endLap}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
        {Array.from(new Set(events.map((e: SafetyCar) => e.type))).map((type) => {
          const style = EVENT_COLORS[type] ?? EVENT_COLORS.SC;
          return (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-6 rounded-sm border"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                }}
              />
              {style.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
