"use client";

import { useRef, useEffect, useCallback } from "react";
import { getTrackPath } from "@/lib/track-paths";
import type { TrackPoint } from "@/lib/track-paths";
import type { ReplayFrame } from "@/lib/replay";

// ---------------------------------------------------------------------------
// Team colors
// ---------------------------------------------------------------------------

const TEAM_COLORS: Record<string, string> = {
  "red-bull": "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  "aston-martin": "#229971",
  alpine: "#FF87BC",
  williams: "#64C4FF",
  haas: "#B6BABD",
  "kick-sauber": "#52E252",
  rb: "#6692FF",
};

function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId] ?? "#888888";
}

// ---------------------------------------------------------------------------
// Track geometry helpers
// ---------------------------------------------------------------------------

/** Compute cumulative arc-length distances along a polyline. */
function computeArcLengths(points: TrackPoint[]): number[] {
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  return lengths;
}

/** Sample a point at a given progress (0-1) along a closed polyline. */
function sampleTrackPosition(
  points: TrackPoint[],
  arcLengths: number[],
  progress: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0.5, y: 0.5 };

  const totalLength = arcLengths[arcLengths.length - 1];
  // Add the closing segment length (last point to first point)
  const closeDx = points[0].x - points[points.length - 1].x;
  const closeDy = points[0].y - points[points.length - 1].y;
  const closeLen = Math.sqrt(closeDx * closeDx + closeDy * closeDy);
  const fullLength = totalLength + closeLen;

  const target = ((progress % 1) + 1) % 1 * fullLength;

  // Walk segments (including the closing segment)
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    const segStart = i === 0 ? 0 : arcLengths[i];
    const segEnd =
      i < points.length - 1 ? arcLengths[i + 1] : totalLength + closeLen;

    if (target >= segStart && target <= segEnd) {
      const segLen = segEnd - segStart;
      const t = segLen > 0 ? (target - segStart) / segLen : 0;
      return {
        x: points[i].x + (points[nextIdx].x - points[i].x) * t,
        y: points[i].y + (points[nextIdx].y - points[i].y) * t,
      };
    }
  }

  return points[0];
}

/** Compute the normal vector at a given progress for pit lane offset. */
function sampleTrackNormal(
  points: TrackPoint[],
  arcLengths: number[],
  progress: number
): { nx: number; ny: number } {
  const eps = 0.002;
  const a = sampleTrackPosition(points, arcLengths, progress - eps);
  const b = sampleTrackPosition(points, arcLengths, progress + eps);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Normal is perpendicular (rotated 90 degrees)
  return { nx: -dy / len, ny: dx / len };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReplayCanvasProps {
  frame: ReplayFrame;
  circuitId: string;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplayCanvas({
  frame,
  circuitId,
  width = 700,
  height = 500,
}: ReplayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#0A0A0F";
    ctx.fillRect(0, 0, width, height);

    // Get track path
    const trackPoints = getTrackPath(circuitId);
    const arcLengths = computeArcLengths(trackPoints);

    // Padding and scaling
    const pad = 50;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;

    const toScreen = (nx: number, ny: number) => ({
      sx: pad + nx * drawW,
      sy: pad + ny * drawH,
    });

    // -----------------------------------------------------------------------
    // Draw track outline
    // -----------------------------------------------------------------------
    const trackColor = frame.safetyCar ? "#F5C542" : "rgba(255,255,255,0.18)";
    const trackWidth = frame.safetyCar ? 3 : 2;

    ctx.beginPath();
    for (let i = 0; i < trackPoints.length; i++) {
      const { sx, sy } = toScreen(trackPoints[i].x, trackPoints[i].y);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = trackWidth;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Safety car label
    if (frame.safetyCar) {
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#F5C542";
      ctx.textAlign = "center";
      ctx.fillText("SAFETY CAR", width / 2, 20);
    }

    // -----------------------------------------------------------------------
    // Draw cars
    // -----------------------------------------------------------------------
    const pitOffset = 0.04; // Normal offset for pit lane
    const carRadius = 6;

    for (const driver of frame.drivers) {
      const progress = driver.trackProgress;
      const pos = sampleTrackPosition(trackPoints, arcLengths, progress);
      let screenPos = toScreen(pos.x, pos.y);

      // Pit lane: offset from track
      if (driver.status === "pit") {
        const normal = sampleTrackNormal(trackPoints, arcLengths, progress);
        const offsetPos = {
          x: pos.x + normal.nx * pitOffset,
          y: pos.y + normal.ny * pitOffset,
        };
        screenPos = toScreen(offsetPos.x, offsetPos.y);
      }

      const isRetired = driver.status === "retired";
      const teamColor = isRetired ? "#555555" : getTeamColor(driver.teamId);
      const alpha = isRetired ? 0.35 : 1;

      ctx.globalAlpha = alpha;

      // Car dot
      ctx.beginPath();
      ctx.arc(screenPos.sx, screenPos.sy, carRadius, 0, Math.PI * 2);
      ctx.fillStyle = teamColor;
      ctx.fill();

      // Abbreviation label
      ctx.font = "bold 9px Inter, system-ui, sans-serif";
      ctx.fillStyle = isRetired ? "#777777" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(driver.abbreviation, screenPos.sx, screenPos.sy - carRadius - 2);

      ctx.globalAlpha = 1;
    }

    // -----------------------------------------------------------------------
    // Lap counter at bottom left
    // -----------------------------------------------------------------------
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`Lap ${frame.lap}`, pad, height - 12);
  }, [frame, circuitId, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-xl border border-border bg-[#0A0A0F]"
    />
  );
}
