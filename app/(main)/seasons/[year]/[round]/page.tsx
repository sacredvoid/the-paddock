import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getSeason, getDriverById, getTeamById, getCircuitById } from "@/lib/data";
import { getTeamColor } from "@/lib/team-colors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Clock, Gauge, Fuel } from "lucide-react";
import type { Season, PitStop } from "@/lib/types";

function driverDisplayName(driverId: string): string {
  const driver = getDriverById(driverId);
  return driver ? `${driver.firstName} ${driver.lastName}` : driverId.replace(/-/g, " ");
}

function driverShortName(driverId: string): string {
  const driver = getDriverById(driverId);
  if (driver) return `${driver.firstName.charAt(0)}. ${driver.lastName}`;
  const parts = driverId.split("-");
  return parts.length > 1
    ? `${parts[0].charAt(0).toUpperCase()}. ${parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")}`
    : driverId;
}

function teamDisplayName(teamId: string): string {
  const team = getTeamById(teamId);
  return team ? team.name : teamId.replace(/-/g, " ");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function isFinished(status: string): boolean {
  return status === "Finished" || status.startsWith("+");
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>;
}) {
  const { year: yearStr, round: roundStr } = await params;
  const year = parseInt(yearStr, 10);
  const round = parseInt(roundStr, 10);

  if (isNaN(year) || isNaN(round)) notFound();

  let season: Season;
  try {
    season = await getSeason(year);
  } catch {
    notFound();
  }

  const race = season.races.find((r) => r.round === round);
  if (!race) notFound();

  const circuit = getCircuitById(race.circuitId);
  const circuitName = circuit ? circuit.name : race.circuitId.replace(/-/g, " ");
  const circuitCountry = circuit?.country ?? "";

  const winner = race.results.find((r) => r.position === 1);
  const finishers = race.results.filter((r) => isFinished(r.status));

  return (
    <div>
      <PageHeader
        title={race.name}
        subtitle={`${circuitName}${circuitCountry ? ` - ${circuitCountry}` : ""} | ${formatDate(race.date)}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Seasons", href: "/seasons" },
          { label: String(year), href: `/seasons/${year}` },
          { label: `Round ${round}` },
        ]}
      />

      {/* Key stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {winner && (
          <StatCard
            label="Winner"
            value={driverDisplayName(winner.driverId)}
            teamColor={getTeamColor(winner.teamId)}
          />
        )}
        {winner && (
          <StatCard
            label="Winning Time"
            value={winner.time || "-"}
          />
        )}
        <StatCard
          label="Finishers"
          value={`${finishers.length} / ${race.results.length}`}
        />
        <StatCard
          label="Laps"
          value={winner?.laps ?? race.results[0]?.laps ?? "-"}
        />
      </div>

      {/* Race Results */}
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Trophy className="size-5 text-glow" />
          Race Results
        </h2>

        <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                <TableHead className="w-14 text-text-secondary">Pos</TableHead>
                <TableHead className="text-text-secondary">Driver</TableHead>
                <TableHead className="text-text-secondary">Team</TableHead>
                <TableHead className="text-right text-text-secondary">Grid</TableHead>
                <TableHead className="text-right text-text-secondary">Laps</TableHead>
                <TableHead className="text-text-secondary">Time / Status</TableHead>
                <TableHead className="text-right text-text-secondary">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {race.results.map((result) => {
                const finished = isFinished(result.status);
                return (
                  <TableRow
                    key={`${result.driverId}-${result.position}`}
                    className={`border-[rgba(255,255,255,0.06)] hover:bg-surface-2 ${!finished ? "opacity-60" : ""}`}
                    style={{ borderLeft: `4px solid ${getTeamColor(result.teamId)}` }}
                  >
                    <TableCell className="stats-number font-bold text-text-primary">
                      {result.position === 1 ? (
                        <span className="flex items-center gap-1">
                          <Trophy className="size-3.5 text-amber-400" />
                          {result.position}
                        </span>
                      ) : (
                        result.position
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/drivers/${result.driverId}`}
                        className="font-medium text-text-primary hover:text-glow"
                      >
                        {driverDisplayName(result.driverId)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/teams/${result.teamId}`}
                        className="text-text-secondary hover:text-glow"
                      >
                        {teamDisplayName(result.teamId)}
                      </Link>
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-secondary">
                      {result.grid > 0 ? result.grid : "PL"}
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-secondary">
                      {result.laps}
                    </TableCell>
                    <TableCell>
                      {finished ? (
                        <span className="stats-number text-text-primary">
                          {result.position === 1 ? result.time : result.time || result.status}
                        </span>
                      ) : (
                        <span className="text-danger">{result.status}</span>
                      )}
                    </TableCell>
                    <TableCell className="stats-number text-right font-medium text-text-primary">
                      {result.points > 0 ? result.points : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Qualifying Results */}
      {race.qualifying && race.qualifying.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Clock className="size-5 text-glow" />
            Qualifying
          </h2>

          <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                  <TableHead className="w-14 text-text-secondary">Pos</TableHead>
                  <TableHead className="text-text-secondary">Driver</TableHead>
                  <TableHead className="text-text-secondary">Team</TableHead>
                  <TableHead className="text-right text-text-secondary">Q1</TableHead>
                  <TableHead className="text-right text-text-secondary">Q2</TableHead>
                  <TableHead className="text-right text-text-secondary">Q3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {race.qualifying.map((q) => (
                  <TableRow
                    key={`qual-${q.driverId}`}
                    className="border-[rgba(255,255,255,0.06)] hover:bg-surface-2"
                    style={{ borderLeft: `4px solid ${getTeamColor(q.teamId)}` }}
                  >
                    <TableCell className="stats-number font-bold text-text-primary">
                      {q.position === 1 ? (
                        <span className="flex items-center gap-1">
                          <Gauge className="size-3.5 text-purple-400" />
                          {q.position}
                        </span>
                      ) : (
                        q.position
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/drivers/${q.driverId}`}
                        className="font-medium text-text-primary hover:text-glow"
                      >
                        {driverDisplayName(q.driverId)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/teams/${q.teamId}`}
                        className="text-text-secondary hover:text-glow"
                      >
                        {teamDisplayName(q.teamId)}
                      </Link>
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-secondary">
                      {q.q1 || "-"}
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-secondary">
                      {q.q2 || "-"}
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-primary">
                      {q.q3 || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Pit Stops */}
      {race.pitStops && race.pitStops.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Fuel className="size-5 text-amber-400" />
            Pit Stops
          </h2>

          <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                  <TableHead className="text-text-secondary">Driver</TableHead>
                  <TableHead className="text-right text-text-secondary">Stop</TableHead>
                  <TableHead className="text-right text-text-secondary">Lap</TableHead>
                  <TableHead className="text-right text-text-secondary">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupPitStops(race.pitStops).map((group) => (
                  group.stops.map((stop, stopIdx) => {
                    // Find the team for this driver from race results
                    const raceEntry = race.results.find(r => r.driverId === stop.driverId);
                    const teamId = raceEntry?.teamId ?? "";
                    const isFirstInGroup = stopIdx === 0;

                    return (
                      <TableRow
                        key={`pit-${stop.driverId}-${stop.stop}`}
                        className="border-[rgba(255,255,255,0.06)] hover:bg-surface-2"
                        style={{ borderLeft: `4px solid ${getTeamColor(teamId)}` }}
                      >
                        <TableCell>
                          {isFirstInGroup ? (
                            <Link
                              href={`/drivers/${stop.driverId}`}
                              className="font-medium text-text-primary hover:text-glow"
                            >
                              {driverShortName(stop.driverId)}
                            </Link>
                          ) : (
                            <span className="text-text-secondary/50" />
                          )}
                        </TableCell>
                        <TableCell className="stats-number text-right text-text-secondary">
                          {stop.stop}
                        </TableCell>
                        <TableCell className="stats-number text-right text-text-secondary">
                          {stop.lap}
                        </TableCell>
                        <TableCell className="stats-number text-right text-text-primary">
                          {stop.duration}s
                        </TableCell>
                      </TableRow>
                    );
                  })
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}

interface PitStopGroup {
  driverId: string;
  stops: PitStop[];
}

function groupPitStops(pitStops: PitStop[]): PitStopGroup[] {
  const groups = new Map<string, PitStop[]>();
  for (const stop of pitStops) {
    if (!groups.has(stop.driverId)) groups.set(stop.driverId, []);
    groups.get(stop.driverId)!.push(stop);
  }
  return Array.from(groups.entries()).map(([driverId, stops]) => ({
    driverId,
    stops: stops.sort((a, b) => a.stop - b.stop),
  }));
}
