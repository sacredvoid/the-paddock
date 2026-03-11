import Link from "next/link";
import Image from "next/image";
import {
  getActiveDrivers,
  getAllDrivers,
  getAllTeams,
  getAllCircuits,
  getSeason,
  getDriverById,
  getTeamById,
} from "@/lib/data";
import { getTeamColor } from "@/lib/team-colors";
import { getDriverImageUrl, getTeamLogoUrl } from "@/lib/images";
import { StatCard } from "@/components/ui/stat-card";
import { DriverCard } from "@/components/ui/driver-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  FlaskConical,
  GitBranch,
  ChevronRight,
  Flag,
} from "lucide-react";

const CHAMPION_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

async function getRecentChampions() {
  const champions = [];
  for (const year of CHAMPION_YEARS) {
    try {
      const season = await getSeason(year);
      if (season.champion) {
        const driver = getDriverById(season.champion.driverId);
        const team = getTeamById(season.champion.teamId);
        champions.push({
          year,
          driverId: season.champion.driverId,
          driverName: driver
            ? `${driver.firstName} ${driver.lastName}`
            : season.champion.driverId,
          driverSlug: driver?.slug ?? season.champion.driverId,
          teamName: team?.name ?? season.champion.teamId,
          teamSlug: team?.slug ?? season.champion.teamId,
          teamId: season.champion.teamId,
        });
      }
    } catch {
      // Season data not available, skip
    }
  }
  return champions;
}

const SECTIONS = [
  {
    label: "Drivers",
    href: "/drivers",
    icon: Users,
    description: "Every F1 driver from Fangio to the current grid",
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Flag,
    description: "Constructor histories, stats, and livery colors",
  },
  {
    label: "Circuits",
    href: "/circuits",
    icon: MapPin,
    description: "Track maps, lap records, and race history",
  },
  {
    label: "Seasons",
    href: "/seasons",
    icon: Calendar,
    description: "Full results and standings from 1950 to today",
  },
  {
    label: "Records",
    href: "/records",
    icon: Award,
    description: "All-time driver and constructor statistical records",
  },
  {
    label: "What If?",
    href: "/what-if",
    icon: FlaskConical,
    description: "Alternate-history scenarios and simulations",
  },
  {
    label: "Learn F1",
    href: "/learn",
    icon: GraduationCap,
    description: "Rules, flags, tire compounds, and DRS explained",
  },
  {
    label: "Family Tree",
    href: "/family-tree",
    icon: GitBranch,
    description: "How modern teams trace back through F1 history",
  },
];

