import { getAllDrivers, getActiveDrivers } from "@/lib/data";
import { getDriverImageUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DriversListClient } from "./drivers-list-client";

export const metadata = {
  title: "Drivers | The Paddock",
  description:
    "Browse every Formula 1 driver in history, from the current grid to the legends of the sport.",
};

export default function DriversPage() {
  const allDrivers = getAllDrivers();
  const activeDrivers = getActiveDrivers();

  // Compute summary stats
  const totalChampionships = allDrivers.reduce(
    (sum, d) => sum + (d.stats?.championships ?? 0),
    0
  );
  const totalWins = allDrivers.reduce(
    (sum, d) => sum + (d.stats?.wins ?? 0),
    0
  );

  // Get unique nationalities sorted alphabetically
  const nationalities = [
    ...new Set(allDrivers.map((d) => d.nationality)),
  ].sort();

  // Build a mapping of driver slug to headshot image URL
  const driverImageUrls: Record<string, string> = {};
  for (const d of allDrivers) {
    const url = getDriverImageUrl(d.slug);
    if (url) driverImageUrls[d.slug] = url;
  }

  // Prepare serializable driver data for the client component
  const driversForClient = allDrivers.map((d) => ({
    slug: d.slug,
    firstName: d.firstName,
    lastName: d.lastName,
    code: d.code,
    number: typeof d.number === "string" ? parseInt(d.number, 10) : d.number,
    nationality: d.nationality,
    isActive: d.isActive,
    stats: {
      wins: d.stats?.wins ?? 0,
      championships: d.stats?.championships ?? 0,
      races: d.stats?.races ?? 0,
      podiums: d.stats?.podiums ?? 0,
      points: d.stats?.points ?? 0,
    },
  }));

  return (
    <div>
      {/* Header */}
      <section className="mb-10">
        <PageHeader
          title="Drivers"
          subtitle="Every driver who has competed in Formula 1, from the pioneers of the 1950s to today's grid."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Drivers" },
          ]}
        />
      </section>

      {/* Summary stats */}
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Drivers"
            value={allDrivers.length.toLocaleString()}
            teamColor="#E10600"
          />
          <StatCard
            label="Active Drivers"
            value={activeDrivers.length}
            teamColor="#00D2BE"
          />
          <StatCard
            label="World Championships"
            value={totalChampionships}
            teamColor="#FF8000"
          />
          <StatCard
            label="Race Victories"
            value={totalWins.toLocaleString()}
            teamColor="#3671C6"
          />
        </div>
      </section>

      {/* Interactive driver list */}
      <section>
        <DriversListClient
          drivers={driversForClient}
          nationalities={nationalities}
          driverImageUrls={driverImageUrls}
        />
      </section>
    </div>
  );
}
