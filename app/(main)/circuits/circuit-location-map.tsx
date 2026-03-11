"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CircuitLocationMapProps {
  lat: number;
  lng: number;
  name: string;
}

export function CircuitLocationMap({ lat, lng, name }: CircuitLocationMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 800,
          center: [lng, lat],
        }}
        width={800}
        height={400}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1E1E1E"
                stroke="#2A2A2A"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        <Marker coordinates={[lng, lat]}>
          {/* Pulse animation ring */}
          <circle
            r={12}
            fill="none"
            stroke="#E10600"
            strokeWidth={1.5}
            opacity={0.4}
          >
            <animate
              attributeName="r"
              from="6"
              to="18"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.6"
              to="0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Main dot */}
          <circle
            r={6}
            fill="#E10600"
            stroke="#F5F5F5"
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 0 6px rgba(225, 6, 0, 0.6))" }}
          />
          {/* Label */}
          <text
            textAnchor="middle"
            y={-16}
            style={{
              fontFamily: "var(--font-titillium), sans-serif",
              fill: "#F5F5F5",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {name}
          </text>
        </Marker>
      </ComposableMap>
    </div>
  );
}
