"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { ZoomIn, ZoomOut, RotateCcw, ChevronRight } from "lucide-react";
import type { TeamLineage, TeamLineageEntry } from "@/lib/types";
import type { Team } from "@/lib/types";
import { TeamNode } from "./team-node";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMELINE_START = 1950;
const TIMELINE_END = 2026;
const TOTAL_YEARS = TIMELINE_END - TIMELINE_START + 1;

const LANE_HEIGHT = 64;
const LANE_GAP = 4;
const HEADER_HEIGHT = 48;
const LABEL_WIDTH = 180;
const RIGHT_LABEL_WIDTH = 160;
const YEAR_TICK_HEIGHT = 24;
const MIN_PX_PER_YEAR = 16;
const DEFAULT_PX_PER_YEAR = 22;
const MAX_PX_PER_YEAR = 60;

// Decade filter presets
const DECADE_FILTERS = [
  { label: "All", start: 1950, end: 2026 },
  { label: "1950s", start: 1950, end: 1959 },
  { label: "1960s", start: 1960, end: 1969 },
  { label: "1970s", start: 1970, end: 1979 },
  { label: "1980s", start: 1980, end: 1989 },
  { label: "1990s", start: 1990, end: 1999 },
  { label: "2000s", start: 2000, end: 2009 },
  { label: "2010s", start: 2010, end: 2019 },
  { label: "2020s", start: 2020, end: 2026 },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TreeVisualizationProps {
  lineages: TeamLineage[];
  teams: Team[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TreeVisualization({ lineages, teams }: TreeVisualizationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pxPerYear, setPxPerYear] = useState(DEFAULT_PX_PER_YEAR);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  // Build a lookup map from team id to slug for linking
  const teamSlugMap = useMemo(() => {
    const map: Record<string, string> = {};
    teams.forEach((t) => {
      map[t.id] = t.slug;
    });
    return map;
  }, [teams]);

  // Determine visible year range from active filter
  const visibleRange = useMemo(() => {
    const filter = DECADE_FILTERS.find((f) => f.label === activeFilter);
    return filter ?? DECADE_FILTERS[0];
  }, [activeFilter]);

  // Filter lineages to only show those with teams active in the visible range
  const visibleLineages = useMemo(() => {
    if (activeFilter === "All") return lineages;
    return lineages.filter((lineage) =>
      lineage.chain.some(
        (entry) =>
          entry.years[1] >= visibleRange.start &&
          entry.years[0] <= visibleRange.end
      )
    );
  }, [lineages, activeFilter, visibleRange]);

  // Computed dimensions
  const timelineWidth = TOTAL_YEARS * pxPerYear;
  const totalWidth = LABEL_WIDTH + timelineWidth + RIGHT_LABEL_WIDTH;
  const totalHeight =
    HEADER_HEIGHT +
    YEAR_TICK_HEIGHT +
    visibleLineages.length * (LANE_HEIGHT + LANE_GAP) +
    20;

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setPxPerYear((prev) => Math.min(prev + 6, MAX_PX_PER_YEAR));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPxPerYear((prev) => Math.max(prev - 6, MIN_PX_PER_YEAR));
  }, []);

  const handleReset = useCallback(() => {
    setPxPerYear(DEFAULT_PX_PER_YEAR);
    setActiveFilter("All");
  }, []);

  // On decade filter click, scroll to the appropriate position
  const handleFilterClick = useCallback(
    (label: string) => {
      setActiveFilter(label);
      const filter = DECADE_FILTERS.find((f) => f.label === label);
      if (filter && scrollRef.current) {
        const scrollTarget =
          (filter.start - TIMELINE_START) * pxPerYear + LABEL_WIDTH - 40;
        scrollRef.current.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: "smooth",
        });
      }
    },
    [pxPerYear]
  );

  // Scroll to the modern era on mount
  useEffect(() => {
    if (scrollRef.current) {
      const modernStart = (2000 - TIMELINE_START) * pxPerYear;
      scrollRef.current.scrollLeft = Math.max(0, modernStart - 40);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build year markers
  const yearMarkers = useMemo(() => {
    const markers: { year: number; x: number; isDecade: boolean }[] = [];
    for (let y = TIMELINE_START; y <= TIMELINE_END; y++) {
      const isDecade = y % 10 === 0;
      const isFiveYear = y % 5 === 0;
      if (isDecade || isFiveYear || pxPerYear >= 30) {
        markers.push({
          year: y,
          x: (y - TIMELINE_START) * pxPerYear,
          isDecade,
        });
      }
    }
    return markers;
  }, [pxPerYear]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Decade filter buttons */}
        <div className="flex flex-wrap gap-1.5">
          {DECADE_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleFilterClick(filter.label)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === filter.label
                  ? "bg-glow text-white"
                  : "bg-surface-1 text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={pxPerYear <= MIN_PX_PER_YEAR}
            className="rounded-md bg-surface-1 p-2 text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={pxPerYear >= MAX_PX_PER_YEAR}
            className="rounded-md bg-surface-1 p-2 text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            onClick={handleReset}
            className="rounded-md bg-surface-1 p-2 text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Reset view"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* Timeline container with horizontal scroll */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-white/[0.06] bg-surface-1"
        style={{ maxHeight: totalHeight + 16 }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, minHeight: totalHeight }}
        >
          {/* Year axis header */}
          <div
            className="sticky top-0 z-30 flex"
            style={{ height: HEADER_HEIGHT + YEAR_TICK_HEIGHT }}
          >
            {/* Left label spacer */}
            <div
              className="shrink-0 border-b border-r border-white/[0.06] bg-surface-1"
              style={{ width: LABEL_WIDTH, height: "100%" }}
            >
              <div className="flex h-full items-center px-4">
                <span className="section-label">Lineage</span>
              </div>
            </div>

            {/* Year markers */}
            <div
              className="relative border-b border-white/[0.06] bg-surface-1"
              style={{ width: timelineWidth, height: "100%" }}
            >
              {yearMarkers.map(({ year, x, isDecade }) => (
                <div
                  key={year}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: x, height: "100%" }}
                >
                  {/* Tick line */}
                  <div
                    className={`w-px ${isDecade ? "bg-white/[0.12]" : "bg-white/[0.04]"}`}
                    style={{ height: isDecade ? "100%" : "60%" }}
                  />
                  {/* Year label */}
                  {(isDecade || pxPerYear >= 30) && (
                    <span
                      className={`absolute bottom-1 -translate-x-1/2 stats-number text-[10px] ${
                        isDecade
                          ? "font-semibold text-text-secondary"
                          : "text-text-tertiary"
                      }`}
                    >
                      {year}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Right label spacer */}
            <div
              className="shrink-0 border-b border-l border-white/[0.06] bg-surface-1"
              style={{ width: RIGHT_LABEL_WIDTH, height: "100%" }}
            >
              <div className="flex h-full items-center px-4">
                <span className="section-label">Current Team</span>
              </div>
            </div>
          </div>

          {/* Lanes */}
          {visibleLineages.map((lineage, laneIndex) => {
            const laneTop =
              HEADER_HEIGHT +
              YEAR_TICK_HEIGHT +
              laneIndex * (LANE_HEIGHT + LANE_GAP);
            const currentTeam = lineage.chain[lineage.chain.length - 1];

            return (
              <motion.div
                key={lineage.id}
                className="absolute flex"
                style={{ top: laneTop, width: totalWidth, height: LANE_HEIGHT }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: laneIndex * 0.04,
                }}
              >
                {/* Left: Lineage name */}
                <div
                  className="sticky left-0 z-20 flex shrink-0 items-center border-r border-white/[0.06] bg-surface-1 px-4"
                  style={{ width: LABEL_WIDTH }}
                >
                  <span className="truncate text-sm font-medium text-text-secondary">
                    {lineage.name}
                  </span>
                </div>

                {/* Timeline lane */}
                <div
                  className="relative border-b border-white/[0.03]"
                  style={{ width: timelineWidth, height: LANE_HEIGHT }}
                >
                  {/* Background decade grid lines */}
                  {yearMarkers
                    .filter((m) => m.isDecade)
                    .map(({ year, x }) => (
                      <div
                        key={`grid-${year}`}
                        className="absolute top-0 h-full w-px bg-white/[0.03]"
                        style={{ left: x }}
                      />
                    ))}

                  {/* Team blocks with connectors */}
                  {lineage.chain.map((entry, entryIndex) => {
                    const blockLeft =
                      (entry.years[0] - TIMELINE_START) * pxPerYear;
                    const blockWidth =
                      (entry.years[1] - entry.years[0] + 1) * pxPerYear;

                    // Draw connector arrow between this block and the previous one
                    const prevEntry =
                      entryIndex > 0
                        ? lineage.chain[entryIndex - 1]
                        : null;
                    const connectorLeft = prevEntry
                      ? (prevEntry.years[1] - TIMELINE_START + 1) * pxPerYear
                      : 0;
                    const connectorWidth = prevEntry
                      ? blockLeft - connectorLeft
                      : 0;

                    return (
                      <div key={entry.id}>
                        {/* Connector line */}
                        {prevEntry && connectorWidth > 0 && (
                          <div
                            className="absolute top-1/2 flex -translate-y-1/2 items-center"
                            style={{
                              left: connectorLeft,
                              width: connectorWidth,
                            }}
                          >
                            <div className="h-px w-full bg-gradient-to-r from-white/[0.15] to-white/[0.08]" />
                            <ChevronRight className="absolute right-0 size-3 translate-x-1 text-white/20" />
                          </div>
                        )}

                        {/* Team node */}
                        <div
                          className="absolute"
                          style={{
                            left: blockLeft,
                            width: blockWidth,
                            top: (LANE_HEIGHT - 40) / 2,
                            height: 40,
                          }}
                        >
                          <TeamNode
                            entry={entry}
                            left={0}
                            width={blockWidth}
                            teamSlug={teamSlugMap[entry.id]}
                            pixelsPerYear={pxPerYear}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Current team name */}
                <div
                  className="sticky right-0 z-20 flex shrink-0 items-center gap-2 border-l border-white/[0.06] bg-surface-1 px-4"
                  style={{ width: RIGHT_LABEL_WIDTH }}
                >
                  <div
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: currentTeam.color }}
                  />
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {currentTeam.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-white/[0.06] bg-surface-1 px-4 py-3">
        <span className="section-label">Legend</span>
        <div className="flex items-center gap-2">
          <div className="h-5 w-10 rounded-[4px] bg-glow/80" />
          <span className="text-xs text-text-secondary">Team active period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="h-px w-6 bg-white/[0.15]" />
            <ChevronRight className="size-3 text-white/20" />
          </div>
          <span className="text-xs text-text-secondary">
            Succession / ownership transfer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-text-secondary" />
          <span className="text-xs text-text-secondary">
            Hover blocks for details
          </span>
        </div>
      </div>
    </div>
  );
}
