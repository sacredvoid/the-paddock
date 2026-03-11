"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTeamColor } from "@/lib/team-colors";
import { getDriverById } from "@/lib/data";
import type { SimulatedStanding } from "@/lib/what-if-engine";
import { ChevronUp, ChevronDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulatorResultsProps {
  standings: SimulatedStanding[];
  year: number;
  originalChampionId?: string | null;
}

function formatDriverName(driverId: string): string {
  const driver = getDriverById(driverId);
  if (driver) {
    return `${driver.firstName} ${driver.lastName}`;
  }
  // Fallback: capitalize the driver ID
  return driverId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function PositionChange({ change }: { change?: number }) {
  if (change === undefined || change === 0) {
    return <Minus className="inline size-3.5 text-text-secondary" />;
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-green-500">
        <ChevronUp className="size-3.5" />
        <span className="stats-number text-xs">{change}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-red-500">
      <ChevronDown className="size-3.5" />
      <span className="stats-number text-xs">{Math.abs(change)}</span>
    </span>
  );
}

export function SimulatorResults({
  standings,
  year,
  originalChampionId,
}: SimulatorResultsProps) {
  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-subtle bg-surface px-6 py-12">
        <p className="text-text-secondary">
          No race result data available for this season yet.
        </p>
        <p className="text-sm text-text-secondary">
          Select a season with race results to see the simulation.
        </p>
      </div>
    );
  }

  const newChampion = standings[0];
  const championChanged =
    originalChampionId != null &&
    newChampion.driverId !== originalChampionId;

  return (
    <div className="flex flex-col gap-4">
      {/* Champion change banner */}
      <AnimatePresence mode="wait">
        {championChanged && (
          <motion.div
            key={`champion-${newChampion.driverId}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg border border-f1-red/30 bg-f1-red/10 px-4 py-3"
          >
            <Trophy className="size-5 text-f1-red" />
            <p className="text-sm text-text-primary">
              Under this system,{" "}
              <span className="font-bold text-f1-red">
                {formatDriverName(newChampion.driverId)}
              </span>{" "}
              would have won the {year} championship!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results table */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <Table>
          <TableHeader>
            <TableRow className="border-border-subtle hover:bg-transparent">
              <TableHead className="w-12 text-center">Pos</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Podiums</TableHead>
              <TableHead className="w-20 text-center">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {standings.map((standing) => (
                <motion.tr
                  key={standing.driverId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "border-border-subtle transition-colors",
                    standing.position % 2 === 0 && "bg-surface-elevated/50"
                  )}
                >
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "stats-number font-bold",
                        standing.position <= 3
                          ? "text-f1-red"
                          : "text-text-primary"
                      )}
                    >
                      {standing.position}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-1 rounded-full"
                        style={{
                          backgroundColor: getTeamColor(standing.teamId),
                        }}
                      />
                      <span className="text-text-primary">
                        {formatDriverName(standing.driverId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="stats-number text-right text-text-primary">
                    {standing.points}
                  </TableCell>
                  <TableCell className="stats-number text-right text-text-primary">
                    {standing.wins}
                  </TableCell>
                  <TableCell className="stats-number text-right text-text-primary">
                    {standing.podiums}
                  </TableCell>
                  <TableCell className="text-center">
                    <PositionChange change={standing.positionChange} />
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
