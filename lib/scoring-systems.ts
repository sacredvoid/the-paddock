export interface ScoringSystem {
  id: string;
  name: string;
  years: string;
  points: Record<number, number>; // position -> points
  fastestLap?: number; // bonus points for fastest lap
  description: string;
}

export const SCORING_SYSTEMS: ScoringSystem[] = [
  {
    id: "current",
    name: "Current System",
    years: "2010-present",
    points: {
      1: 25,
      2: 18,
      3: 15,
      4: 12,
      5: 10,
      6: 8,
      7: 6,
      8: 4,
      9: 2,
      10: 1,
    },
    fastestLap: 1,
    description:
      "25-18-15-12-10-8-6-4-2-1, plus 1 point for fastest lap if in top 10",
  },
  {
    id: "2003-2009",
    name: "2003-2009 System",
    years: "2003-2009",
    points: { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 },
    description: "10-8-6-5-4-3-2-1 for top 8",
  },
  {
    id: "1991-2002",
    name: "1991-2002 System",
    years: "1991-2002",
    points: { 1: 10, 2: 6, 3: 4, 4: 3, 5: 2, 6: 1 },
    description: "10-6-4-3-2-1 for top 6",
  },
  {
    id: "1961-1990",
    name: "1961-1990 System",
    years: "1961-1990",
    points: { 1: 9, 2: 6, 3: 4, 4: 3, 5: 2, 6: 1 },
    description: "9-6-4-3-2-1 for top 6",
  },
  {
    id: "1950-1960",
    name: "Original System",
    years: "1950-1960",
    points: { 1: 8, 2: 6, 3: 4, 4: 3, 5: 2 },
    fastestLap: 1,
    description: "8-6-4-3-2 for top 5, plus 1 for fastest lap",
  },
  {
    id: "winner-takes-all",
    name: "Winner Takes All",
    years: "Custom",
    points: { 1: 1 },
    description: "Only the winner scores (1 point per win)",
  },
];

export function getScoringSystem(id: string): ScoringSystem | undefined {
  return SCORING_SYSTEMS.find((s) => s.id === id);
}
