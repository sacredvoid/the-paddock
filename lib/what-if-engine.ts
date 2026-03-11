import type { ScoringSystem } from "./scoring-systems";
import type { Race, RaceResult, StandingEntry } from "./types";

export interface SimulatedStanding {
  position: number;
  driverId: string;
  teamId: string;
  points: number;
  wins: number;
  podiums: number;
  originalPosition?: number;
  positionChange?: number;
}

interface SimulationOptions {
  removeDNFs?: boolean;
}

/**
 * Returns true if a result status counts as "finished" (completed the race
 * or finished within a certain number of laps behind the leader).
 */
function isFinished(status: string): boolean {
  if (status === "Finished") return true;
  // Statuses like "+1 Lap", "+2 Laps" mean the driver was classified
  if (/^\+\d+ Lap/.test(status)) return true;
  return false;
}

/**
 * Given a set of race results and a scoring system, calculate the points
 * each finishing position earns. When removeDNFs is enabled, DNF drivers
 * are stripped from results and the remaining drivers are re-ranked before
 * points are applied.
 */
function scoreRace(
  results: RaceResult[],
  scoringSystem: ScoringSystem,
  options?: SimulationOptions
): Map<string, { points: number; position: number }> {
  let eligible = [...results];

  if (options?.removeDNFs) {
    eligible = eligible.filter((r) => isFinished(r.status));
  }

  // Sort by original position to maintain finishing order
  eligible.sort((a, b) => a.position - b.position);

  const driverScores = new Map<string, { points: number; position: number }>();

  eligible.forEach((result, index) => {
    // After removing DNFs, re-rank from position 1
    const effectivePosition = options?.removeDNFs ? index + 1 : result.position;
    const positionPoints = scoringSystem.points[effectivePosition] ?? 0;
    driverScores.set(result.driverId, {
      points: positionPoints,
      position: effectivePosition,
    });
  });

  return driverScores;
}

/**
 * Simulates a full championship season using the given scoring system.
 * Recalculates points for every race, accumulates totals per driver,
 * then sorts by points (with wins and podiums as tiebreakers).
 * Computes position changes relative to the original standings.
 */
export function simulateChampionship(
  races: Race[],
  scoringSystem: ScoringSystem,
  originalStandings: StandingEntry[],
  options?: SimulationOptions
): SimulatedStanding[] {
  // Accumulate stats per driver
  const driverStats = new Map<
    string,
    { points: number; wins: number; podiums: number; teamId: string }
  >();

  for (const race of races) {
    if (!race.results || race.results.length === 0) continue;

    const raceScores = scoreRace(race.results, scoringSystem, options);

    for (const result of race.results) {
      const driverId = result.driverId;
      const scored = raceScores.get(driverId);

      if (!scored) continue; // Driver was removed (DNF filtering)

      const existing = driverStats.get(driverId) ?? {
        points: 0,
        wins: 0,
        podiums: 0,
        teamId: result.teamId,
      };

      existing.points += scored.points;
      if (scored.position === 1) existing.wins += 1;
      if (scored.position <= 3) existing.podiums += 1;
      // Keep the most recent teamId (in case a driver switched teams mid-season)
      existing.teamId = result.teamId;

      driverStats.set(driverId, existing);
    }
  }

  // Build a position lookup from the original standings
  const originalPositionMap = new Map<string, number>();
  for (const entry of originalStandings) {
    originalPositionMap.set(entry.id, entry.position);
  }

  // Convert to array and sort
  const standings: SimulatedStanding[] = Array.from(driverStats.entries()).map(
    ([driverId, stats]) => ({
      position: 0, // will be set after sorting
      driverId,
      teamId: stats.teamId,
      points: stats.points,
      wins: stats.wins,
      podiums: stats.podiums,
    })
  );

  // Sort: points descending, then wins descending, then podiums descending
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.podiums - a.podiums;
  });

  // Assign positions and calculate changes
  standings.forEach((standing, index) => {
    standing.position = index + 1;
    const originalPos = originalPositionMap.get(standing.driverId);
    if (originalPos !== undefined) {
      standing.originalPosition = originalPos;
      // Positive = gained positions (moved up), negative = lost positions (moved down)
      standing.positionChange = originalPos - standing.position;
    }
  });

  return standings;
}
