"use client";

import * as React from "react";
import { ChevronsUpDown, Flag } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Driver } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverSelectorProps {
  drivers: Driver[];
  value: string | null;
  onSelect: (slug: string) => void;
  placeholder?: string;
  excludeSlug?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DriverSelector({
  drivers,
  value,
  onSelect,
  placeholder = "Select a driver...",
  excludeSlug,
  className,
}: DriverSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedDriver = drivers.find((d) => d.slug === value);

  const filteredDrivers = React.useMemo(() => {
    return drivers.filter((d) => {
      if (excludeSlug && d.slug === excludeSlug) return false;
      return true;
    });
  }, [drivers, excludeSlug]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-2 px-3 text-sm transition-colors hover:border-glow/30",
          open && "border-glow/40",
          selectedDriver ? "text-text-primary" : "text-text-secondary"
        )}
      >
        {selectedDriver ? (
          <span className="flex items-center gap-2 truncate">
            <Flag className="size-3.5 shrink-0 text-text-secondary" />
            {selectedDriver.firstName} {selectedDriver.lastName}
            <span className="text-xs text-text-secondary">
              ({selectedDriver.nationality})
            </span>
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-text-secondary" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 shadow-xl">
          <Command shouldFilter={true}>
            <CommandInput
              placeholder="Search drivers..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No driver found.</CommandEmpty>
              <CommandGroup>
                {filteredDrivers.map((driver) => {
                  const fullName = `${driver.firstName} ${driver.lastName}`;
                  return (
                    <CommandItem
                      key={driver.slug}
                      value={fullName}
                      onSelect={() => {
                        onSelect(driver.slug);
                        setOpen(false);
                        setSearch("");
                      }}
                      data-checked={value === driver.slug ? "true" : undefined}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary">{fullName}</span>
                        <span className="text-xs text-text-secondary">
                          {driver.nationality}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
