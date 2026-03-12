"use client";

import { useState } from "react";
import {
  CloudRain,
  Sun,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VariableOverrides {
  isWet: boolean;
  safetyCarLikelihood: "low" | "medium" | "high";
  driverFormAdjustments: Record<string, number>;
}

interface VariableControlsProps {
  overrides: VariableOverrides;
  onUpdate: (overrides: VariableOverrides) => void;
  driverEntries: { driverId: string; driverName: string; teamColor: string }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VariableControls({
  overrides,
  onUpdate,
  driverEntries,
}: VariableControlsProps) {
  const [driversExpanded, setDriversExpanded] = useState(false);

  return (
    <div className="space-y-5">
      {/* Rain toggle */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Weather Conditions
        </label>
        <button
          onClick={() => onUpdate({ ...overrides, isWet: !overrides.isWet })}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            overrides.isWet
              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
              : "border-[rgba(255,255,255,0.06)] bg-surface-2 text-text-primary"
          }`}
        >
          {overrides.isWet ? (
            <CloudRain className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          {overrides.isWet ? "Wet" : "Dry"}
        </button>
      </div>

      {/* Safety car likelihood */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary">
          <ShieldAlert className="size-3.5" />
          Safety Car Likelihood
        </label>
        <div className="flex gap-1.5">
          {(["low", "medium", "high"] as const).map((level) => (
            <button
              key={level}
              onClick={() =>
                onUpdate({ ...overrides, safetyCarLikelihood: level })
              }
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                overrides.safetyCarLikelihood === level
                  ? "bg-glow/15 text-glow"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Per-driver form adjustments */}
      <div>
        <button
          onClick={() => setDriversExpanded(!driversExpanded)}
          className="flex w-full items-center justify-between text-sm font-medium text-text-secondary"
        >
          <span>Driver Form Adjustments</span>
          {driversExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {driversExpanded && (
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 p-3">
            {driverEntries.map((entry) => {
              const currentVal =
                overrides.driverFormAdjustments[entry.driverId] ?? 0;
              return (
                <div key={entry.driverId} className="flex items-center gap-3">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.teamColor }}
                  />
                  <span className="min-w-[100px] truncate text-xs text-text-primary">
                    {entry.driverName}
                  </span>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.5}
                    value={currentVal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdate({
                        ...overrides,
                        driverFormAdjustments: {
                          ...overrides.driverFormAdjustments,
                          [entry.driverId]: val,
                        },
                      });
                    }}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-3 accent-glow"
                  />
                  <span
                    className={`stats-number w-8 text-right text-xs ${
                      currentVal > 0
                        ? "text-success"
                        : currentVal < 0
                          ? "text-danger"
                          : "text-text-tertiary"
                    }`}
                  >
                    {currentVal > 0 ? "+" : ""}
                    {currentVal}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
