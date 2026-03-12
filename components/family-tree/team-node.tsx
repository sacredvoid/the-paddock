"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Calendar, Hash } from "lucide-react";
import type { TeamLineageEntry } from "@/lib/types";

interface TeamNodeProps {
  entry: TeamLineageEntry;
  /** Pixel offset from the left edge of the timeline container */
  left: number;
  /** Pixel width of the block */
  width: number;
  /** Whether this team exists in the teams data and is linkable */
  teamSlug?: string;
  /** Pixel per year scale factor for minimum width enforcement */
  pixelsPerYear: number;
}

export function TeamNode({
  entry,
  left,
  width,
  teamSlug,
  pixelsPerYear,
}: TeamNodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const yearSpan = entry.years[1] - entry.years[0] + 1;
  const isNarrow = width < 60;
  const isVeryNarrow = width < 30;

  // Compute label text
  const label = isVeryNarrow
    ? ""
    : isNarrow
      ? entry.name.split(" ")[0]
      : entry.name;

  // Ensure minimum contrast for text on the team color background
  // Use white text for dark colors, dark text for light colors
  const textColor = getContrastColor(entry.color);

  return (
    <div
      ref={nodeRef}
      className="absolute top-0 bottom-0 z-10 flex items-center"
      style={{ left, width: Math.max(width, 4) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The team block */}
      <motion.div
        className="relative flex h-10 w-full cursor-pointer items-center overflow-hidden rounded-md border border-white/[0.08] px-2"
        style={{
          backgroundColor: entry.color,
          opacity: hovered ? 1 : 0.85,
        }}
        whileHover={{
          scale: 1.04,
          boxShadow: `0 0 16px ${entry.color}50, 0 0 32px ${entry.color}25`,
          borderColor: "rgba(255,255,255,0.25)",
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Team label */}
        {label && (
          <span
            className="truncate text-xs font-semibold leading-tight"
            style={{ color: textColor }}
          >
            {label}
          </span>
        )}
      </motion.div>

      {/* Hover tooltip card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-60 -translate-x-1/2"
          >
            <div
              className="pointer-events-auto rounded-lg border border-white/[0.08] bg-surface-2 p-4 shadow-2xl"
              style={{ borderTop: `3px solid ${entry.color}` }}
            >
              {/* Team name */}
              <h4 className="text-base font-bold text-text-primary">
                {entry.name}
              </h4>

              {/* Years + seasons */}
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>
                    {entry.years[0]} - {entry.years[1]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Hash className="size-3.5 shrink-0" />
                  <span>
                    {yearSpan} season{yearSpan !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* View team link */}
              {teamSlug && (
                <Link
                  href={`/teams/${teamSlug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-glow hover:underline"
                >
                  View Team
                  <ArrowRight className="size-3.5" />
                </Link>
              )}

              {/* Arrow pointer */}
              <div
                className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-white/[0.08] bg-surface-2"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Returns white or dark text based on background luminance */
function getContrastColor(hex: string): string {
  // Remove # prefix
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111113" : "#FFFFFF";
}
