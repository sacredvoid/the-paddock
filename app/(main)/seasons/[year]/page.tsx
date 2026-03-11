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
import { Trophy, Calendar, Flag } from "lucide-react";
import type { Season, StandingEntry } from "@/lib/types";

function driverDisplayName(driverId: string): string {
  const driver = getDriverById(driverId);
  return driver ? `${driver.firstName} ${driver.lastName}` : driverId.replace(/-/g, " ");
}

function teamDisplayName(teamId: string): string {
  const team = getTeamById(teamId);
  return team ? team.name : teamId.replace(/-/g, " ");
}

function circuitDisplayName(circuitId: string): string {
  const circuit = getCircuitById(circuitId);
  return circuit ? circuit.name : circuitId.replace(/-/g, " ");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) notFound();

  let season: Season;
  try {
    season = await getSeason(year);
  } catch {
    notFound();
  }

  const champion = season.champion;
  const constructorChampion = season.constructorChampion;
  const totalRaces = season.races.length;
  const totalWinners = new Set(
    season.races
      .map((r) => r.results.find((res) => res.position === 1)?.driverId)
      .filter(Boolean)
  ).size;

  return (
    <div>
      <PageHeader
        title={`${year} Season`}
        subtitle={
          champion
            ? `Champion: ${driverDisplayName(champion.driverId)}`
            : "Season in progress"
        }
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Seasons", href: "/seasons" },
          { label: String(year) },
        ]}
      />

      {/* Stats overview */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Races"
          value={totalRaces}
          teamColor={champion ? getTeamColor(champion.teamId) : undefined}
        />
        <StatCard
          label="Different Winners"
          value={totalWinners}
        />
        {champion && (
          <StatCard
            label="Driver Champion"
            value={driverDisplayName(champion.driverId)}
            teamColor={getTeamColor(champion.teamId)}
          />
        )}
        {constructorChampion && (
          <StatCard
            label="Constructor Champion"
            value={teamDisplayName(constructorChampion.teamId)}
            teamColor={getTeamColor(constructorChampion.teamId)}
          />
        )}
      </div>

      {/* Race Calendar */}
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Calendar className="size-5 text-glow" />
          Race Calendar
        </h2>

        <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                <TableHead className="text-text-secondary">Rd</TableHead>
                <TableHead className="text-text-secondary">Grand Prix</TableHead>
                <TableHead className="text-text-secondary">Circuit</TableHead>
                <TableHead className="text-text-secondary">Date</TableHead>
                <TableHead className="text-text-secondary">Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {season.races.map((race) => {
                const winner = race.results.find((r) => r.position === 1);
                return (
                  <TableRow
                    key={race.round}
                    className="border-[rgba(255,255,255,0.06)] hover:bg-surface-2"
                  >
                    <TableCell className="stats-number text-text-secondary">
                      {race.round}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/seasons/${year}/${race.round}`}
                        className="font-medium text-text-primary hover:text-glow"
                      >
                        {race.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {circuitDisplayName(race.circuitId)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(race.date)}
                    </TableCell>
                    <TableCell>
                      {winner ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-1 rounded-full"
                            style={{ backgroundColor: getTeamColor(winner.teamId) }}
                          />
                          <Link
                            href={`/drivers/${winner.driverId}`}
                            className="text-text-primary hover:text-glow"
                          >
                            {driverDisplayName(winner.driverId)}
                          </Link>
                        </div>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Driver Championship Standings */}
      {season.driverStandings.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Trophy className="size-5 text-amber-400" />
            Driver Standings
          </h2>

          <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                  <TableHead className="w-16 text-text-secondary">Pos</TableHead>
                  <TableHead className="text-text-secondary">Driver</TableHead>
                  <TableHead className="text-right text-text-secondary">Points</TableHead>
                  <TableHead className="text-right text-text-secondary">Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {season.driverStandings.map((entry) => (
                  <DriverStandingRow
                    key={entry.id}
                    entry={entry}
                    isChampion={champion?.driverId === entry.id}
                    championTeamId={champion?.driverId === entry.id ? champion.teamId : null}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Constructor Championship Standings */}
      {season.constructorStandings.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Flag className="size-5 text-glow" />
            Constructor Standings
          </h2>

          <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)]">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.06)] bg-surface-2 hover:bg-surface-2">
                  <TableHead className="w-16 text-text-secondary">Pos</TableHead>
                  <TableHead className="text-text-secondary">Team</TableHead>
                  <TableHead className="text-right text-text-secondary">Points</TableHead>
                  <TableHead className="text-right text-text-secondary">Wins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {season.constructorStandings.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="border-[rgba(255,255,255,0.06)] hover:bg-surface-2"
                    style={{ borderLeft: `4px solid ${getTeamColor(entry.id)}` }}
                  >
                    <TableCell className="stats-number font-bold text-text-primary">
                      {entry.position === 1 ? (
                        <span className="flex items-center gap-1">
                          <Trophy className="size-3.5 text-amber-400" />
                          {entry.position}
                        </span>
                      ) : (
                        entry.position
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/teams/${entry.id}`}
                        className="font-medium text-text-primary hover:text-glow"
                      >
                        {teamDisplayName(entry.id)}
                      </Link>
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-primary">
                      {entry.points}
                    </TableCell>
                    <TableCell className="stats-number text-right text-text-secondary">
                      {entry.wins}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}

function DriverStandingRow({
  entry,
  isChampion,
  championTeamId,
}: {
  entry: StandingEntry;
  isChampion: boolean;
  championTeamId: string | null;
}) {
  // Try to find the driver's team from season data.
  // For the champion we know the team, for others we show name only.
  const teamColor = isChampion && championTeamId
    ? getTeamColor(championTeamId)
    : undefined;

  return (
    <TableRow
      className="border-[rgba(255,255,255,0.06)] hover:bg-surface-2"
      style={teamColor ? { borderLeft: `4px solid ${teamColor}` } : undefined}
    >
      <TableCell className="stats-number font-bold text-text-primary">
        {entry.position === 1 ? (
          <span className="flex items-center gap-1">
            <Trophy className="size-3.5 text-amber-400" />
            {entry.position}
          </span>
        ) : (
          entry.position
        )}
      </TableCell>
      <TableCell>
        <Link
          href={`/drivers/${entry.id}`}
          className="font-medium text-text-primary hover:text-glow"
        >
          {driverDisplayName(entry.id)}
        </Link>
      </TableCell>
      <TableCell className="stats-number text-right text-text-primary">
        {entry.points}
      </TableCell>
      <TableCell className="stats-number text-right text-text-secondary">
        {entry.wins}
      </TableCell>
    </TableRow>
  );
}
