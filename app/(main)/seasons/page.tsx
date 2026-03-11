import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getAvailableSeasons, getSeason } from "@/lib/data";
import { getDriverById, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/team-colors";
import { Trophy, Flag, ChevronRight } from "lucide-react";

// Only load champion info for recent seasons to keep the build fast
const CHAMPION_CUTOFF = 15;

interface SeasonCardData {
  year: number;
  championName: string | null;
  teamName: string | null;
  teamId: string | null;
  raceCount: number | null;
}

async function getRecentSeasonData(year: number): Promise<SeasonCardData> {
  try {
    const season = await getSeason(year);
    const champion = season.champion;
    let championName: string | null = null;
    let teamName: string | null = null;
    let teamId: string | null = null;

    if (champion) {
      const driver = getDriverById(champion.driverId);
      championName = driver
        ? `${driver.firstName} ${driver.lastName}`
        : champion.driverId.replace(/-/g, " ");
      const team = getTeamById(champion.teamId);
      teamName = team ? team.name : champion.teamId.replace(/-/g, " ");
      teamId = champion.teamId;
    }

    return {
      year,
      championName,
      teamName,
      teamId,
      raceCount: season.races.length,
    };
  } catch {
    return { year, championName: null, teamName: null, teamId: null, raceCount: null };
  }
}

export default async function SeasonsPage() {
  const allYears = getAvailableSeasons();

  // Load champion data for the most recent seasons
  const recentYears = allYears.slice(0, CHAMPION_CUTOFF);
  const olderYears = allYears.slice(CHAMPION_CUTOFF);

  const recentData = await Promise.all(
    recentYears.map((y) => getRecentSeasonData(y))
  );

  return (
    <div>
      <PageHeader
        title="Seasons"
        subtitle="Every Formula 1 World Championship season from 1950 to present"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Seasons" },
        ]}
      />

      {/* Recent seasons with champion info */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-text-primary">
          Recent Seasons
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentData.map((season) => (
            <Link
              key={season.year}
              href={`/seasons/${season.year}`}
              className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 card-glow"
              style={
                season.teamId
                  ? { borderLeftWidth: "4px", borderLeftColor: getTeamColor(season.teamId) }
                  : undefined
              }
            >
              <div className="flex items-center justify-between p-5">
                <div className="space-y-2">
                  <span className="text-3xl font-black text-text-primary">
                    {season.year}
                  </span>

                  {season.championName ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="size-3.5 text-amber-400" />
                        <span className="text-text-primary">{season.championName}</span>
                      </div>
                      <p className="text-xs text-text-secondary">{season.teamName}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Flag className="size-3.5" />
                      <span>Season in progress</span>
                    </div>
                  )}

                  {season.raceCount !== null && (
                    <p className="text-xs text-text-secondary">
                      {season.raceCount} race{season.raceCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <ChevronRight className="size-5 text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-glow" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Older seasons in a denser grid */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-text-primary">
          Historic Seasons
        </h2>

        {/* Group by decade */}
        {groupByDecade(olderYears).map(({ decade, years }) => (
          <div key={decade} className="mb-8">
            <h3 className="mb-3 text-lg font-semibold text-text-secondary">
              {decade}s
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10">
              {years.map((year) => (
                <Link
                  key={year}
                  href={`/seasons/${year}`}
                  className="group flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-3 py-3 text-center transition-all hover:border-glow/30"
                >
                  <span className="text-sm font-bold text-text-primary group-hover:text-glow">
                    {year}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function groupByDecade(years: number[]): { decade: number; years: number[] }[] {
  const groups = new Map<number, number[]>();
  for (const year of years) {
    const decade = Math.floor(year / 10) * 10;
    if (!groups.has(decade)) groups.set(decade, []);
    groups.get(decade)!.push(year);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([decade, yrs]) => ({ decade, years: yrs }));
}
