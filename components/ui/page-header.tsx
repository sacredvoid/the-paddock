import Link from "next/link";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-2 text-sm"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-text-secondary">/</span>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-accent hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text-secondary">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title */}
      <h1
        className="text-4xl font-bold text-text-primary"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-lg text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
