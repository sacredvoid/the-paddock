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
  AnimatedHero,
  AnimatedStatPill,
  AnimatedSection,
  AnimatedCardGrid,
  AnimatedCard,
} from "@/components/home/home-animations";
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
      <section className="hero-gradient relative -mx-4 -mt-8 flex flex-col items-center justify-center gap-6 px-6 py-24">
        <AnimatedHero>
          <h1
            className="text-center text-6xl font-black tracking-tight text-text-primary md:text-7xl"
          >
            THE <span className="text-glow">PADDOCK</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-text-secondary">
            The complete Formula 1 encyclopedia. {allDrivers.length} drivers,{" "}
            {allTeams.length} constructors, {allCircuits.length} circuits, and 75+
            years of racing history.
          </p>
        </AnimatedHero>
      </section>

      {/* Quick stat pills */}
      <div className="flex flex-wrap justify-center gap-3 py-6">
        <AnimatedStatPill value={allDrivers.length} label="Drivers" index={0} />
        <AnimatedStatPill value={allTeams.length} label="Constructors" index={1} />
        <AnimatedStatPill value={allCircuits.length} label="Circuits" index={2} />
        <AnimatedStatPill isRange rangeText="1950&ndash;2026" label="Seasons" index={3} />
      </div>

      <div className="mx-auto max-w-6xl space-y-16 py-16">

          {/* 2025 Season Stats */}
          <AnimatedSection>
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="section-label">Current Season</span>
                  <h2 className="text-2xl font-bold text-text-primary">
                    2025 Season
                  </h2>
                </div>
                <Link
                  href="/seasons/2025"
                  className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-glow transition-colors"
                >
                  Full standings <ChevronRight className="size-4" />
                </Link>
              </div>
              <AnimatedCardGrid className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <AnimatedCard>
                  <StatCard
                    label="World Champion"
                    value={driverChampion ? driverChampion.lastName : "TBD"}
                    teamColor={
                      driverChampionTeam
                        ? getTeamColor(driverChampionTeam.id)
                        : undefined
                    }
                  />
                </AnimatedCard>
                <AnimatedCard>
                  <StatCard
                    label="Constructor Champion"
                    value={constructorChampion?.name ?? "TBD"}
                    teamColor={
                      constructorChampion
                        ? getTeamColor(constructorChampion.id)
                        : undefined
                    }
                  />
                </AnimatedCard>
                <AnimatedCard>
                  <StatCard
                    label="Races"
                    value={totalRaces}
                  />
                </AnimatedCard>
                <AnimatedCard>
                  <StatCard
                    label="Different Winners"
                    value={differentWinners}
                  />
                </AnimatedCard>
              </AnimatedCardGrid>

              {/* Top 5 in standings */}
              <AnimatedCardGrid className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <AnimatedCard>
                  <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
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
                                  className="flex-1 text-sm font-medium text-text-primary hover:text-glow transition-colors"
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
                                  <Trophy className="size-3 text-glow" />
                                  {entry.wins}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                <AnimatedCard>
                  <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
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
                                  className="flex-1 text-sm font-medium text-text-primary hover:text-glow transition-colors"
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
                </AnimatedCard>
              </AnimatedCardGrid>
            </section>
          </AnimatedSection>

          {/* Featured Drivers */}
          <AnimatedSection>
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="section-label">Featured</span>
                  <h2 className="text-2xl font-bold text-text-primary">
                    Top Active Drivers
                  </h2>
                </div>
                <Link
                  href="/drivers"
                  className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-glow transition-colors"
                >
                  All drivers <ChevronRight className="size-4" />
                </Link>
              </div>
              <AnimatedCardGrid className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {topDrivers.map((driver) => {
                  const imageUrl = getDriverImageUrl(driver.id);
                  return (
                    <AnimatedCard key={driver.slug}>
                      <DriverCard
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
                    </AnimatedCard>
                  );
                })}
              </AnimatedCardGrid>
            </section>
          </AnimatedSection>

          {/* Recent Champions */}
          <AnimatedSection>
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="section-label">History</span>
                  <h2 className="text-2xl font-bold text-text-primary">
                    Recent World Champions
                  </h2>
                </div>
                <Link
                  href="/seasons"
                  className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-glow transition-colors"
                >
                  All seasons <ChevronRight className="size-4" />
                </Link>
              </div>
              <AnimatedCardGrid className="grid gap-3 md:grid-cols-2" staggerDelay={0.04}>
                {recentChampions.map((champ) => {
                  const teamColor = getTeamColor(champ.teamId);
                  const champImageUrl = getDriverImageUrl(champ.driverId);
                  return (
                    <AnimatedCard key={champ.year}>
                      <Link
                        href={`/seasons/${champ.year}`}
                        className="block"
                      >
                        <Card
                          className="card-glow border-[rgba(255,255,255,0.06)] bg-surface-1"
                          style={{ borderLeft: `4px solid ${teamColor}` }}
                        >
                          <CardContent className="flex items-center gap-4">
                            <span
                              className="stats-number text-3xl font-black text-text-tertiary"
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
                                className="flex size-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.06)] bg-surface-2"
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
                    </AnimatedCard>
                  );
                })}
              </AnimatedCardGrid>
            </section>
          </AnimatedSection>

          {/* Explore Sections */}
          <AnimatedSection>
            <section>
              <div className="mb-6">
                <span className="section-label">Navigate</span>
                <h2 className="text-2xl font-bold text-text-primary">
                  Explore
                </h2>
              </div>
              <AnimatedCardGrid className="grid grid-cols-2 gap-4 md:grid-cols-4" staggerDelay={0.05}>
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <AnimatedCard key={section.href}>
                      <Link href={section.href} className="block">
                        <Card className="card-glow h-full border-[rgba(255,255,255,0.06)] bg-surface-1">
                          <CardContent className="flex flex-col gap-3">
                            <Icon className="size-6 text-glow" />
                            <div>
                              <h3
                                className="font-bold text-text-primary"
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
                    </AnimatedCard>
                  );
                })}
              </AnimatedCardGrid>
            </section>
          </AnimatedSection>
      </div>
    </div>
  );
}
