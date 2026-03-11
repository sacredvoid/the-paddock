"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFilterChange: (key: string, value: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export function FilterBar({
  filters,
  onFilterChange,
  searchPlaceholder = "Search...",
  onSearchChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg bg-surface p-4",
        className
      )}
    >
      {/* Search input */}
      {onSearchChange && (
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon align="inline-start">
            <InputGroupText>
              <Search className="size-4" />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
      )}

      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          onValueChange={(val) => onFilterChange(filter.key, val as string)}
        >
          <SelectTrigger className="min-w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
