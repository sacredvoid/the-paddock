"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SeasonPicker } from "@/components/what-if/season-picker";
import { ScoringPicker } from "@/components/what-if/scoring-picker";
import { SimulatorResults } from "@/components/what-if/simulator-results";
import { getScoringSystem, SCORING_SYSTEMS } from "@/lib/scoring-systems";
import { simulateChampionship } from "@/lib/what-if-engine";
import { getDriverById } from "@/lib/data";
import type { Season } from "@/lib/types";

function WhatIfSimulator() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL search params
  const initialSeason = searchParams.get("season");
  const initialScoring = searchParams.get("scoring") ?? "current";
  const initialRemoveDNFs = searchParams.get("removeDNFs") === "true";

  const [selectedSeason, setSelectedSeason] = useState<string | null>(
    initialSeason
  );
  const [selectedScoring, setSelectedScoring] =
    useState<string>(initialScoring);
  const [removeDNFs, setRemoveDNFs] = useState(initialRemoveDNFs);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync state to URL search params
  const updateUrl = useCallback(
    (season: string | null, scoring: string, dnfs: boolean) => {
      const params = new URLSearchParams();
      if (season) params.set("season", season);
      if (scoring !== "current") params.set("scoring", scoring);
      if (dnfs) params.set("removeDNFs", "true");
      const query = params.toString();
      router.replace(query ? `?${query}` : "/what-if", { scroll: false });
    },
    [router]
  );

  // Load season data when selection changes
  useEffect(() => {
    if (!selectedSeason) {
      setSeasonData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    import(`@/data/seasons/${selectedSeason}.json`)
      .then((mod) => {
        if (!cancelled) {
          setSeasonData(mod.default as Season);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeasonData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSeason]);

  // Handlers that update both state and URL
  const handleSeasonChange = useCallback(
    (year: string) => {
      setSelectedSeason(year);
      updateUrl(year, selectedScoring, removeDNFs);
    },
    [selectedScoring, removeDNFs, updateUrl]
  );

  const handleScoringChange = useCallback(
    (id: string) => {
      setSelectedScoring(id);
      updateUrl(selectedSeason, id, removeDNFs);
    },
    [selectedSeason, removeDNFs, updateUrl]
  );

  const handleRemoveDNFsChange = useCallback(
    (value: boolean) => {
      setRemoveDNFs(value);
      updateUrl(selectedSeason, selectedScoring, value);
    },
    [selectedSeason, selectedScoring, updateUrl]
  );

  // Compute champion name for the season picker display
  const championName = useMemo(() => {
    if (!seasonData?.champion?.driverId) return null;
    const driver = getDriverById(seasonData.champion.driverId);
    if (driver) return `${driver.firstName} ${driver.lastName}`;
    return seasonData.champion.driverId;
  }, [seasonData]);

  // Run the simulation
  const scoringSystem = getScoringSystem(selectedScoring) ?? SCORING_SYSTEMS[0];

  const simulatedStandings = useMemo(() => {
    if (!seasonData) return [];

    const racesWithResults = seasonData.races.filter(
      (r) => r.results && r.results.length > 0
    );
    if (racesWithResults.length === 0) return [];

    return simulateChampionship(
      racesWithResults,
      scoringSystem,
      seasonData.driverStandings,
      { removeDNFs }
    );
  }, [seasonData, scoringSystem, removeDNFs]);

  const hasRaceData =
    seasonData != null &&
    seasonData.races.some((r) => r.results && r.results.length > 0);

  return (
    <div>
      <PageHeader
        title="What If?"
        subtitle="See how different scoring systems change F1 history"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls sidebar */}
        <div className="flex flex-col gap-6">
          <SeasonPicker
            value={selectedSeason}
            onChange={handleSeasonChange}
            championName={championName}
          />
          <ScoringPicker
            value={selectedScoring}
            onChange={handleScoringChange}
            removeDNFs={removeDNFs}
            onRemoveDNFsChange={handleRemoveDNFsChange}
          />
        </div>

        {/* Results area */}
        <div>
          {!selectedSeason && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-16">
              <p className="text-lg text-text-secondary">
                Pick a season to get started
              </p>
              <p className="text-sm text-text-secondary">
                Choose a year and scoring system, then see how the championship
                standings would change.
              </p>
            </div>
          )}

          {selectedSeason && loading && (
            <div className="flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-16">
              <p className="text-text-secondary">Loading season data...</p>
            </div>
          )}

          {selectedSeason && !loading && !hasRaceData && seasonData && (
            <SimulatorResults
              standings={[]}
              year={Number(selectedSeason)}
              originalChampionId={seasonData?.champion?.driverId}
            />
          )}

          {selectedSeason && !loading && hasRaceData && (
            <SimulatorResults
              standings={simulatedStandings}
              year={Number(selectedSeason)}
              originalChampionId={seasonData?.champion?.driverId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function WhatIfPage() {
  return (
    <Suspense
      fallback={
        <div>
          <PageHeader
            title="What If?"
            subtitle="See how different scoring systems change F1 history"
          />
          <div className="flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-16">
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <WhatIfSimulator />
    </Suspense>
  );
}
