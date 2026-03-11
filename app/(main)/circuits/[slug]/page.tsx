import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Globe, Navigation } from "lucide-react";
import { getAllCircuits, getCircuit } from "@/lib/data";
import { getCircuitSvgPath } from "@/lib/images";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { CircuitLocationMap } from "../circuit-location-map";

export async function generateStaticParams() {
  return getAllCircuits().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const circuit = getCircuit(slug);
  if (!circuit) return { title: "Circuit Not Found - The Paddock" };

  return {
    title: `${circuit.name} - The Paddock`,
    description: `${circuit.name} in ${circuit.city}, ${circuit.country}. ${circuit.totalRaces} Formula 1 races hosted.`,
  };
}

export default async function CircuitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const circuit = getCircuit(slug);

  if (!circuit) {
    notFound();
  }

  // Format coordinates for display
  const latDir = circuit.lat >= 0 ? "N" : "S";
  const lngDir = circuit.lng >= 0 ? "E" : "W";
  const latDisplay = `${Math.abs(circuit.lat).toFixed(4)}\u00B0 ${latDir}`;
  const lngDisplay = `${Math.abs(circuit.lng).toFixed(4)}\u00B0 ${lngDir}`;

  return (
    <div>
      <PageHeader
        title={circuit.name}
        subtitle={`${circuit.city}, ${circuit.country}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Circuits", href: "/circuits" },
          { label: circuit.name },
        ]}
      />

      {/* Circuit Track Outline */}
      <div className="mb-8 flex justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getCircuitSvgPath(circuit.id)}
          alt={`${circuit.name} track layout`}
          className="h-auto w-full max-w-md object-contain"
        />
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Races" value={circuit.totalRaces} />
        <StatCard label="Country" value={circuit.country} />
        <StatCard label="City" value={circuit.city} />
        <StatCard label="Coordinates" value={`${latDisplay}, ${lngDisplay}`} />
      </div>

      {/* Location Details */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info Panel */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-text-primary">
            Location Details
          </h2>

          <div className="space-y-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2">
                <MapPin className="size-4 text-glow" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">City</p>
                <p className="text-sm font-medium text-text-primary">
                  {circuit.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2">
                <Globe className="size-4 text-glow" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Country</p>
                <p className="text-sm font-medium text-text-primary">
                  {circuit.country}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2">
                <Navigation className="size-4 text-glow" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Latitude</p>
                <p className="stats-number text-sm font-medium text-text-primary">
                  {latDisplay}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2">
                <Navigation className="size-4 text-glow" style={{ transform: "rotate(90deg)" }} />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Longitude</p>
                <p className="stats-number text-sm font-medium text-text-primary">
                  {lngDisplay}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
            <p className="text-xs text-text-secondary">Races Hosted</p>
            <p className="stats-number mt-1 text-4xl font-bold text-glow">
              {circuit.totalRaces}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Formula 1 World Championship
            </p>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Circuit Location
          </h2>
          <CircuitLocationMap
            lat={circuit.lat}
            lng={circuit.lng}
            name={circuit.name}
          />
        </div>
      </div>
    </div>
  );
}
