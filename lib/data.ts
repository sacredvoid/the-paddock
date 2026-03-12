import type {
  Driver,
  Team,
  Circuit,
  Season,
  Record as F1Record,
  TeamLineage,
  RaceTelemetry,
} from "./types";

// ---------------------------------------------------------------------------
// Static JSON imports (resolved at build time, zero runtime cost)
// ---------------------------------------------------------------------------

import driversData from "@/data/drivers.json";
import teamsData from "@/data/teams.json";
import circuitsData from "@/data/circuits.json";
import recordsData from "@/data/records.json";
import teamDriversData from "@/data/team-drivers.json";
import lineageData from "@/data/team-lineage.json";

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export function getAllDrivers(): Driver[] {
  return driversData as Driver[];
}

export function getDriver(slug: string): Driver | undefined {
  return (driversData as Driver[]).find((d) => d.slug === slug);
}

export function getDriverById(id: string): Driver | undefined {
  return (driversData as Driver[]).find((d) => d.id === id);
}

export function getActiveDrivers(): Driver[] {
  return (driversData as Driver[]).filter((d) => d.isActive);
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export function getAllTeams(): Team[] {
  return teamsData as Team[];
}

export function getTeam(slug: string): Team | undefined {
  return (teamsData as Team[]).find((t) => t.slug === slug);
}

export function getTeamById(id: string): Team | undefined {
  return (teamsData as Team[]).find((t) => t.id === id);
}

export function getActiveTeams(): Team[] {
  return (teamsData as Team[]).filter((t) => t.isActive);
}

export interface TeamDriverEntry {
  driverId: string;
  firstName: string;
  lastName: string;
  wins: number;
  podiums: number;
  races: number;
  points: number;
  yearStart: number;
  yearEnd: number;
}

const teamDrivers = teamDriversData as Record<string, TeamDriverEntry[]>;

export function getTeamDrivers(teamId: string): TeamDriverEntry[] {
  return teamDrivers[teamId] ?? [];
}

// ---------------------------------------------------------------------------
// Circuits
// ---------------------------------------------------------------------------

export function getAllCircuits(): Circuit[] {
  return circuitsData as Circuit[];
}

export function getCircuit(slug: string): Circuit | undefined {
  return (circuitsData as Circuit[]).find((c) => c.slug === slug);
}

export function getCircuitById(id: string): Circuit | undefined {
  return (circuitsData as Circuit[]).find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export function getAllRecords(): F1Record[] {
  return recordsData as F1Record[];
}

// ---------------------------------------------------------------------------
// Team Lineages (Family Tree)
// ---------------------------------------------------------------------------

export function getTeamLineages(): TeamLineage[] {
  return lineageData.lineages as TeamLineage[];
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

const SEASON_START = 1950;
const SEASON_END = 2026;

export function getAvailableSeasons(): number[] {
  const seasons: number[] = [];
  for (let y = SEASON_END; y >= SEASON_START; y--) {
    seasons.push(y);
  }
  return seasons;
}

export async function getSeason(year: number): Promise<Season> {
  // Dynamic import so we only load the season data when needed
  const data = await import(`@/data/seasons/${year}.json`);
  return data.default as Season;
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export async function getRaceTelemetry(
  year: number,
  round: number
): Promise<RaceTelemetry | null> {
  try {
    const data = await import(`@/data/telemetry/${year}/${round}.json`);
    return data.default as RaceTelemetry;
  } catch {
    return null;
  }
}
