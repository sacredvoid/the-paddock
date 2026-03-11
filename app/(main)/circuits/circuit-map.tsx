"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { Circuit } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CircuitMapProps {
  circuits: Circuit[];
}

export function CircuitMap({ circuits }: CircuitMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    city: string;
    country: string;
    totalRaces: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-background">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [10, 30],
        }}
        width={800}
        height={450}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#111113"
                  stroke="#1A1A1E"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#1A1A1E" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {circuits.map((circuit) => (
            <Marker
              key={circuit.id}
              coordinates={[circuit.lng, circuit.lat]}
              onMouseEnter={(evt) => {
                const target = evt.currentTarget;
                const svg = target.closest("svg");
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const point = svg.createSVGPoint();
                const ctm = target.getScreenCTM();
                if (!ctm) return;
                point.x = 0;
                point.y = 0;
                const screenPoint = point.matrixTransform(ctm);
                setTooltip({
                  name: circuit.name,
                  city: circuit.city,
                  country: circuit.country,
                  totalRaces: circuit.totalRaces,
                  x: screenPoint.x - rect.left,
                  y: screenPoint.y - rect.top,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle
                r={3}
                fill="#FF6B2C"
                stroke="#F5F5F5"
                strokeWidth={0.5}
                className="cursor-pointer transition-all duration-150 hover:r-[5]"
                style={{ filter: "drop-shadow(0 0 3px rgba(255, 107, 44, 0.5))" }}
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 py-2 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -120%)",
          }}
        >
          <p className="text-sm font-semibold text-text-primary">
            {tooltip.name}
          </p>
          <p className="text-xs text-text-secondary">
            {tooltip.city}, {tooltip.country}
          </p>
          <p className="mt-1 text-xs text-glow">
            {tooltip.totalRaces} race{tooltip.totalRaces !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
