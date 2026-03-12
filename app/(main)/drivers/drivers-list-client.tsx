"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { DriverCard } from "@/components/ui/driver-card";
import { FilterBar, type FilterConfig } from "@/components/ui/filter-bar";

interface DriverForList {
  slug: string;
  firstName: string;
  lastName: string;
  code: string;
  number: number;
  nationality: string;
  isActive: boolean;
  stats: {
    wins: number;
    championships: number;
    races: number;
    podiums: number;
    points: number;
  };
}

interface DriversListClientProps {
  drivers: DriverForList[];
  nationalities: string[];
  driverImageUrls: Record<string, string>;
}

type StatusFilter = "all" | "active" | "historic";
type SortOption = "name" | "wins" | "championships" | "races" | "points";

export function DriversListClient({
  drivers,
  nationalities,
  driverImageUrls,
}: DriversListClientProps) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const statusFilter = (filterValues.status ?? "all") as StatusFilter;
  const nationalityFilter = filterValues.nationality ?? "all";
  const sortBy = (filterValues.sort ?? "name") as SortOption;

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "all", label: "All Drivers" },
        { value: "active", label: "Active" },
        { value: "historic", label: "Historic" },
      ],
    },
    {
      key: "nationality",
      label: "Nationality",
      options: [
        { value: "all", label: "All Nationalities" },
        ...nationalities.map((n) => ({ value: n, label: n })),
      ],
    },
    {
      key: "sort",
      label: "Sort By",
      options: [
        { value: "name", label: "Name (A-Z)" },
        { value: "wins", label: "Most Wins" },
        { value: "championships", label: "Most Championships" },
        { value: "races", label: "Most Races" },
        { value: "points", label: "Most Points" },
      ],
    },
  ];

  const filtered = useMemo(() => {
    let result = drivers;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.nationality.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((d) => d.isActive);
    } else if (statusFilter === "historic") {
      result = result.filter((d) => !d.isActive);
    }

    // Nationality filter
    if (nationalityFilter !== "all") {
      result = result.filter((d) => d.nationality === nationalityFilter);
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "wins":
        sorted.sort((a, b) => b.stats.wins - a.stats.wins);
        break;
      case "championships":
        sorted.sort((a, b) => b.stats.championships - a.stats.championships);
        break;
      case "races":
        sorted.sort((a, b) => b.stats.races - a.stats.races);
        break;
      case "points":
        sorted.sort((a, b) => b.stats.points - a.stats.points);
        break;
      case "name":
      default:
        sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
        break;
    }

    // When sorted by name with no specific status filter, show active first
    if (sortBy === "name" && statusFilter === "all") {
      const active = sorted.filter((d) => d.isActive);
      const historic = sorted.filter((d) => !d.isActive);
      return { active, historic };
    }

    return { active: sorted, historic: [] };
  }, [drivers, search, statusFilter, nationalityFilter, sortBy]);

  const totalShown = filtered.active.length + filtered.historic.length;

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search drivers by name, code, or nationality..."
        onSearchChange={setSearch}
        className="border border-[rgba(255,255,255,0.06)]"
      />

      {/* Results count */}
      <p className="text-sm text-text-secondary">
        Showing{" "}
        <span className="stats-number font-medium text-text-primary">
          {totalShown}
        </span>{" "}
        {totalShown === 1 ? "driver" : "drivers"}
      </p>

      {/* Active drivers section */}
      {filtered.active.length > 0 && (
        <div>
          {filtered.historic.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <h2
                className="text-xl font-bold text-text-primary"
              >
                Active Drivers
              </h2>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
              <span className="stats-number text-sm text-text-secondary">
                {filtered.active.length}
              </span>
            </div>
          )}
          <motion.div
            key={`active-${statusFilter}-${nationalityFilter}-${sortBy}-${search}`}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.03 } },
            }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {filtered.active.map((driver) => (
              <motion.div
                key={driver.slug}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <DriverCard
                  driver={{
                    slug: driver.slug,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    code: driver.code,
                    number: driver.number || undefined,
                    nationality: driver.nationality,
                    stats: {
                      wins: driver.stats.wins,
                      championships: driver.stats.championships,
                    },
                  }}
                  imageUrl={driverImageUrls[driver.slug]}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Historic drivers section */}
      {filtered.historic.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2
              className="text-xl font-bold text-text-primary"
            >
              Historic Drivers
            </h2>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.06)]" />
            <span className="stats-number text-sm text-text-secondary">
              {filtered.historic.length}
            </span>
          </div>
          <motion.div
            key={`historic-${statusFilter}-${nationalityFilter}-${sortBy}-${search}`}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.02 } },
            }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {filtered.historic.map((driver) => (
              <motion.div
                key={driver.slug}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <DriverCard
                  driver={{
                    slug: driver.slug,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    code: driver.code,
                    number: driver.number || undefined,
                    nationality: driver.nationality,
                    stats: {
                      wins: driver.stats.wins,
                      championships: driver.stats.championships,
                    },
                  }}
                  imageUrl={driverImageUrls[driver.slug]}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      {totalShown === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 py-16">
          <p className="text-lg font-medium text-text-primary">
            No drivers found
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
