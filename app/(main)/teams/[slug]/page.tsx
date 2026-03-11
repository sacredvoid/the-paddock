import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTeam, getAllTeams, getTeamDrivers, getDriverById } from "@/lib/data";
import { getTeamLogoUrl, getDriverImageUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Flag, Calendar, Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return getAllTeams().map((t) => ({ slug: t.slug }));
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const team = getTeam(slug);

  if (!team) {
    notFound();
  }

  const color = team.color || "#888888";
  const logoUrl = getTeamLogoUrl(team.id);
  const stats = team.stats;
  const topDrivers = getTeamDrivers(team.id);
  const yearsActive = stats
    ? `${stats.firstEntry}-${stats.lastEntry}`
    : "Unknown";
  const yearSpan = stats ? stats.lastEntry - stats.firstEntry + 1 : 0;

  return (
    <div>
      <PageHeader
        title={team.name}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Teams", href: "/teams" },
          { label: team.name },
        ]}
      />

      {/* Team logo + color accent bar */}
      <div className="mb-8 flex items-center gap-5">
        {logoUrl ? (
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-3">
            <Image
              src={logoUrl}
              alt={`${team.name} logo`}
              width={80}
              height={80}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div
          className="h-1.5 w-32 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Team identity section */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Flag className="size-4" />
          <span className="text-sm">{team.nationality}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="size-4" />
          <span className="text-sm">
            {yearsActive} ({yearSpan} {yearSpan === 1 ? "year" : "years"})
          </span>
        </div>
        {team.isActive ? (
          <Badge
            variant="outline"
            className="border-glow/30 text-glow"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-[rgba(255,255,255,0.06)] text-text-secondary"
          >
            Historic
          </Badge>
        )}
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-text-primary">
            Career Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Championships"
              value={stats.championships}
              teamColor={color}
            />
            <StatCard
              label="Race Wins"
              value={stats.wins}
              teamColor={color}
            />
            <StatCard
              label="Podiums"
              value={stats.podiums}
              teamColor={color}
            />
            <StatCard
              label="Pole Positions"
              value={stats.poles}
              teamColor={color}
            />
            <StatCard
              label="Races Entered"
              value={stats.races}
              teamColor={color}
            />
            <StatCard
              label="Total Points"
              value={stats.points.toLocaleString()}
              teamColor={color}
            />
          </div>
        </div>
      )}

      {/* Derived stats section */}
      {stats && stats.races > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-text-primary">
            Performance Rates
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
              <p className="text-sm text-text-secondary">Win Rate</p>
              <p className="stats-number mt-1 text-2xl font-bold text-text-primary">
                {((stats.wins / stats.races) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
              <p className="text-sm text-text-secondary">Podium Rate</p>
              <p className="stats-number mt-1 text-2xl font-bold text-text-primary">
                {((stats.podiums / stats.races) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
              <p className="text-sm text-text-secondary">
                Points per Race
              </p>
              <p className="stats-number mt-1 text-2xl font-bold text-text-primary">
                {(stats.points / stats.races).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Drivers */}
      {topDrivers.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text-primary">
            Top Drivers
          </h2>
          <div className="space-y-2">
            {topDrivers.map((td, i) => {
              const driver = getDriverById(td.driverId);
              const imageUrl = getDriverImageUrl(td.driverId);
              const driverSlug = driver?.slug ?? td.driverId;
              return (
                <Link
                  key={td.driverId}
                  href={`/drivers/${driverSlug}`}
                  className="flex items-center gap-4 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-3 card-glow"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  {/* Rank */}
                  <span className="stats-number w-6 text-center text-sm font-bold text-text-secondary">
                    {i + 1}
                  </span>

                  {/* Driver photo */}
                  {imageUrl ? (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-[rgba(255,255,255,0.06)]">
                      <Image
                        src={imageUrl}
                        alt={`${td.firstName} ${td.lastName}`}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.06)] bg-surface-2 text-xs font-bold text-text-secondary">
                      {td.firstName[0]}{td.lastName[0]}
                    </div>
                  )}

                  {/* Name + years */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {td.firstName} {td.lastName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {td.yearStart}-{td.yearEnd}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {td.wins > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="size-3.5 text-glow" />
                        <span className="stats-number font-bold text-text-primary">{td.wins}</span>
                        <span className="text-xs text-text-secondary">wins</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Medal className="size-3.5 text-text-secondary" />
                      <span className="stats-number font-bold text-text-primary">{td.podiums}</span>
                      <span className="text-xs text-text-secondary">podiums</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="stats-number text-text-primary">{td.races}</span>
                      <span className="text-xs text-text-secondary">races</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
