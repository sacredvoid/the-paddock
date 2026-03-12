import Link from "next/link";
import { getAllRecords, getDriverById, getTeamById } from "@/lib/data";
import { getTeamColor } from "@/lib/team-colors";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateIn, StaggerChildren, StaggerItem } from "@/components/ui/animate-in";
import { Trophy, Medal, Award } from "lucide-react";
import type { Record as F1Record, RecordEntry } from "@/lib/types";

// Format record values based on the record title
function formatValue(value: number, title: string): string {
  if (title.toLowerCase().includes("win rate")) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (title.toLowerCase().includes("points")) {
    return value % 1 === 0 ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return value.toLocaleString();
}

// Suffix for the value (e.g., "wins", "poles")
function getValueSuffix(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("win rate")) return "";
  if (lower.includes("wins")) return "wins";
  if (lower.includes("pole")) return "poles";
  if (lower.includes("podium")) return "podiums";
  if (lower.includes("fastest")) return "fastest laps";
  if (lower.includes("championship")) return "titles";
  if (lower.includes("entries")) return "races";
  if (lower.includes("points")) return "pts";
  return "";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
        <Trophy className="size-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-gray-400/20 text-gray-400">
        <Medal className="size-4" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-amber-700/20 text-amber-600">
        <Award className="size-4" />
      </span>
    );
  }
  return (
    <span className="stats-number flex size-7 items-center justify-center text-sm text-text-secondary">
      {rank}
    </span>
  );
}

function RecordCard({ record }: { record: F1Record }) {
  const isDriverRecord = record.category === "drivers";
  const suffix = getValueSuffix(record.title);

  return (
    <Card className="border-[rgba(255,255,255,0.06)] bg-surface-1">
      <CardHeader>
        <CardTitle
          className="text-lg font-bold text-text-primary"
        >
          {record.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {record.entries.slice(0, 10).map((entry) => {
            const name = resolveName(entry, isDriverRecord);
            const href = resolveHref(entry, isDriverRecord);
            const color = resolveColor(entry, isDriverRecord);
            const isTop3 = entry.rank <= 3;

            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
                  isTop3
                    ? "bg-surface-2"
                    : "hover:bg-surface-2/50"
                }`}
                style={
                  isTop3 && color
                    ? { borderLeft: `3px solid ${color}` }
                    : undefined
                }
              >
                <RankBadge rank={entry.rank} />

                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link
                      href={href}
                      className="truncate text-sm font-medium text-text-primary hover:text-glow transition-colors"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium text-text-primary">
                      {name}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 text-right">
                  <span className="stats-number text-sm font-bold text-text-primary">
                    {formatValue(entry.value, record.title)}
                  </span>
                  {suffix && (
                    <span className="text-xs text-text-secondary">
                      {suffix}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function resolveName(entry: RecordEntry, isDriver: boolean): string {
  if (isDriver && entry.driverId) {
    const driver = getDriverById(entry.driverId);
    if (driver) return `${driver.firstName} ${driver.lastName}`;
    return entry.driverId;
  }
  if (!isDriver && entry.teamId) {
    const team = getTeamById(entry.teamId);
    if (team) return team.name;
    return entry.teamId;
  }
  return "Unknown";
}

function resolveHref(entry: RecordEntry, isDriver: boolean): string | null {
  if (isDriver && entry.driverId) {
    const driver = getDriverById(entry.driverId);
    if (driver) return `/drivers/${driver.slug}`;
  }
  if (!isDriver && entry.teamId) {
    const team = getTeamById(entry.teamId);
    if (team) return `/teams/${team.slug}`;
  }
  return null;
}

function resolveColor(entry: RecordEntry, isDriver: boolean): string | null {
  if (!isDriver && entry.teamId) {
    return getTeamColor(entry.teamId);
  }
  return null;
}

export const metadata = {
  title: "F1 Records - The Paddock",
  description:
    "All-time Formula 1 records for drivers and constructors, including wins, poles, podiums, championships, and more.",
};

export default function RecordsPage() {
  const records = getAllRecords();
  const driverRecords = records.filter((r) => r.category === "drivers");
  const constructorRecords = records.filter(
    (r) => r.category === "constructors"
  );

  return (
    <div>
      <AnimateIn direction="up">
        <PageHeader
          title="F1 Records"
          subtitle="All-time statistical records across 75+ years of Formula 1 racing"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Records" },
          ]}
        />
      </AnimateIn>

      {/* Driver Records */}
      <section className="mb-16">
        <AnimateIn direction="up">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-glow" />
            <h2
              className="text-2xl font-bold text-text-primary"
            >
              Driver Records
            </h2>
          </div>
        </AnimateIn>
        <StaggerChildren className="grid gap-6 md:grid-cols-2" staggerDelay={0.08}>
          {driverRecords.map((record) => (
            <StaggerItem key={record.title}>
              <RecordCard record={record} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Constructor Records */}
      <section>
        <AnimateIn direction="up">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-glow" />
            <h2
              className="text-2xl font-bold text-text-primary"
            >
              Constructor Records
            </h2>
          </div>
        </AnimateIn>
        <StaggerChildren className="grid gap-6 md:grid-cols-2" staggerDelay={0.08}>
          {constructorRecords.map((record) => (
            <StaggerItem key={record.title}>
              <RecordCard record={record} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>
    </div>
  );
}
