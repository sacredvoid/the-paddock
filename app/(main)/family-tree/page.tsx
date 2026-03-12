import { getTeamLineages, getAllTeams } from "@/lib/data";
import { PageHeader } from "@/components/ui/page-header";
import { TreeVisualization } from "@/components/family-tree/tree-visualization";

export default function FamilyTreePage() {
  const lineages = getTeamLineages();
  const teams = getAllTeams();

  return (
    <div>
      <PageHeader
        title="Constructor Family Tree"
        subtitle="The evolution and lineage of F1 teams from 1950 to today"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Family Tree" },
        ]}
      />

      {/* Intro paragraph */}
      <div className="mb-6 max-w-3xl">
        <p className="text-sm leading-relaxed text-text-secondary">
          Formula 1 teams rarely disappear completely. Instead, they evolve
          through buyouts, rebrands, and ownership changes. A constructor&apos;s
          entry on the grid is inherited by whoever takes over the team&apos;s
          infrastructure, factory, and personnel. This timeline traces every
          current team back through its predecessors, showing how the grid we
          know today was shaped over more than seven decades of racing.
        </p>
      </div>

      {/* Interactive timeline */}
      <TreeVisualization lineages={lineages} teams={teams} />

      {/* Stats summary */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Lineages"
          value={lineages.length}
          detail="distinct team lines"
        />
        <SummaryCard
          label="Total Identities"
          value={lineages.reduce((sum, l) => sum + l.chain.length, 0)}
          detail="team names over the years"
        />
        <SummaryCard
          label="Longest Lineage"
          value={
            lineages.reduce((best, l) => {
              const span =
                l.chain[l.chain.length - 1].years[1] - l.chain[0].years[0] + 1;
              return span > best ? span : best;
            }, 0) + " yrs"
          }
          detail="from earliest predecessor"
        />
        <SummaryCard
          label="Most Rebrands"
          value={Math.max(...lineages.map((l) => l.chain.length))}
          detail="identities in one lineage"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-surface-1 p-4">
      <span className="section-label">{label}</span>
      <p className="mt-1 stats-number text-2xl font-bold text-text-primary">
        {value}
      </p>
      <span className="text-xs text-text-tertiary">{detail}</span>
    </div>
  );
}
