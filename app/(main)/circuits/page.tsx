import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Flag, Trophy } from "lucide-react";
import { getAllCircuits } from "@/lib/data";
import { getCircuitSvgPath } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { CircuitMap } from "./circuit-map";

export const metadata: Metadata = {
  title: "Circuits - The Paddock",
  description:
    "Explore every Formula 1 circuit, from legendary tracks like Monza and Monaco to modern venues around the world.",
};

export default function CircuitsPage() {
  const circuits = getAllCircuits();

  // Sort by total races descending
  const sorted = [...circuits].sort((a, b) => b.totalRaces - a.totalRaces);

  // Summary stats
  const totalCircuits = circuits.length;
  const countries = new Set(circuits.map((c) => c.country));
  const totalCountries = countries.size;
  const mostUsed = sorted[0];

  return (
    <div>
      <PageHeader
        title="Circuits"
        subtitle="Every track that has hosted a Formula 1 World Championship race"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Circuits" },
        ]}
      />

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Circuits" value={totalCircuits} />
        <StatCard label="Countries" value={totalCountries} />
        <StatCard label="Most Races" value={`${mostUsed.name} (${mostUsed.totalRaces})`} />
      </div>

      {/* World Map */}
      <div className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          Circuit Locations
        </h2>
        <CircuitMap circuits={circuits} />
        <p className="mt-2 text-xs text-text-secondary">
          Hover over a marker to see circuit details. Scroll to zoom, drag to pan.
        </p>
      </div>

      {/* Circuit List */}
      <h2
        className="mb-4 text-xl font-semibold text-text-primary"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        All Circuits
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((circuit) => (
          <Link key={circuit.slug} href={`/circuits/${circuit.slug}`} className="group">
            <Card className="border-border-subtle bg-surface transition-colors duration-150 hover:border-f1-red/40 hover:bg-surface-elevated">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-base font-semibold text-text-primary"
                      style={{ fontFamily: "var(--font-titillium)" }}
                    >
                      {circuit.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {circuit.city}, {circuit.country}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="stats-number text-2xl font-bold text-text-primary">
                      {circuit.totalRaces}
                    </span>
                    <span className="text-xs text-text-secondary">
                      race{circuit.totalRaces !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {/* Circuit track outline */}
                <div className="mt-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCircuitSvgPath(circuit.id)}
                    alt={`${circuit.name} track layout`}
                    width={120}
                    height={80}
                    className="h-20 w-30 object-contain opacity-60 transition-opacity duration-150 group-hover:opacity-90"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
