"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-background p-0">
        <SheetHeader className="border-b border-border-subtle px-6 py-4">
          <SheetTitle
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="text-text-secondary">THE </span>
            <span className="text-f1-red">PADDOCK</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={`rounded-md px-4 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-f1-red"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
