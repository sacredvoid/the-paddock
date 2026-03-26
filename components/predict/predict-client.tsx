"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Brain, Sliders, AlertTriangle, Loader2 } from "lucide-react";
import { getDriverById, getTeamById } from "@/lib/data";
import type { Season } from "@/lib/types";
import {
  loadModel,
  predictWithProbabilities,
  type PredictionInput,
  type PredictionOutput,
} from "@/lib/prediction";
import {
  VariableControls,
  type VariableOverrides,
} from "@/components/predict/variable-controls";
import { PredictionResults } from "@/components/predict/prediction-results";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECENT_YEARS = [2024, 2023, 2022, 2021, 2020];

const DEFAULT_OVERRIDES: VariableOverrides = {
  isWet: false,
  safetyCarLikelihood: "low",
  driverFormAdjustments: {},
};

// ---------------------------------------------------------------------------
// Feature computation helpers
// ---------------------------------------------------------------------------

/**
 * Computes a constructor strength score from 0-10 based on standings.
 */
function computeConstructorStrength(
  teamId: string,
  seasonData: Season
): number {
  const standing = seasonData.constructorStandings.find(
    (s) => s.id === teamId
  );
  if (!standing) return 3;
  const total = seasonData.constructorStandings.length;
  // Position 1 = 10, last = 1
  return Math.max(1, 10 - ((standing.position - 1) / Math.max(total - 1, 1)) * 9);
}

/**
 * Computes driver form (0-10) based on recent race results in the season.
 */
function computeDriverForm(
  driverId: string,
  seasonData: Season,
  upToRound: number
): number {
  const recentRaces = seasonData.races
    .filter((r) => r.round < upToRound && r.results.length > 0)
    .slice(-5);

  if (recentRaces.length === 0) return 5; // Neutral

  const avgFinish =
    recentRaces.reduce((sum, race) => {
      const result = race.results.find((r) => r.driverId === driverId);
      return sum + (result ? result.position : 15);
    }, 0) / recentRaces.length;

  // Map avg finish 1-20 to form 10-1
  return Math.max(1, Math.min(10, 10 - ((avgFinish - 1) / 19) * 9));
}

/**
 * Computes how well a driver does at a specific circuit historically.
 */
function computeCircuitHistory(
  driverId: string,
  circuitId: string,
  allSeasons: Season[]
): number {
  const finishes: number[] = [];
  for (const season of allSeasons) {
    for (const race of season.races) {
      if (race.circuitId === circuitId) {
        const result = race.results.find((r) => r.driverId === driverId);
        if (result) finishes.push(result.position);
      }
    }
  }
  if (finishes.length === 0) return 5;
  const avg = finishes.reduce((a, b) => a + b, 0) / finishes.length;
  return Math.max(1, Math.min(10, 10 - ((avg - 1) / 19) * 9));
}

/**
 * Computes qualifying gap to teammate. Positive means slower.
 */
function computeTeammateQualiGap(
  driverId: string,
  teamId: string,
  race: { qualifying?: { driverId: string; teamId: string; q3: string; q2: string; q1: string }[] }
): number {
  if (!race.qualifying) return 0;
  const teamQualis = race.qualifying.filter((q) => q.teamId === teamId);
  if (teamQualis.length < 2) return 0;

  const getTime = (q: { q3: string; q2: string; q1: string }) => {
    const timeStr = q.q3 || q.q2 || q.q1;
    if (!timeStr) return Infinity;
    // Parse "1:32.608" format
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr) || Infinity;
  };

  const driverQuali = teamQualis.find((q) => q.driverId === driverId);
  const teammateQuali = teamQualis.find((q) => q.driverId !== driverId);

  if (!driverQuali || !teammateQuali) return 0;

  const driverTime = getTime(driverQuali);
  const teammateTime = getTime(teammateQuali);

  if (driverTime === Infinity || teammateTime === Infinity) return 0;

  // Return gap in seconds (positive = driver is slower)
  return parseFloat((driverTime - teammateTime).toFixed(3));
}

/**
 * Simple circuit type classification based on circuitId patterns.
 * 0 = Street, 1 = Power, 2 = Downforce, 3 = Balanced
 */
