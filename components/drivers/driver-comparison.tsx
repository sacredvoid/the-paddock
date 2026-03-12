"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonRadarChart } from "@/components/charts/radar-chart";
import { cn } from "@/lib/utils";
import type { Driver } from "@/lib/types";
import { Trophy, Medal, Flag as FlagIcon, Zap, Timer, Hash, Target, TrendingUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverComparisonProps {
  driver1: Driver;
  driver2: Driver;
  color1?: string;
  color2?: string;
}

interface StatRowProps {
  label: string;
  value1: number | string;
  value2: number | string;
  rawValue1: number;
  rawValue2: number;
  lowerIsBetter?: boolean;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Stat row with "who's better" highlighting
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value1,
  value2,
  rawValue1,
  rawValue2,
  lowerIsBetter = false,
  icon,
}: StatRowProps) {
  let winner: "left" | "right" | "tie" = "tie";
  if (rawValue1 !== rawValue2) {
    if (lowerIsBetter) {
      winner = rawValue1 < rawValue2 ? "left" : "right";
    } else {
      winner = rawValue1 > rawValue2 ? "left" : "right";
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] py-3 last:border-b-0">
      {/* Driver 1 value */}
      <div className="flex-1 text-right">
        <span
          className={cn(
            "stats-number text-lg font-semibold",
            winner === "left" ? "text-success" : "text-text-primary"
          )}
        >
          {value1}
        </span>
      </div>

      {/* Label (center) */}
      <div className="flex w-36 shrink-0 flex-col items-center gap-1 text-center">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
      </div>

      {/* Driver 2 value */}
      <div className="flex-1 text-left">
        <span
          className={cn(
            "stats-number text-lg font-semibold",
            winner === "right" ? "text-success" : "text-text-primary"
          )}
        >
          {value2}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Driver name header
// ---------------------------------------------------------------------------

function DriverHeader({
  driver,
  color,
  align,
}: {
  driver: Driver;
  color: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-1",
        align === "right" ? "items-end text-right" : "items-start text-left"
      )}
    >
      <div
        className="h-1 w-12 rounded-full"
        style={{ backgroundColor: color }}
      />
      <h3 className="text-xl font-bold text-text-primary">
        {driver.firstName}
      </h3>
      <h3 className="text-xl font-bold text-text-primary">
        {driver.lastName}
      </h3>
      <span className="flex items-center gap-1 text-xs text-text-secondary">
        <FlagIcon className="size-3" />
        {driver.nationality}
      </span>
      {driver.code && (
        <span className="stats-number rounded border border-[rgba(255,255,255,0.06)] bg-surface-2 px-2 py-0.5 text-xs font-bold tracking-widest text-text-secondary">
          {driver.code}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DriverComparison({
  driver1,
  driver2,
  color1 = "#FF6B2C",
  color2 = "#3671C6",
}: DriverComparisonProps) {
  const s1 = driver1.stats;
  const s2 = driver2.stats;

  if (!s1 || !s2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 text-text-secondary">
        Stats unavailable for one or both drivers.
      </div>
    );
  }

  const ppr1 = s1.points / s1.races;
  const ppr2 = s2.points / s2.races;

  return (
    <div className="flex flex-col gap-6">
      {/* Driver name headers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-4"
      >
        <DriverHeader driver={driver1} color={color1} align="left" />
        <div className="flex shrink-0 items-center pt-4">
          <span className="stats-number text-2xl font-black text-text-secondary">
            VS
          </span>
        </div>
        <DriverHeader driver={driver2} color={color2} align="right" />
      </motion.div>

      {/* Career Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Trophy className="size-5 text-glow" />
              Career Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow
              label="Championships"
              value1={s1.championships}
              value2={s2.championships}
              rawValue1={s1.championships}
              rawValue2={s2.championships}
              icon={<Trophy className="size-4" />}
            />
            <StatRow
              label="Wins"
              value1={s1.wins}
              value2={s2.wins}
              rawValue1={s1.wins}
              rawValue2={s2.wins}
              icon={<Medal className="size-4" />}
            />
            <StatRow
              label="Podiums"
              value1={s1.podiums}
              value2={s2.podiums}
              rawValue1={s1.podiums}
              rawValue2={s2.podiums}
              icon={<Medal className="size-4" />}
            />
            <StatRow
              label="Poles"
              value1={s1.poles}
              value2={s2.poles}
              rawValue1={s1.poles}
              rawValue2={s2.poles}
              icon={<Zap className="size-4" />}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Target className="size-5 text-glow" />
              Performance Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRadarChart
              driver1={driver1}
              driver2={driver2}
              color1={color1}
              color2={color2}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Stat Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <TrendingUp className="size-5 text-glow" />
              Full Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow
              label="Race Entries"
              value1={s1.races}
              value2={s2.races}
              rawValue1={s1.races}
              rawValue2={s2.races}
              icon={<Hash className="size-4" />}
            />
            <StatRow
              label="Career Points"
              value1={s1.points.toLocaleString()}
              value2={s2.points.toLocaleString()}
              rawValue1={s1.points}
              rawValue2={s2.points}
              icon={<Target className="size-4" />}
            />
            <StatRow
              label="Fastest Laps"
              value1={s1.fastestLaps}
              value2={s2.fastestLaps}
              rawValue1={s1.fastestLaps}
              rawValue2={s2.fastestLaps}
              icon={<Timer className="size-4" />}
            />
            <StatRow
              label="DNFs"
              value1={s1.dnfs}
              value2={s2.dnfs}
              rawValue1={s1.dnfs}
              rawValue2={s2.dnfs}
              lowerIsBetter
              icon={<Zap className="size-4" />}
            />
            <StatRow
              label="Win Rate"
              value1={`${(s1.winRate * 100).toFixed(1)}%`}
              value2={`${(s2.winRate * 100).toFixed(1)}%`}
              rawValue1={s1.winRate}
              rawValue2={s2.winRate}
              icon={<TrendingUp className="size-4" />}
            />
            <StatRow
              label="Podium Rate"
              value1={`${(s1.podiumRate * 100).toFixed(1)}%`}
              value2={`${(s2.podiumRate * 100).toFixed(1)}%`}
              rawValue1={s1.podiumRate}
              rawValue2={s2.podiumRate}
              icon={<TrendingUp className="size-4" />}
            />
            <StatRow
              label="Avg. Finish"
              value1={`P${s1.averageFinish.toFixed(1)}`}
              value2={`P${s2.averageFinish.toFixed(1)}`}
              rawValue1={s1.averageFinish}
              rawValue2={s2.averageFinish}
              lowerIsBetter
              icon={<Target className="size-4" />}
            />
            <StatRow
              label="Best Finish"
              value1={`P${s1.bestFinish}`}
              value2={`P${s2.bestFinish}`}
              rawValue1={s1.bestFinish}
              rawValue2={s2.bestFinish}
              lowerIsBetter
              icon={<Trophy className="size-4" />}
            />
            <StatRow
              label="Pts / Race"
              value1={ppr1.toFixed(2)}
              value2={ppr2.toFixed(2)}
              rawValue1={ppr1}
              rawValue2={ppr2}
              icon={<Target className="size-4" />}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
