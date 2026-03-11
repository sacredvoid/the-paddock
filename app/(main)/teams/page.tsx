import { getAllTeams } from "@/lib/data";
import { getTeamLogoUrl } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { TeamsList } from "./teams-list";

export default function TeamsPage() {
  const teams = getAllTeams();

  const activeTeams = teams.filter((t) => t.isActive);
  const totalChampionships = teams.reduce(
    (sum, t) => sum + (t.stats?.championships ?? 0),
    0
  );

  // Find most successful team by championship count
  const mostSuccessful = teams.reduce((best, t) => {
    const current = t.stats?.championships ?? 0;
    const bestSoFar = best.stats?.championships ?? 0;
    return current > bestSoFar ? t : best;
  }, teams[0]);

  return (
    <div>
      <PageHeader
        title="Constructors"
        subtitle="Every team that has competed in the Formula 1 World Championship"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Teams" },
        ]}
      />

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Teams" value={teams.length} />
        <StatCard
          label="Active Teams"
          value={activeTeams.length}
          teamColor="#00D2BE"
        />
        <StatCard
          label="Total Championships"
          value={totalChampionships}
          teamColor="#FF6B2C"
        />
        <StatCard
          label="Most Successful"
          value={mostSuccessful?.name ?? "-"}
          teamColor={mostSuccessful?.color}
        />
      </div>

      {/* Filterable team grid (client component) */}
      <TeamsList
        teams={teams}
        logoUrls={Object.fromEntries(
          teams.map((t) => [t.id, getTeamLogoUrl(t.id)])
        )}
      />
    </div>
  );
}