function classifyCircuit(circuitId: string): number {
  const streetCircuits = [
    "monaco",
    "baku",
    "jeddah",
    "singapore",
    "las-vegas",
    "melbourne",
  ];
  const powerCircuits = ["monza", "spa", "bahrain", "sakhir"];
  const downforceCircuits = ["hungaroring", "zandvoort", "suzuka"];

  if (streetCircuits.some((s) => circuitId.includes(s))) return 0;
  if (powerCircuits.some((s) => circuitId.includes(s))) return 1;
  if (downforceCircuits.some((s) => circuitId.includes(s))) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export function PredictClient() {
  // State
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [historicalSeasons, setHistoricalSeasons] = useState<Season[]>([]);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [predictions, setPredictions] = useState<PredictionOutput[]>([]);
  const [gridPositions, setGridPositions] = useState<Record<string, number>>({});
  const [isPredicting, setIsPredicting] = useState(false);
  const [viewMode, setViewMode] = useState<"predictions" | "whatif">(
    "predictions"
  );
  const [overrides, setOverrides] = useState<VariableOverrides>(DEFAULT_OVERRIDES);

  // Load ONNX model on mount
  useEffect(() => {
    setModelLoading(true);
    loadModel()
      .then(() => {
        setModelLoading(false);
        setModelError(false);
      })
      .catch(() => {
        // Model file doesn't exist - that's OK, we use heuristic fallback
        setModelLoading(false);
        setModelError(true);
      });
  }, []);

  // Load season data when year changes
  useEffect(() => {
    let cancelled = false;
    setLoadingSeason(true);
    setSelectedRound(null);
    setPredictions([]);

    import(`@/data/seasons/${selectedYear}.json`)
      .then((mod) => {
        if (!cancelled) setSeasonData(mod.default as Season);
      })
      .catch(() => {
        if (!cancelled) setSeasonData(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSeason(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // Load a couple historical seasons for circuit history
  useEffect(() => {
    const yearsToLoad = [2023, 2022, 2021].filter((y) => y !== selectedYear);
    Promise.all(
      yearsToLoad.map((y) =>
        import(`@/data/seasons/${y}.json`)
          .then((mod) => mod.default as Season)
          .catch(() => null)
      )
    ).then((results) => {
      setHistoricalSeasons(results.filter((s): s is Season => s != null));
    });
  }, [selectedYear]);

  // Auto-select first race with results
  useEffect(() => {
    if (seasonData && selectedRound === null) {
      const firstRace = seasonData.races.find(
        (r) => r.results && r.results.length > 0
      );
      if (firstRace) setSelectedRound(firstRace.round);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonData]);

  // Get the selected race data
  const selectedRace = useMemo(() => {
    if (!seasonData || !selectedRound) return null;
    return seasonData.races.find((r) => r.round === selectedRound) ?? null;
  }, [seasonData, selectedRound]);

  // Build team color map
  const teamColors = useMemo(() => {
    const colors: Record<string, string> = {};
    if (!selectedRace) return colors;
    for (const result of selectedRace.results) {
      if (!colors[result.teamId]) {
        const team = getTeamById(result.teamId);
        colors[result.teamId] = team?.color ?? "#8B8B8D";
      }
    }
    return colors;
  }, [selectedRace]);

  // Build driver entries for variable controls
  const driverEntries = useMemo(() => {
    if (!selectedRace) return [];
    return selectedRace.results.map((result) => {
      const driver = getDriverById(result.driverId);
      return {
        driverId: result.driverId,
        driverName: driver
          ? `${driver.firstName} ${driver.lastName}`
          : result.driverId,
        teamColor: teamColors[result.teamId] ?? "#8B8B8D",
      };
    });
  }, [selectedRace, teamColors]);

  // Run prediction
  const runPrediction = useCallback(async () => {
    if (!selectedRace || !seasonData) return;

    setIsPredicting(true);

    try {
      const allSeasons = [seasonData, ...historicalSeasons];

      const totalDrivers = seasonData.driverStandings.length || 20;

      const inputs: PredictionInput[] = selectedRace.results.map((result) => {
        const formAdj =
          overrides.driverFormAdjustments[result.driverId] ?? 0;

        // Compute normalised driver championship position (0 = leader, 1 = last)
        const driverStanding = seasonData.driverStandings.find(
          (s) => s.id === result.driverId
        );
        const champPos = driverStanding
          ? driverStanding.position / totalDrivers
          : 0.5;

        return {
          gridPosition: result.grid || 20,
          constructorStrength: computeConstructorStrength(
            result.teamId,
            seasonData
          ),
          driverForm:
            computeDriverForm(
              result.driverId,
              seasonData,
              selectedRace.round
            ) + formAdj,
          driverCircuitHistory: computeCircuitHistory(
            result.driverId,
            selectedRace.circuitId,
            allSeasons
          ),
          teammateQualiGap: computeTeammateQualiGap(
            result.driverId,
            result.teamId,
            selectedRace
          ),
          circuitType: classifyCircuit(selectedRace.circuitId),
          isWet: overrides.isWet ? 1 : 0,
          driverChampionshipPos: champPos,
        };
      });

      // Add safety car randomness factor
      const scMultiplier =
        overrides.safetyCarLikelihood === "high"
          ? 1.5
          : overrides.safetyCarLikelihood === "medium"
            ? 1.0
            : 0.5;

      const adjustedInputs = inputs.map((inp) => ({
        ...inp,
        driverForm: inp.driverForm * (1 + (Math.random() - 0.5) * 0.1 * scMultiplier),
      }));

      const probResults = await predictWithProbabilities(adjustedInputs, 80);

      // Build grid position map for delta display
      const grids: Record<string, number> = {};
      for (const result of selectedRace.results) {
        grids[result.driverId] = result.grid || 20;
      }

      const output: PredictionOutput[] = selectedRace.results.map(
        (result, i) => {
          const driver = getDriverById(result.driverId);
          return {
            driverId: result.driverId,
            driverName: driver
              ? `${driver.firstName} ${driver.lastName}`
              : result.driverId,
            teamId: result.teamId,
            predictedPosition: probResults[i].predictedPosition,
            winProbability: probResults[i].winProbability,
            podiumProbability: probResults[i].podiumProbability,
            pointsProbability: probResults[i].pointsProbability,
          };
        }
      );

      setGridPositions(grids);
      setPredictions(output);
    } catch (err) {
      console.error("Prediction failed:", err);
    } finally {
      setIsPredicting(false);
    }
  }, [selectedRace, seasonData, historicalSeasons, overrides]);

  // Auto-run prediction when race or view changes
  useEffect(() => {
    if (selectedRace) {
      runPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound, selectedYear]);

  // Re-run when overrides change in "What If" mode
  useEffect(() => {
    if (viewMode === "whatif" && selectedRace) {
      const timer = setTimeout(() => {
        runPrediction();
      }, 300); // Debounce
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides, viewMode]);

  // Races with results for the selector
  const availableRaces = useMemo(() => {
    if (!seasonData) return [];
    return seasonData.races.filter((r) => r.results && r.results.length > 0);
  }, [seasonData]);

  return (
    <div className="space-y-6">
      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-200/80">
          Fan model for entertainment. Predictions are probabilistic estimates
          based on historical data.
        </p>
      </div>

      {/* Controls row */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Season selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Season
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-glow focus:outline-none"
            >
              {RECENT_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Race selector */}
          {!loadingSeason && seasonData && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Race
              </label>
              <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-2">
                {availableRaces.map((race) => (
                  <button
                    key={race.round}
                    onClick={() => setSelectedRound(race.round)}
                    className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                      selectedRound === race.round
                        ? "bg-glow/10 text-glow"
                        : "text-text-primary hover:bg-surface-3"
                    }`}
                  >
                    <span className="stats-number mr-2 text-xs text-text-secondary">
                      R{race.round}
                    </span>
                    {race.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View mode toggle */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Mode
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode("predictions")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "predictions"
                    ? "bg-glow/15 text-glow"
                    : "bg-surface-2 text-text-secondary hover:text-text-primary"
                }`}
              >
                <Brain className="size-3.5" />
                Predictions
              </button>
              <button
                onClick={() => setViewMode("whatif")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "whatif"
                    ? "bg-glow/15 text-glow"
                    : "bg-surface-2 text-text-secondary hover:text-text-primary"
                }`}
              >
                <Sliders className="size-3.5" />
                What If
              </button>
            </div>
          </div>

          {/* Variable controls (only in "What If" mode) */}
          {viewMode === "whatif" && (
            <VariableControls
              overrides={overrides}
              onUpdate={setOverrides}
              driverEntries={driverEntries}
            />
          )}

          {/* Model status indicator */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  modelLoading
                    ? "animate-pulse bg-amber-400"
                    : modelError
                      ? "bg-amber-400"
                      : "bg-success"
                }`}
              />
              <span className="text-xs text-text-secondary">
                {modelLoading
                  ? "Loading model..."
                  : modelError
                    ? "Using heuristic engine"
                    : "ONNX model loaded"}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {/* Header */}
          {selectedRace && (
            <div className="flex items-center gap-3">
              <Brain className="size-5 text-glow" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {selectedRace.name}
                </h2>
                <p className="text-xs text-text-secondary">
                  {viewMode === "predictions"
                    ? "Predicted race outcome based on historical data and grid positions"
                    : "Adjust variables to see how outcomes change"}
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {(isPredicting || loadingSeason) && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-20">
              <Loader2 className="size-6 animate-spin text-glow" />
              <p className="text-sm text-text-secondary">
                {loadingSeason ? "Loading season data..." : "Running predictions..."}
              </p>
            </div>
          )}

          {/* Results */}
          {!isPredicting && !loadingSeason && predictions.length > 0 && (
            <PredictionResults
              predictions={predictions}
              teamColors={teamColors}
              gridPositions={gridPositions}
            />
          )}

          {/* Empty state */}
          {!isPredicting &&
            !loadingSeason &&
            predictions.length === 0 &&
            !selectedRace && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-20">
                <Brain className="size-8 text-text-tertiary" />
                <p className="text-text-secondary">
                  Select a season and race to generate predictions
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
