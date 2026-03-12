"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight, Users } from "lucide-react";
import { getDriverById } from "@/lib/data";
import { getDriverImageUrl } from "@/lib/images";
import { getTeamColor } from "@/lib/team-colors";
import type { RaceResult, QualifyingResult, PitStop } from "@/lib/types";

interface RaceHeadToHeadProps {
  results: RaceResult[];
  qualifying?: QualifyingResult[];
  pitStops?: PitStop[];
  year: number;
  round: number;
}

function driverLabel(driverId: string): string {
  const d = getDriverById(driverId);
  return d ? `${d.firstName} ${d.lastName}` : driverId.replace(/-/g, " ");
}

function driverCode(driverId: string): string {
  const d = getDriverById(driverId);
  return d?.code ?? driverId.slice(0, 3).toUpperCase();
}

function teamName(teamId: string): string {
  return teamId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseQualTime(timeStr: string): number | null {
  if (!timeStr || timeStr === "-") return null;
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(timeStr);
}

function formatTimeDelta(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${seconds > 0 ? "+" : "-"}${abs.toFixed(3)}s`;
  const m = Math.floor(abs / 60);
  const s = (abs % 60).toFixed(3);
  return `${seconds > 0 ? "+" : "-"}${m}:${s.padStart(6, "0")}`;
}

function DriverSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: RaceResult[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <label className="mb-1 block text-xs text-text-tertiary">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2.5 pr-8 text-sm font-medium text-text-primary focus:border-glow focus:outline-none"
        >
          {options.map((r) => (
            <option key={r.driverId} value={r.driverId}>
              P{r.position} - {driverLabel(r.driverId)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
      </div>
    </div>
  );
}

function StatRow({
  label,
  leftValue,
  rightValue,
  leftWins,
  rightWins,
  leftColor,
  rightColor,
}: {
  label: string;
  leftValue: string | number;
  rightValue: string | number;
  leftWins?: boolean;
  rightWins?: boolean;
  leftColor: string;
  rightColor: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5">
      <div className="text-right">
        <span
          className={`stats-number text-sm font-semibold ${
            leftWins ? "text-text-primary" : "text-text-secondary"
          }`}
          style={leftWins ? { color: leftColor } : undefined}
        >
          {leftValue}
        </span>
      </div>
      <span className="text-xs text-text-tertiary">{label}</span>
      <div>
        <span
          className={`stats-number text-sm font-semibold ${
            rightWins ? "text-text-primary" : "text-text-secondary"
          }`}
          style={rightWins ? { color: rightColor } : undefined}
        >
          {rightValue}
        </span>
      </div>
    </div>
  );
}

function PositionBar({
  label,
  leftPos,
  rightPos,
  leftColor,
  rightColor,
  maxPos,
}: {
  label: string;
  leftPos: number;
  rightPos: number;
  leftColor: string;
  rightColor: string;
  maxPos: number;
}) {
  const leftPct = ((maxPos - leftPos + 1) / maxPos) * 100;
  const rightPct = ((maxPos - rightPos + 1) / maxPos) * 100;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-text-tertiary">{label}</p>
      <div className="flex items-center gap-3">
        <span
          className="stats-number w-8 text-right text-xs font-bold"
          style={{ color: leftColor }}
        >
          P{leftPos}
        </span>
        <div className="flex flex-1 gap-1">
          <div className="flex flex-1 justify-end">
            <div
              className="h-5 rounded-l-sm"
              style={{
                width: `${leftPct}%`,
                backgroundColor: leftColor,
                opacity: 0.7,
              }}
            />
          </div>
          <div className="flex flex-1 justify-start">
            <div
              className="h-5 rounded-r-sm"
              style={{
                width: `${rightPct}%`,
                backgroundColor: rightColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
        <span
          className="stats-number w-8 text-xs font-bold"
          style={{ color: rightColor }}
        >
          P{rightPos}
        </span>
      </div>
    </div>
  );
}

export function RaceHeadToHead({
  results,
  qualifying,
  pitStops,
  year,
  round,
}: RaceHeadToHeadProps) {
  const [leftId, setLeftId] = useState(results[0]?.driverId ?? "");
  const [rightId, setRightId] = useState(results[1]?.driverId ?? "");

  const leftResult = useMemo(
    () => results.find((r) => r.driverId === leftId),
    [results, leftId]
  );
  const rightResult = useMemo(
    () => results.find((r) => r.driverId === rightId),
    [results, rightId]
  );

  const leftQual = useMemo(
    () => qualifying?.find((q) => q.driverId === leftId),
    [qualifying, leftId]
  );
  const rightQual = useMemo(
    () => qualifying?.find((q) => q.driverId === rightId),
    [qualifying, rightId]
  );

  const leftPits = useMemo(
    () => pitStops?.filter((p) => p.driverId === leftId) ?? [],
    [pitStops, leftId]
  );
  const rightPits = useMemo(
    () => pitStops?.filter((p) => p.driverId === rightId) ?? [],
    [pitStops, rightId]
  );

  if (!leftResult || !rightResult) return null;

  const leftColor = getTeamColor(leftResult.teamId);
  const rightColor = getTeamColor(rightResult.teamId);
  const maxPos = results.length;

  const leftImage = getDriverImageUrl(leftId);
  const rightImage = getDriverImageUrl(rightId);

  // Qualifying best time
  const leftBestQ =
    parseQualTime(leftQual?.q3 ?? "") ??
    parseQualTime(leftQual?.q2 ?? "") ??
    parseQualTime(leftQual?.q1 ?? "");
  const rightBestQ =
    parseQualTime(rightQual?.q3 ?? "") ??
    parseQualTime(rightQual?.q2 ?? "") ??
    parseQualTime(rightQual?.q1 ?? "");

  const qualDelta =
    leftBestQ != null && rightBestQ != null ? rightBestQ - leftBestQ : null;

  // Pit stop totals
  const leftPitTotal = leftPits.reduce(
    (sum, p) => sum + parseFloat(p.duration || "0"),
    0
  );
  const rightPitTotal = rightPits.reduce(
    (sum, p) => sum + parseFloat(p.duration || "0"),
    0
  );

  const hasTelemetry = year === 2024;

  return (
    <section className="mb-12">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
        <Users className="size-5 text-glow" />
        Head-to-Head
      </h2>

      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "#111113",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {/* Driver selectors */}
        <div className="mb-6 flex items-end gap-3">
          <DriverSelector
            label="Driver 1"
            value={leftId}
            options={results}
            onChange={setLeftId}
          />
          <span className="pb-2.5 text-sm font-bold text-text-tertiary">
            VS
          </span>
          <DriverSelector
            label="Driver 2"
            value={rightId}
            options={results}
            onChange={setRightId}
          />
        </div>

        {/* Driver cards */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {[
            {
              id: leftId,
              result: leftResult,
              color: leftColor,
              image: leftImage,
            },
            {
              id: rightId,
              result: rightResult,
              color: rightColor,
              image: rightImage,
            },
          ].map(({ id, result, color, image }) => (
            <div
              key={id}
              className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-3"
              style={{ borderTop: `3px solid ${color}` }}
            >
              {image && (
                <Image
                  src={image}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">
                  {driverCode(id)}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {teamName(result.teamId)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className="stats-number text-xl font-black"
                  style={{ color }}
                >
                  P{result.position}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Position comparison bars */}
        <div className="mb-5 space-y-3">
          <PositionBar
            label="Grid Position"
            leftPos={leftResult.grid > 0 ? leftResult.grid : maxPos}
            rightPos={rightResult.grid > 0 ? rightResult.grid : maxPos}
            leftColor={leftColor}
            rightColor={rightColor}
            maxPos={maxPos}
          />
          <PositionBar
            label="Finish Position"
            leftPos={leftResult.position}
            rightPos={rightResult.position}
            leftColor={leftColor}
            rightColor={rightColor}
            maxPos={maxPos}
          />
        </div>

        {/* Stats comparison */}
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          <StatRow
            label="Grid"
            leftValue={leftResult.grid > 0 ? leftResult.grid : "PL"}
            rightValue={rightResult.grid > 0 ? rightResult.grid : "PL"}
            leftWins={leftResult.grid < rightResult.grid && leftResult.grid > 0}
            rightWins={
              rightResult.grid < leftResult.grid && rightResult.grid > 0
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />
          <StatRow
            label="Position"
            leftValue={leftResult.position}
            rightValue={rightResult.position}
            leftWins={leftResult.position < rightResult.position}
            rightWins={rightResult.position < leftResult.position}
            leftColor={leftColor}
            rightColor={rightColor}
          />
          <StatRow
            label="Gained"
            leftValue={
              leftResult.grid > 0
                ? leftResult.grid - leftResult.position
                : "-"
            }
            rightValue={
              rightResult.grid > 0
                ? rightResult.grid - rightResult.position
                : "-"
            }
            leftWins={
              typeof (leftResult.grid - leftResult.position) === "number" &&
              typeof (rightResult.grid - rightResult.position) === "number" &&
              leftResult.grid - leftResult.position >
                rightResult.grid - rightResult.position
            }
            rightWins={
              typeof (leftResult.grid - leftResult.position) === "number" &&
              typeof (rightResult.grid - rightResult.position) === "number" &&
              rightResult.grid - rightResult.position >
                leftResult.grid - leftResult.position
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />
          <StatRow
            label="Points"
            leftValue={leftResult.points}
            rightValue={rightResult.points}
            leftWins={leftResult.points > rightResult.points}
            rightWins={rightResult.points > leftResult.points}
            leftColor={leftColor}
            rightColor={rightColor}
          />
          <StatRow
            label="Laps"
            leftValue={leftResult.laps}
            rightValue={rightResult.laps}
            leftWins={leftResult.laps > rightResult.laps}
            rightWins={rightResult.laps > leftResult.laps}
            leftColor={leftColor}
            rightColor={rightColor}
          />
          <StatRow
            label="Status"
            leftValue={leftResult.status}
            rightValue={rightResult.status}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          {/* Qualifying comparison */}
          {leftQual && rightQual && (
            <>
              {leftQual.q1 && rightQual.q1 && (
                <StatRow
                  label="Q1"
                  leftValue={leftQual.q1 || "-"}
                  rightValue={rightQual.q1 || "-"}
                  leftWins={
                    parseQualTime(leftQual.q1) != null &&
                    parseQualTime(rightQual.q1) != null &&
                    parseQualTime(leftQual.q1)! < parseQualTime(rightQual.q1)!
                  }
                  rightWins={
                    parseQualTime(leftQual.q1) != null &&
                    parseQualTime(rightQual.q1) != null &&
                    parseQualTime(rightQual.q1)! < parseQualTime(leftQual.q1)!
                  }
                  leftColor={leftColor}
                  rightColor={rightColor}
                />
              )}
              {leftQual.q2 && rightQual.q2 && (
                <StatRow
                  label="Q2"
                  leftValue={leftQual.q2 || "-"}
                  rightValue={rightQual.q2 || "-"}
                  leftWins={
                    parseQualTime(leftQual.q2) != null &&
                    parseQualTime(rightQual.q2) != null &&
                    parseQualTime(leftQual.q2)! < parseQualTime(rightQual.q2)!
                  }
                  rightWins={
                    parseQualTime(leftQual.q2) != null &&
                    parseQualTime(rightQual.q2) != null &&
                    parseQualTime(rightQual.q2)! < parseQualTime(leftQual.q2)!
                  }
                  leftColor={leftColor}
                  rightColor={rightColor}
                />
              )}
              {leftQual.q3 && rightQual.q3 && (
                <StatRow
                  label="Q3"
                  leftValue={leftQual.q3 || "-"}
                  rightValue={rightQual.q3 || "-"}
                  leftWins={
                    parseQualTime(leftQual.q3) != null &&
                    parseQualTime(rightQual.q3) != null &&
                    parseQualTime(leftQual.q3)! < parseQualTime(rightQual.q3)!
                  }
                  rightWins={
                    parseQualTime(leftQual.q3) != null &&
                    parseQualTime(rightQual.q3) != null &&
                    parseQualTime(rightQual.q3)! < parseQualTime(leftQual.q3)!
                  }
                  leftColor={leftColor}
                  rightColor={rightColor}
                />
              )}
              {qualDelta != null && (
                <StatRow
                  label="Qual Gap"
                  leftValue={qualDelta <= 0 ? formatTimeDelta(-qualDelta) : "-"}
                  rightValue={qualDelta > 0 ? formatTimeDelta(qualDelta) : "-"}
                  leftWins={qualDelta > 0}
                  rightWins={qualDelta < 0}
                  leftColor={leftColor}
                  rightColor={rightColor}
                />
              )}
            </>
          )}

          {/* Pit stops */}
          <StatRow
            label="Pit Stops"
            leftValue={leftPits.length}
            rightValue={rightPits.length}
            leftColor={leftColor}
            rightColor={rightColor}
          />
          {leftPitTotal > 0 && rightPitTotal > 0 && (
            <StatRow
              label="Pit Time"
              leftValue={`${leftPitTotal.toFixed(1)}s`}
              rightValue={`${rightPitTotal.toFixed(1)}s`}
              leftWins={leftPitTotal < rightPitTotal}
              rightWins={rightPitTotal < leftPitTotal}
              leftColor={leftColor}
              rightColor={rightColor}
            />
          )}
        </div>

        {/* Link to full compare page (for 2024 races with telemetry) */}
        {hasTelemetry && (
          <Link
            href={`/compare?year=${year}&round=${round}&drivers=${leftId},${rightId}`}
            className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-glow/20 bg-glow/5 px-4 py-2.5 text-sm font-medium text-glow transition-colors hover:bg-glow/10"
          >
            Compare Full Telemetry
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
