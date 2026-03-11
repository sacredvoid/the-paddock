// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

export interface DriverStats {
  championships: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  races: number;
  points: number;
  dnfs: number;
  winRate: number;
  podiumRate: number;
  averageFinish: number;
  bestFinish: number;
}

export interface Driver {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  number: string;
  code: string;
  isActive: boolean;
  stats: DriverStats | null;
  seasons: number[];
}

// ---------------------------------------------------------------------------
// Team / Constructor
// ---------------------------------------------------------------------------

export interface TeamStats {
  championships: number;
  wins: number;
  poles: number;
  podiums: number;
  races: number;
  points: number;
  firstEntry: number;
  lastEntry: number;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  nationality: string;
  color: string;
  isActive: boolean;
  stats: TeamStats | null;
}

// ---------------------------------------------------------------------------
// Circuit
// ---------------------------------------------------------------------------

export interface Circuit {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  totalRaces: number;
}

// ---------------------------------------------------------------------------
// Season / Race
// ---------------------------------------------------------------------------

export interface RaceResult {
  position: number;
  driverId: string;
  teamId: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
  time: string;
}

export interface QualifyingResult {
  position: number;
  driverId: string;
  teamId: string;
  q1: string;
  q2: string;
  q3: string;
}

export interface PitStop {
  driverId: string;
  lap: number;
  stop: number;
  duration: string;
  time: string;
}

export interface Race {
  round: number;
  name: string;
  circuitId: string;
  date: string;
  results: RaceResult[];
  qualifying?: QualifyingResult[];
  pitStops?: PitStop[];
}

export interface StandingEntry {
  position: number;
  id: string;
  points: number;
  wins: number;
}

export interface Season {
  year: number;
  champion: { driverId: string; teamId: string } | null;
  constructorChampion: { teamId: string } | null;
  races: Race[];
  driverStandings: StandingEntry[];
  constructorStandings: StandingEntry[];
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface RecordEntry {
  rank: number;
  driverId?: string;
  teamId?: string;
  value: number;
}

export interface Record {
  category: "drivers" | "constructors";
  title: string;
  entries: RecordEntry[];
}
