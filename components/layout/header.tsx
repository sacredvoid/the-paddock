"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/navigation";
import { MobileNav } from "./mobile-nav";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-text-secondary">THE</span>
          <span className="text-f1-red">PADDOCK</span>
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
                    ? "text-f1-red"
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
          {/* Search button placeholder */}
          <Button variant="ghost" size="icon" aria-label="Search">
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
