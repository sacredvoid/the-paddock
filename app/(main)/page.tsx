import { StatCard } from "@/components/ui/stat-card";
import { DriverCard } from "@/components/ui/driver-card";
import { CircuitMiniMap } from "@/components/ui/circuit-mini-map";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonChart } from "@/components/ui/skeleton-chart";
import { TEAM_COLORS } from "@/lib/team-colors";

const sampleDrivers = [
  {
    slug: "max-verstappen",
    firstName: "Max",
    lastName: "Verstappen",
    code: "VER",
    number: 1,
    nationality: "Dutch",
    teamId: "red_bull",
    stats: { wins: 63, championships: 4 },
  },
  {
    slug: "lewis-hamilton",
    firstName: "Lewis",
    lastName: "Hamilton",
    code: "HAM",
    number: 44,
    nationality: "British",
    teamId: "ferrari",
    stats: { wins: 103, championships: 7 },
  },
  {
    slug: "lando-norris",
    firstName: "Lando",
    lastName: "Norris",
    code: "NOR",
    number: 4,
    nationality: "British",
    teamId: "mclaren",
    stats: { wins: 7, championships: 0 },
  },
  {
    slug: "charles-leclerc",
    firstName: "Charles",
    lastName: "Leclerc",
    code: "LEC",
    number: 16,
    nationality: "Monegasque",
    teamId: "ferrari",
    stats: { wins: 8, championships: 0 },
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero section with carbon fiber texture */}
      <section className="carbon-fiber relative -mx-4 -mt-8 flex flex-col items-center justify-center gap-8 px-6 py-24">
        <h1
          className="text-center text-5xl font-black tracking-tight text-text-primary md:text-7xl"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          THE <span className="text-f1-red">PADDOCK</span>
        </h1>
        <p className="max-w-lg text-center text-lg text-text-secondary">
          Everything about Formula 1. Drivers, circuits, race analysis,
          historical records, and interactive visualizations.
        </p>
        <div className="h-1 w-24 rounded bg-f1-red" />
      </section>

      {/* Component Showcase */}
      <section className="dot-grid -mx-4 px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* Stat Cards */}
          <div>
            <PageHeader
              title="Season Statistics"
              subtitle="Key numbers from the 2024 Formula 1 season"
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Race Wins"
                value={63}
                trend="up"
                teamColor={TEAM_COLORS.red_bull.primary}
              />
              <StatCard
                label="Championships"
                value={7}
                trend="neutral"
                teamColor={TEAM_COLORS.ferrari.primary}
              />
              <StatCard
                label="Podiums"
                value={202}
                trend="up"
                teamColor={TEAM_COLORS.mclaren.primary}
              />
              <StatCard
                label="DNFs"
                value={12}
                trend="down"
                teamColor={TEAM_COLORS.mercedes.primary}
              />
            </div>
          </div>

          {/* Driver Cards */}
          <div>
            <PageHeader
              title="Featured Drivers"
              subtitle="Current grid highlights"
              breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Drivers", href: "/drivers" },
                { label: "Featured" },
              ]}
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {sampleDrivers.map((driver) => (
                <DriverCard key={driver.slug} driver={driver} />
              ))}
            </div>
          </div>

          {/* Circuit Mini Maps */}
          <div>
            <PageHeader title="Circuit Outlines" />
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <CircuitMiniMap />
                <span className="text-xs text-text-secondary">
                  Placeholder
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CircuitMiniMap
                  svgPath="M 10 50 C 20 10, 40 10, 50 30 S 80 80, 90 50"
                  width={80}
                  height={80}
                />
                <span className="text-xs text-text-secondary">
                  Custom Path
                </span>
              </div>
            </div>
          </div>

          {/* Skeleton Charts */}
          <div>
            <PageHeader
              title="Loading States"
              subtitle="Skeleton placeholders for charts"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-sm text-text-secondary">Bar Chart</p>
                <SkeletonChart type="bar" />
              </div>
              <div>
                <p className="mb-2 text-sm text-text-secondary">Line Chart</p>
                <SkeletonChart type="line" />
              </div>
              <div>
                <p className="mb-2 text-sm text-text-secondary">Radar Chart</p>
                <SkeletonChart type="radar" />
              </div>
            </div>
          </div>

          {/* Team colors preview */}
          <div>
            <PageHeader title="Team Colors" />
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Red Bull", color: "#3671C6" },
                { name: "Mercedes", color: "#27F4D2" },
                { name: "Ferrari", color: "#E8002D" },
                { name: "McLaren", color: "#FF8000" },
                { name: "Aston Martin", color: "#229971" },
                { name: "Alpine", color: "#FF87BC" },
                { name: "Williams", color: "#64C4FF" },
                { name: "RB", color: "#6692FF" },
                { name: "Kick Sauber", color: "#52E252" },
                { name: "Haas", color: "#B6BABD" },
              ].map((team) => (
                <div
                  key={team.name}
                  className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-sm text-text-primary">{team.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