export default async function Home() {
  const season2025 = await getSeason(2025);
  const activeDrivers = getActiveDrivers();
  const allDrivers = getAllDrivers();
  const allTeams = getAllTeams();
  const allCircuits = getAllCircuits();
  const recentChampions = await getRecentChampions();

  // Build a map of driverId -> teamId from 2025 race results (latest race appearance)
  const driverTeamMap = new Map<string, string>();
  for (const race of season2025.races) {
    for (const result of race.results) {
      driverTeamMap.set(result.driverId, result.teamId);
    }
  }

  // Top 5 active drivers by wins
  const topDrivers = activeDrivers
    .filter((d) => d.stats)
    .sort((a, b) => (b.stats?.wins ?? 0) - (a.stats?.wins ?? 0))
    .slice(0, 5);

  // Season stats
  const totalRaces = season2025.races.length;
  const differentWinners = new Set(
    season2025.races.flatMap((r) =>
      r.results.filter((res) => res.position === 1).map((res) => res.driverId)
    )
  ).size;

  // Constructor champion
  const constructorChampion = season2025.constructorChampion
    ? getTeamById(season2025.constructorChampion.teamId)
    : null;

  // Driver champion
  const driverChampion = season2025.champion
    ? getDriverById(season2025.champion.driverId)
    : null;
  const driverChampionTeam = season2025.champion
    ? getTeamById(season2025.champion.teamId)
    : null;

  return (
    <div>
      {/* Hero section */}
      <section className="carbon-fiber relative -mx-4 -mt-8 flex flex-col items-center justify-center gap-6 px-6 py-24">
        <h1
          className="text-center text-5xl font-black tracking-tight text-text-primary md:text-7xl"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          THE <span className="text-f1-red">PADDOCK</span>
        </h1>
        <p className="max-w-xl text-center text-lg text-text-secondary">
          The complete Formula 1 encyclopedia. {allDrivers.length} drivers,{" "}
          {allTeams.length} constructors, {allCircuits.length} circuits, and 75+
          years of racing history.
        </p>
        <div className="h-1 w-24 rounded bg-f1-red" />

        {/* Quick stat pills */}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-sm text-text-secondary">
            <span className="stats-number font-bold text-text-primary">{allDrivers.length}</span> Drivers
          </span>
          <span className="rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-sm text-text-secondary">
            <span className="stats-number font-bold text-text-primary">{allTeams.length}</span> Constructors
          </span>
          <span className="rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-sm text-text-secondary">
            <span className="stats-number font-bold text-text-primary">{allCircuits.length}</span> Circuits
          </span>
          <span className="rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-sm text-text-secondary">
            <span className="stats-number font-bold text-text-primary">1950&ndash;2026</span> Seasons
          </span>
        </div>
      </section>

      <div className="dot-grid -mx-4 px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-16">

          {/* 2025 Season Stats */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-f1-red" />
                <h2
                  className="text-2xl font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  2025 Season
                </h2>
              </div>
              <Link
                href="/seasons/2025"
                className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-f1-red transition-colors"
              >
                Full standings <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="World Champion"
                value={driverChampion ? driverChampion.lastName : "TBD"}
                teamColor={
                  driverChampionTeam
                    ? getTeamColor(driverChampionTeam.id)
                    : undefined
                }
              />
              <StatCard
                label="Constructor Champion"
                value={constructorChampion?.name ?? "TBD"}
                teamColor={
                  constructorChampion
                    ? getTeamColor(constructorChampion.id)
                    : undefined
                }
              />
              <StatCard
                label="Races"
                value={totalRaces}
              />
              <StatCard
                label="Different Winners"
                value={differentWinners}
              />
            </div>

            {/* Top 5 in standings */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="border-border-subtle bg-surface">
                <CardContent>
                  <h3 className="mb-3 text-sm font-medium text-text-secondary">
                    Driver Standings
                  </h3>
                  <div className="space-y-2">
                    {season2025.driverStandings.slice(0, 5).map((entry) => {
                      const driver = getDriverById(entry.id);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3"
                        >
                          <span className="stats-number w-5 text-right text-sm font-bold text-text-secondary">
                            {entry.position}
                          </span>
                          {driver ? (
                            <Link
                              href={`/drivers/${driver.slug}`}
                              className="flex-1 text-sm font-medium text-text-primary hover:text-f1-red transition-colors"
                            >
                              {driver.firstName} {driver.lastName}
                            </Link>
                          ) : (
                            <span className="flex-1 text-sm text-text-primary">
                              {entry.id}
                            </span>
                          )}
                          <span className="stats-number text-sm font-bold text-text-primary">
                            {entry.points}
                          </span>
                          <span className="text-xs text-text-secondary">
                            pts
                          </span>
                          {entry.wins > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-text-secondary">
                              <Trophy className="size-3 text-f1-red" />
                              {entry.wins}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border-subtle bg-surface">
                <CardContent>
                  <h3 className="mb-3 text-sm font-medium text-text-secondary">
                    Constructor Standings
                  </h3>
                  <div className="space-y-2">
                    {season2025.constructorStandings.slice(0, 5).map((entry) => {
                      const team = getTeamById(entry.id);
                      const color = getTeamColor(entry.id);
                      const teamLogoUrl = getTeamLogoUrl(entry.id);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3"
                        >
                          <span className="stats-number w-5 text-right text-sm font-bold text-text-secondary">
                            {entry.position}
                          </span>
                          <div
                            className="h-3 w-1 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {teamLogoUrl && (
                            <Image
                              src={teamLogoUrl}
                              alt={team?.name ?? entry.id}
                              width={20}
                              height={20}
                              className="shrink-0"
                            />
                          )}
                          {team ? (
                            <Link
                              href={`/teams/${team.slug}`}
                              className="flex-1 text-sm font-medium text-text-primary hover:text-f1-red transition-colors"
                            >
                              {team.name}
                            </Link>
                          ) : (
                            <span className="flex-1 text-sm text-text-primary">
                              {entry.id}
                            </span>
                          )}
                          <span className="stats-number text-sm font-bold text-text-primary">
                            {entry.points}
                          </span>
                          <span className="text-xs text-text-secondary">
                            pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Featured Drivers */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-f1-red" />
                <h2
                  className="text-2xl font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  Top Active Drivers
                </h2>
              </div>
              <Link
                href="/drivers"
                className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-f1-red transition-colors"
              >
                All drivers <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {topDrivers.map((driver) => {
                const imageUrl = getDriverImageUrl(driver.id);
                return (
                  <DriverCard
                    key={driver.slug}
                    imageUrl={imageUrl ?? undefined}
                    driver={{
                      slug: driver.slug,
                      firstName: driver.firstName,
                      lastName: driver.lastName,
                      code: driver.code,
                      number: typeof driver.number === "string" ? parseInt(driver.number, 10) : driver.number,
                      nationality: driver.nationality,
                      teamId: driverTeamMap.get(driver.id),
                      stats: {
                        wins: driver.stats?.wins ?? 0,
                        championships: driver.stats?.championships ?? 0,
                      },
                    }}
                  />
                );
              })}
            </div>
          </section>

          {/* Recent Champions */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-accent" />
                <h2
                  className="text-2xl font-bold text-text-primary"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  Recent World Champions
                </h2>
              </div>
              <Link
                href="/seasons"
                className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-f1-red transition-colors"
              >
                All seasons <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recentChampions.map((champ) => {
                const teamColor = getTeamColor(champ.teamId);
                const champImageUrl = getDriverImageUrl(champ.driverId);
                return (
                  <Link
                    key={champ.year}
                    href={`/seasons/${champ.year}`}
                    className="block"
                  >
                    <Card
                      className="border-border-subtle bg-surface transition-transform duration-200 hover:-translate-y-0.5"
                      style={{ borderLeft: `4px solid ${teamColor}` }}
                    >
                      <CardContent className="flex items-center gap-4">
                        <span
                          className="stats-number text-3xl font-black text-text-secondary"
                        >
                          {champ.year}
                        </span>
                        {champImageUrl ? (
                          <Image
                            src={champImageUrl}
                            alt={champ.driverName}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div
                            className="flex size-8 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated"
                          >
                            <span className="text-xs font-bold text-text-secondary">
                              {champ.driverName.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-text-primary">
                            {champ.driverName}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {champ.teamName}
                          </p>
                        </div>
                        <Trophy
                          className="size-5"
                          style={{ color: teamColor }}
                        />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Explore Sections */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-f1-red" />
              <h2
                className="text-2xl font-bold text-text-primary"
                style={{ fontFamily: "var(--font-titillium)" }}
              >
                Explore
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link key={section.href} href={section.href} className="block">
                    <Card className="h-full border-border-subtle bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-f1-red/30">
                      <CardContent className="flex flex-col gap-3">
                        <Icon className="size-6 text-f1-red" />
                        <div>
                          <h3
                            className="font-bold text-text-primary"
                            style={{ fontFamily: "var(--font-titillium)" }}
                          >
                            {section.label}
                          </h3>
                          <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                            {section.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
