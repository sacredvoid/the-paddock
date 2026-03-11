"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Cycle: asc -> desc -> none
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <ScrollArea className={cn("w-full", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-border-subtle hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  alignClass(col.align),
                  col.sortable && "cursor-pointer select-none"
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <SortIndicator
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDirection : null}
                    />
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              className={cn(
                "border-border-subtle",
                rowIdx % 2 === 1 && "bg-surface-elevated/50"
              )}
            >
              {columns.map((col) => {
                const value = getNestedValue(row, col.key);
                const isNumeric = col.align === "right";

                return (
                  <TableCell
                    key={col.key}
                    className={cn(
                      alignClass(col.align),
                      isNumeric && "stats-number"
                    )}
                  >
                    {col.render ? col.render(value, row) : String(value ?? "")}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active || !direction) {
    return <ChevronsUpDown className="size-3.5 text-text-secondary" />;
  }
  if (direction === "asc") {
    return <ChevronUp className="size-3.5 text-f1-red" />;
  }
  return <ChevronDown className="size-3.5 text-f1-red" />;
}
