import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-surface-1">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">
            <span className="text-text-secondary">THE </span>
            <span className="text-glow">PADDOCK</span>
          </span>
          <span className="text-sm text-text-tertiary">
            Not affiliated with Formula 1 or FIA
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-text-tertiary">
          <span className="hidden sm:inline">Data from Jolpica F1 API and F1DB</span>
          <Link
            href="https://github.com/sacredvoid/the-paddock"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
            aria-label="GitHub repository"
          >
            <Github className="size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
