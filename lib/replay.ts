// ---------------------------------------------------------------------------
// Race replay frame system
// Converts per-lap telemetry into animatable frames and supports smooth
// interpolation between them for continuous playback.
// ---------------------------------------------------------------------------

import type { RaceTelemetry, TelemetryPitStop, SafetyCar } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplayDriverState {
  id: string;
  abbreviation: string;
  teamId: string;
  position: number;
  trackProgress: number; // 0-1 along track path
  compound: string;
  pitStops: number;
  gapToLeader: number; // seconds
  status: "racing" | "pit" | "retired";
}

export interface ReplayFrame {
  lap: number;
  timestamp: number; // ms into race
  drivers: ReplayDriverState[];
  safetyCar: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a set of laps where each driver pits, keyed by driverId. */
function buildPitLapMap(
  pitStops: TelemetryPitStop[]
): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();
  for (const ps of pitStops) {
    if (!map.has(ps.driverId)) {
      map.set(ps.driverId, new Set());
    }
    map.get(ps.driverId)!.add(ps.lap);
  }
  return map;
}

/** Count how many pit stops a driver has made up to (and including) a given lap. */
function countPitStopsUpTo(
  pitStops: TelemetryPitStop[],
  driverId: string,
  lap: number
): number {
  return pitStops.filter((ps) => ps.driverId === driverId && ps.lap <= lap)
    .length;
}

/** Check whether a given lap falls inside any safety car period. */
function isSafetyCarLap(safetyCars: SafetyCar[], lap: number): boolean {
  return safetyCars.some((sc) => lap >= sc.startLap && lap <= sc.endLap);
}

/**
 * Compute the cumulative race time in ms for a driver at a specific lap.
 * Returns the sum of all lap times from lap 1 through the given lap.
 */
