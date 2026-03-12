"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/navigation";
import { MobileNav } from "./mobile-nav";
import { useState, useCallback } from "react";

export function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openSearch = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.06)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold"
        >
          <span className="text-text-secondary">THE</span>
          <span className="text-glow">PADDOCK</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-glow"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Search trigger - opens Cmd+K command palette */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1/60 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-[rgba(255,255,255,0.12)] hover:text-text-primary md:flex"
          >
            <Search className="size-3.5" />
            <span>Search</span>
            <kbd className="ml-1 rounded border border-[rgba(255,255,255,0.08)] bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary">
              ⌘K
            </kbd>
          </button>
          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
            onClick={openSearch}
          >
            <Search className="size-4" />
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile navigation sheet */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </header>
  );
}
