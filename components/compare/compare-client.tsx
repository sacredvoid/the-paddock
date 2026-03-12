"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SpeedTraceChart } from "@/components/compare/speed-trace-chart";
import { getDriverById } from "@/lib/data";
import { getDriverImageUrl } from "@/lib/images";
import type { Season, DetailedTelemetry, Driver } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonChart } from "@/components/ui/skeleton-chart";
import Image from "next/image";
import { X, Plus, Activity } from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPARISON_COLORS = [
  "#FF6B2C", // glow (orange)
  "#3B82F6", // blue
  "#34D399", // green
  "#A78BFA", // purple
  "#FBBF24", // yellow
  "#EC4899", // pink
];

const AVAILABLE_YEARS = [2024];

// ---------------------------------------------------------------------------
// Driver Picker
// ---------------------------------------------------------------------------

function DriverPicker({
  selectedDriverIds,
  onAdd,
  onRemove,
  seasonData,
}: {
  selectedDriverIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  seasonData: Season | null;
}) {
  const [search, setSearch] = useState("");

  // Get drivers who raced in the selected season
  const availableDrivers = useMemo(() => {
    if (!seasonData) return [];
    const driverIds = new Set<string>();
    for (const race of seasonData.races) {
      for (const result of race.results) {
        driverIds.add(result.driverId);
      }
    }
    return Array.from(driverIds)
      .map((id) => getDriverById(id))
      .filter((d): d is Driver => d != null)
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [seasonData]);

  const filtered = useMemo(() => {
    if (!search) return availableDrivers;
    const q = search.toLowerCase();
    return availableDrivers.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q)
    );
  }, [availableDrivers, search]);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        Drivers (max 6)
      </label>

      {/* Selected drivers */}
      <div className="mb-3 flex flex-wrap gap-2">
        {selectedDriverIds.map((id, idx) => {
          const driver = getDriverById(id);
          const imageUrl = getDriverImageUrl(id);

          return (
            <div
              key={id}
              className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.06)] bg-surface-2 py-1 pl-1.5 pr-2"
              style={{ borderColor: `${COMPARISON_COLORS[idx]}40` }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COMPARISON_COLORS[idx] }}
              />
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full"
                />
              )}
              <span className="text-xs font-medium text-text-primary">
                {driver?.code ?? id}
              </span>
              <button
                onClick={() => onRemove(id)}
                className="ml-0.5 rounded-full p-0.5 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Search & add */}
      {selectedDriverIds.length < 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-glow focus:outline-none"
          />
          {search && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 shadow-lg">
              {filtered
                .filter((d) => !selectedDriverIds.includes(d.id))
                .slice(0, 10)
                .map((d) => {
                  const imageUrl = getDriverImageUrl(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        onAdd(d.id);
                        setSearch("");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-3"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      ) : (
                        <Plus className="size-4 text-text-tertiary" />
                      )}
                      <span>
                        {d.firstName} {d.lastName}
                      </span>
                      <span className="ml-auto text-xs text-text-secondary">
                        {d.code}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Race Picker
// ---------------------------------------------------------------------------

function RacePicker({
  seasonData,
  selectedRound,
  onChange,
}: {
  seasonData: Season | null;
  selectedRound: number | null;
  onChange: (round: number) => void;
}) {
  if (!seasonData) return null;

  const races = seasonData.races.filter(
    (r) => r.results && r.results.length > 0
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        Race
      </label>
      <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-2">
        {races.map((race) => (
          <button
            key={race.round}
            onClick={() => onChange(race.round)}
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
  );
}

// ---------------------------------------------------------------------------
// Main Compare Client
// ---------------------------------------------------------------------------

export function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State from URL
  const initialYear = Number(searchParams.get("year")) || 2024;
  const initialRound = searchParams.get("round")
    ? Number(searchParams.get("round"))
    : null;
  const initialDrivers = searchParams.get("drivers")
    ? searchParams.get("drivers")!.split(",")
    : [];

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedRound, setSelectedRound] = useState<number | null>(
    initialRound
  );
  const [selectedDriverIds, setSelectedDriverIds] =
    useState<string[]>(initialDrivers);
  const [seasonData, setSeasonData] = useState<Season | null>(null);
  const [telemetryData, setTelemetryData] =
    useState<DetailedTelemetry | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Sync URL
  const updateUrl = useCallback(
    (year: number, round: number | null, drivers: string[]) => {
      const params = new URLSearchParams();
      params.set("year", String(year));
      if (round) params.set("round", String(round));
      if (drivers.length > 0) params.set("drivers", drivers.join(","));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Load season data
  useEffect(() => {
    let cancelled = false;
    setLoadingSeason(true);
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

  // Auto-select first two drivers from standings if none selected
  useEffect(() => {
    if (
      seasonData &&
      selectedDriverIds.length === 0 &&
      seasonData.driverStandings.length >= 2
    ) {
      const top2 = seasonData.driverStandings.slice(0, 2).map((s) => s.id);
      setSelectedDriverIds(top2);
      updateUrl(selectedYear, selectedRound, top2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonData]); // intentionally only depend on seasonData

  // Auto-select first race if none selected
  useEffect(() => {
    if (
      seasonData &&
      selectedRound === null &&
      seasonData.races.length > 0
    ) {
      const firstRace = seasonData.races.find(
        (r) => r.results && r.results.length > 0
      );
      if (firstRace) {
        setSelectedRound(firstRace.round);
        updateUrl(selectedYear, firstRace.round, selectedDriverIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonData]); // intentionally only depend on seasonData

  // Fetch telemetry when round changes
  useEffect(() => {
    if (!selectedRound) {
      setTelemetryData(null);
      return;
    }

    let cancelled = false;
    setLoadingTelemetry(true);

    fetch(`/api/telemetry-detail/${selectedYear}/${selectedRound}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (!cancelled) setTelemetryData(data as DetailedTelemetry | null);
      })
      .catch(() => {
        if (!cancelled) setTelemetryData(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTelemetry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedRound]);

  // Handlers
  const handleAddDriver = useCallback(
    (id: string) => {
      if (selectedDriverIds.includes(id) || selectedDriverIds.length >= 6)
        return;
      const next = [...selectedDriverIds, id];
      setSelectedDriverIds(next);
      updateUrl(selectedYear, selectedRound, next);
    },
    [selectedDriverIds, selectedYear, selectedRound, updateUrl]
  );

  const handleRemoveDriver = useCallback(
    (id: string) => {
      const next = selectedDriverIds.filter((d) => d !== id);
      setSelectedDriverIds(next);
      updateUrl(selectedYear, selectedRound, next);
    },
    [selectedDriverIds, selectedYear, selectedRound, updateUrl]
  );

  const handleRoundChange = useCallback(
    (round: number) => {
      setSelectedRound(round);
      updateUrl(selectedYear, round, selectedDriverIds);
    },
    [selectedYear, selectedDriverIds, updateUrl]
  );

  // Build driver entries for the chart
  const driverEntries = useMemo(() => {
    if (!telemetryData) return [];
    return selectedDriverIds
      .map((id, idx) => {
        const telDriver = telemetryData.drivers[id];
        if (!telDriver) return null;
        const driver = getDriverById(id);
        return {
          driverId: id,
          label: driver
            ? `${driver.firstName} ${driver.lastName}`
            : telDriver.abbreviation,
          color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
          data: telDriver,
        };
      })
      .filter(
        (
          e
        ): e is {
          driverId: string;
          label: string;
          color: string;
          data: NonNullable<typeof e>["data"];
        } => e != null && e.data != null
      );
  }, [telemetryData, selectedDriverIds]);

  // Race name
  const selectedRaceName = useMemo(() => {
    if (!seasonData || !selectedRound) return "";
    const race = seasonData.races.find((r) => r.round === selectedRound);
    return race?.name ?? `Round ${selectedRound}`;
  }, [seasonData, selectedRound]);

  // Missing drivers (selected but no telemetry)
  const missingDrivers = useMemo(() => {
    if (!telemetryData) return [];
    return selectedDriverIds.filter((id) => !telemetryData.drivers[id]);
  }, [telemetryData, selectedDriverIds]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar controls */}
      <div className="flex flex-col gap-5">
        {/* Year picker */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Season
          </label>
          <span className="inline-block rounded-md bg-glow px-3 py-1.5 text-sm font-medium text-white">
            2024
          </span>
          <p className="mt-1 text-xs text-text-tertiary">
            Telemetry data available for 2024 only
          </p>
        </div>

        {/* Driver picker */}
        {!loadingSeason && (
          <DriverPicker
            selectedDriverIds={selectedDriverIds}
            onAdd={handleAddDriver}
            onRemove={handleRemoveDriver}
            seasonData={seasonData}
          />
        )}

        {/* Race picker */}
        {!loadingSeason && (
          <RacePicker
            seasonData={seasonData}
            selectedRound={selectedRound}
            onChange={handleRoundChange}
          />
        )}
      </div>

      {/* Main content area */}
      <div className="space-y-6">
        {/* Header */}
        {selectedRound && telemetryData && (
          <div className="flex items-center gap-3">
            <Activity className="size-5 text-glow" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                {selectedRaceName}
              </h2>
              <p className="text-xs text-text-secondary">
                Fastest lap telemetry - Speed, Throttle, Brake, Gear data
              </p>
            </div>
          </div>
        )}

        {/* Lap time comparison cards */}
        {driverEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {driverEntries.map((entry) => {
              const driver = getDriverById(entry.driverId);
              const imageUrl = getDriverImageUrl(entry.driverId);
              // Parse lap time to display nicely
              const lapTimeRaw = entry.data.lapTime;
              let lapTimeDisplay = lapTimeRaw;
              // Format "0 days 00:01:32.608000" to "1:32.608"
              const match = lapTimeRaw.match(
                /(\d+):(\d+):(\d+)\.(\d+)/
              );
              if (match) {
                const mins = parseInt(match[2]);
                const secs = match[3];
                const ms = match[4].slice(0, 3);
                lapTimeDisplay = `${mins}:${secs}.${ms}`;
              }

              return (
                <Card
                  key={entry.driverId}
                  className="border-[rgba(255,255,255,0.06)] bg-surface-1"
                  style={{ borderTop: `3px solid ${entry.color}` }}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {driver?.lastName ?? entry.data.abbreviation}
                      </p>
                      <p className="stats-number text-xs text-text-secondary">
                        {lapTimeDisplay}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Missing drivers warning */}
        {missingDrivers.length > 0 && telemetryData && (
          <p className="text-xs text-text-secondary">
            No telemetry available for:{" "}
            {missingDrivers
              .map((id) => {
                const d = getDriverById(id);
                return d ? d.code : id;
              })
              .join(", ")}
          </p>
        )}

        {/* Loading state */}
        {loadingTelemetry && (
          <SkeletonChart type="line" className="h-96" />
        )}

        {/* Speed trace chart */}
        {!loadingTelemetry && driverEntries.length > 0 && (
          <SpeedTraceChart drivers={driverEntries} />
        )}

        {/* Empty state */}
        {!loadingTelemetry && !loadingSeason && driverEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-20">
            <Activity className="size-8 text-text-tertiary" />
            <p className="text-text-secondary">
              {selectedDriverIds.length === 0
                ? "Select drivers and a race to compare speed traces"
                : selectedRound
                  ? "No telemetry data available for the selected combination"
                  : "Select a race to view telemetry"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
