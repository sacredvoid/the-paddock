import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getDriver, getAllDrivers } from "@/lib/data";
import { getDriverImageUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, Calendar, Hash, Target } from "lucide-react";

// ---------------------------------------------------------------------------
// Static params for build-time generation
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getAllDrivers().map((d) => ({ slug: d.slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const driver = getDriver(slug);
  if (!driver) return { title: "Driver Not Found | The Paddock" };

  const fullName = `${driver.firstName} ${driver.lastName}`;
  return {
    title: `${fullName} | The Paddock`,
    description: `Career stats and profile for ${fullName} - ${driver.nationality} Formula 1 driver.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const driver = getDriver(slug);

  if (!driver) notFound();

  const fullName = `${driver.firstName} ${driver.lastName}`;
  const stats = driver.stats;
  const imageUrl = getDriverImageUrl(driver.slug);

  // Format date of birth nicely
  const dob = new Date(driver.dateOfBirth);
  const formattedDob = dob.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Sort seasons for display
  const sortedSeasons = [...driver.seasons].sort((a, b) => a - b);
  const firstSeason = sortedSeasons[0];
  const lastSeason = sortedSeasons[sortedSeasons.length - 1];

  return (
    <div>
      {/* Breadcrumbs + Header */}
      <PageHeader
        title={fullName}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Drivers", href: "/drivers" },
          { label: fullName },
        ]}
      />

      {/* Driver Identity Section */}
      <section className="mb-10">
        <div className="rounded-xl border border-border-subtle bg-surface p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            {/* Left: headshot + driver info */}
            <div className="flex items-start gap-6">
              {/* Headshot */}
              <div className="relative size-[120px] shrink-0 overflow-hidden rounded-full border-2 border-border-subtle bg-surface-elevated md:size-[160px]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={fullName}
                    width={200}
                    height={200}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    {driver.number && driver.number !== "0" ? (
                      <span className="stats-number text-4xl font-black text-f1-red md:text-5xl">
                        {driver.number}
                      </span>
                    ) : (
                      <span className="text-3xl font-bold text-text-secondary md:text-4xl">
                        {driver.firstName.charAt(0)}
                        {driver.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                {/* Number + Code */}
                <div className="flex items-center gap-4">
                  {driver.number && driver.number !== "0" && (
                    <span
                      className="stats-number text-5xl font-black text-f1-red md:text-6xl"
                    >
                      #{driver.number}
                    </span>
                  )}
                  {driver.code && (
                    <span
                      className="stats-number rounded-md border border-border-subtle bg-surface-elevated px-3 py-1 text-2xl font-bold tracking-widest text-text-primary"
                    >
                      {driver.code}
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Flag className="size-4" />
                    {driver.nationality}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {formattedDob}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Hash className="size-4" />
                    {sortedSeasons.length} season{sortedSeasons.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: status badge */}
            <div>
              <Badge
                variant={driver.isActive ? "default" : "secondary"}
                className={
                  driver.isActive
                    ? "bg-green-600 text-white"
                    : "bg-surface-elevated text-text-secondary"
                }
              >
                {driver.isActive ? "Active" : "Historic"}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      {stats && (
        <section className="mb-10">
          <h2
            className="mb-4 text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-titillium)" }}
          >
            Career Statistics
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <StatCard
              label="Championships"
              value={stats.championships}
              teamColor="#E10600"
            />
            <StatCard
              label="Wins"
              value={stats.wins}
              teamColor="#FFD700"
            />
            <StatCard
              label="Podiums"
              value={stats.podiums}
              teamColor="#CD7F32"
            />
            <StatCard
              label="Pole Positions"
              value={stats.poles}
              teamColor="#00D2BE"
            />
            <StatCard
              label="Fastest Laps"
              value={stats.fastestLaps}
              teamColor="#FF8000"
            />
            <StatCard
              label="Race Entries"
              value={stats.races}
              teamColor="#3671C6"
            />
            <StatCard
              label="Career Points"
              value={stats.points.toLocaleString()}
              teamColor="#27F4D2"
            />
            <StatCard
              label="DNFs"
              value={stats.dnfs}
              teamColor="#888888"
            />
            <StatCard
              label="Win Rate"
              value={`${(stats.winRate * 100).toFixed(1)}%`}
              teamColor="#E10600"
            />
            <StatCard
              label="Podium Rate"
              value={`${(stats.podiumRate * 100).toFixed(1)}%`}
              teamColor="#FFD700"
            />
          </div>
        </section>
      )}

      {/* Career Overview */}
      <section className="mb-10">
        <h2
          className="mb-4 text-2xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          Career Overview
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Key figures */}
          {stats && (
            <Card className="border-border-subtle bg-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text-primary">
                  <Target className="size-5 text-f1-red" />
                  Key Figures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between border-b border-border-subtle pb-2">
                    <dt className="text-text-secondary">Best Finish</dt>
                    <dd className="stats-number font-semibold text-text-primary">
                      P{stats.bestFinish}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-2">
                    <dt className="text-text-secondary">Avg. Finish</dt>
                    <dd className="stats-number font-semibold text-text-primary">
                      P{stats.averageFinish.toFixed(1)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-2">
                    <dt className="text-text-secondary">Points per Race</dt>
                    <dd className="stats-number font-semibold text-text-primary">
                      {(stats.points / stats.races).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Finish Rate</dt>
                    <dd className="stats-number font-semibold text-text-primary">
                      {(((stats.races - stats.dnfs) / stats.races) * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Seasons active */}
          <Card className="border-border-subtle bg-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Calendar className="size-5 text-accent" />
                Seasons Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-text-secondary">
                {firstSeason} - {driver.isActive ? "present" : lastSeason}
                <span className="ml-2 text-text-primary">
                  ({sortedSeasons.length} season{sortedSeasons.length !== 1 ? "s" : ""})
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sortedSeasons.map((year) => (
                  <Link
                    key={year}
                    href={`/seasons/${year}`}
                    className="rounded-md border border-border-subtle bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-f1-red hover:text-text-primary"
                  >
                    {year}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
