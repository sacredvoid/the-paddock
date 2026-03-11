import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center">
        {/* Branding */}
        <div
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-text-secondary">THE </span>
          <span className="text-f1-red">PADDOCK</span>
        </div>

        {/* Disclaimer */}
        <p className="max-w-md text-sm text-text-secondary">
          Not affiliated with Formula 1, FIA, or any F1 team.
        </p>

        {/* Attribution and links */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>Data from Jolpica F1 API and OpenF1</span>
          <Link
            href="https://github.com/sacredvoid/the-paddock"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
            aria-label="GitHub repository"
          >
            <Github className="size-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
