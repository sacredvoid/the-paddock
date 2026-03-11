"use client";

import { SCORING_SYSTEMS } from "@/lib/scoring-systems";
import { cn } from "@/lib/utils";

interface ScoringPickerProps {
  value: string;
  onChange: (id: string) => void;
  removeDNFs: boolean;
  onRemoveDNFsChange: (value: boolean) => void;
}

export function ScoringPicker({
  value,
  onChange,
  removeDNFs,
  onRemoveDNFsChange,
}: ScoringPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-text-secondary">
        Scoring System
      </label>
      <div className="flex flex-col gap-2">
        {SCORING_SYSTEMS.map((system) => (
          <button
            key={system.id}
            type="button"
            onClick={() => onChange(system.id)}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
              value === system.id
                ? "border-f1-red bg-f1-red/10"
                : "border-border-subtle bg-surface hover:border-text-secondary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-medium",
                  value === system.id ? "text-text-primary" : "text-text-primary"
                )}
              >
                {system.name}
              </span>
              <span className="text-xs text-text-secondary">{system.years}</span>
            </div>
            <span className="text-xs text-text-secondary">
              {system.description}
            </span>
          </button>
        ))}
      </div>

      {/* Remove DNFs toggle */}
      <div className="mt-1 flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">
            Remove DNFs
          </span>
          <span className="text-xs text-text-secondary">
            Exclude non-finishers and re-rank remaining drivers
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={removeDNFs}
          onClick={() => onRemoveDNFsChange(!removeDNFs)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
            removeDNFs ? "bg-f1-red" : "bg-border-subtle"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 block h-5 w-5 rounded-full bg-white transition-transform",
              removeDNFs && "translate-x-5"
            )}
          />
        </button>
      </div>
    </div>
  );
}
