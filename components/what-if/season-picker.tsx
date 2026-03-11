"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableSeasons } from "@/lib/data";

interface SeasonPickerProps {
  value: string | null;
  onChange: (year: string) => void;
  championName?: string | null;
}

const seasons = getAvailableSeasons();

export function SeasonPicker({
  value,
  onChange,
  championName,
}: SeasonPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-secondary">Season</label>
      <Select
        value={value ?? undefined}
        onValueChange={(val) => {
          if (val != null) onChange(val);
        }}
      >
        <SelectTrigger className="w-full border-border-subtle bg-surface text-text-primary">
          <SelectValue placeholder="Select a season" />
        </SelectTrigger>
        <SelectContent className="bg-surface-elevated border-border-subtle">
          {seasons.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && championName && (
        <p className="text-xs text-text-secondary">
          Champion: <span className="text-accent">{championName}</span>
        </p>
      )}
    </div>
  );
}