function cumulativeTimeMs(
  lapTimes: { lap: number; timeMs: number }[],
  upToLap: number
): number {
  let total = 0;
  for (const lt of lapTimes) {
    if (lt.lap <= upToLap) {
      total += lt.timeMs;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// buildReplayFrames
// ---------------------------------------------------------------------------

/**
 * Converts per-lap telemetry data into an array of ReplayFrames, one per lap.
 *
 * Each frame captures the state of every driver at the end of that lap:
 * position, tyre compound, gap to the leader, pit stop count, and whether
 * they are racing, in the pits, or retired.
 *
 * trackProgress is set to 1.0 for completed laps (the interpolateFrame
 * function handles sub-lap animation between frames).
 */
export function buildReplayFrames(telemetry: RaceTelemetry): ReplayFrame[] {
  const { totalLaps, drivers, pitStops, safetyCars } = telemetry;
  const pitLapMap = buildPitLapMap(pitStops);

  // Pre-compute each driver's last recorded lap to detect retirements
  const driverLastLap = new Map<string, number>();
  const driverIds = Object.keys(drivers);
  for (const did of driverIds) {
    const laps = drivers[did].laps;
    driverLastLap.set(did, laps.length > 0 ? laps[laps.length - 1].lap : 0);
  }

  const frames: ReplayFrame[] = [];

  for (let lap = 1; lap <= totalLaps; lap++) {
    // Collect driver snapshots for this lap
    const driverSnapshots: {
      id: string;
      abbreviation: string;
      teamId: string;
      position: number;
      compound: string;
      cumulativeMs: number;
      pitStops: number;
      status: "racing" | "pit" | "retired";
      hasLapData: boolean; // whether the driver actually recorded this lap
    }[] = [];

    for (const did of driverIds) {
      const driverData = drivers[did];
      const lapEntry = driverData.laps.find((l) => l.lap === lap);
      const lastLap = driverLastLap.get(did) ?? 0;

      // Determine driver status
      let status: "racing" | "pit" | "retired" = "racing";
      if (lap > lastLap) {
        // Driver has no data for this lap - they retired earlier
        status = "retired";
      } else if (pitLapMap.get(did)?.has(lap)) {
        status = "pit";
      }

      // Use the lap entry if available, otherwise carry forward from the
      // last known lap (manual reverse search to avoid Array.findLast
      // which requires ES2023 target)
      let fallbackEntry = driverData.laps[0] ?? undefined;
      for (let i = driverData.laps.length - 1; i >= 0; i--) {
        if (driverData.laps[i].lap <= lap) {
          fallbackEntry = driverData.laps[i];
          break;
        }
      }
      const effectiveLapEntry = lapEntry ?? fallbackEntry;

      if (!effectiveLapEntry) continue;

      const cumMs = cumulativeTimeMs(driverData.laps, lap);
      const pits = countPitStopsUpTo(pitStops, did, lap);

      driverSnapshots.push({
        id: did,
        abbreviation: driverData.abbreviation,
        teamId: driverData.teamId,
        position: effectiveLapEntry.position,
        compound: effectiveLapEntry.compound,
        cumulativeMs: cumMs,
        pitStops: pits,
        status,
        hasLapData: lapEntry != null,
      });
    }

    // Leader time: use the cumulative time of the P1 driver (the driver
    // with position === 1 who has data for this lap). We cannot just use
    // the minimum cumulative time because lap 1 times include variable
    // grid-to-line intervals that distort raw totals.
    let leaderTime = 0;
    const p1Driver = driverSnapshots.find(
      (s) => s.position === 1 && s.hasLapData && s.status !== "retired"
    );
    if (p1Driver) {
      leaderTime = p1Driver.cumulativeMs;
    }

    // Sort by position for the frame
    driverSnapshots.sort((a, b) => {
      // Retired drivers go to the back
      if (a.status === "retired" && b.status !== "retired") return 1;
      if (b.status === "retired" && a.status !== "retired") return -1;
      return a.position - b.position;
    });

    // Compute timestamp as the leader's cumulative time (best approximation
    // of wall-clock race time at this lap)
    const timestamp = leaderTime === Infinity ? 0 : leaderTime;

    const frameDrivers: ReplayDriverState[] = driverSnapshots.map((snap) => ({
      id: snap.id,
      abbreviation: snap.abbreviation,
      teamId: snap.teamId,
      position: snap.position,
      trackProgress: 1.0, // End of the lap
      compound: snap.compound,
      pitStops: snap.pitStops,
      gapToLeader:
        snap.status === "retired"
          ? -1
          : Math.max(0, (snap.cumulativeMs - leaderTime) / 1000),
      status: snap.status,
    }));

    frames.push({
      lap,
      timestamp,
      drivers: frameDrivers,
      safetyCar: isSafetyCarLap(safetyCars, lap),
    });
  }

  return frames;
}

// ---------------------------------------------------------------------------
// interpolateFrame
// ---------------------------------------------------------------------------

/**
 * Interpolates a ReplayFrame at an arbitrary point in time between two
 * adjacent keyframes. This enables smooth animation of car positions along
 * the track path.
 *
 * - trackProgress is linearly interpolated from 0 at the previous frame's
 *   timestamp to 1 at the next frame's timestamp.
 * - gapToLeader is also linearly interpolated for smooth gap display.
 * - Discrete fields (position, compound, status, pitStops) snap to the
 *   nearest frame.
 *
 * If timeMs is before the first frame or after the last, the nearest frame
 * is returned as-is.
 */
export function interpolateFrame(
  frames: ReplayFrame[],
  timeMs: number
): ReplayFrame {
  if (frames.length === 0) {
    return {
      lap: 0,
      timestamp: 0,
      drivers: [],
      safetyCar: false,
    };
  }

  // Clamp to first frame
  if (timeMs <= frames[0].timestamp) {
    return {
      ...frames[0],
      drivers: frames[0].drivers.map((d) => ({
        ...d,
        trackProgress: 0,
      })),
    };
  }

  // Clamp to last frame
  if (timeMs >= frames[frames.length - 1].timestamp) {
    return frames[frames.length - 1];
  }

  // Find the two frames surrounding timeMs
  let prevIdx = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    if (frames[i + 1].timestamp > timeMs) {
      prevIdx = i;
      break;
    }
  }

  const prev = frames[prevIdx];
  const next = frames[prevIdx + 1];

  // t ranges from 0 (at prev timestamp) to 1 (at next timestamp)
  const duration = next.timestamp - prev.timestamp;
  const t = duration > 0 ? (timeMs - prev.timestamp) / duration : 1;

  // Build interpolated driver states
  const interpolatedDrivers: ReplayDriverState[] = next.drivers.map(
    (nextDriver) => {
      const prevDriver = prev.drivers.find((d) => d.id === nextDriver.id);

      if (!prevDriver) {
        // Driver appears in next but not prev (unusual, just return next state)
        return { ...nextDriver, trackProgress: t };
      }

      // Linearly interpolate continuous values
      const trackProgress = t;

      const prevGap =
        prevDriver.gapToLeader >= 0 ? prevDriver.gapToLeader : 0;
      const nextGap =
        nextDriver.gapToLeader >= 0 ? nextDriver.gapToLeader : 0;
      const gapToLeader =
        nextDriver.status === "retired"
          ? -1
          : prevGap + (nextGap - prevGap) * t;

      // Snap discrete values to the nearest frame (use next if past midpoint)
      const useNext = t >= 0.5;
      const snap = useNext ? nextDriver : prevDriver;

      return {
        id: nextDriver.id,
        abbreviation: nextDriver.abbreviation,
        teamId: nextDriver.teamId,
        position: snap.position,
        trackProgress,
        compound: snap.compound,
        pitStops: snap.pitStops,
        gapToLeader,
        status: snap.status,
      };
    }
  );

  return {
    lap: t >= 0.5 ? next.lap : prev.lap,
    timestamp: timeMs,
    drivers: interpolatedDrivers,
    safetyCar: t >= 0.5 ? next.safetyCar : prev.safetyCar,
  };
}
