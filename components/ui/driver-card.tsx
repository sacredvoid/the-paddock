import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getTeamColor } from "@/lib/team-colors";
import { Trophy } from "lucide-react";

interface DriverCardDriver {
  slug: string;
  firstName: string;
  lastName: string;
  code?: string;
  number?: number;
  nationality: string;
  teamId?: string;
  stats: {
    wins: number;
    championships: number;
  };
}

interface DriverCardProps {
  driver: DriverCardDriver;
  className?: string;
}

export function DriverCard({ driver, className }: DriverCardProps) {
  const teamColor = driver.teamId ? getTeamColor(driver.teamId) : "#888888";

  return (
    <Link href={`/drivers/${driver.slug}`} className="block">
      <Card
        className={cn(
          "border-border-subtle bg-surface transition-transform duration-200 hover:-translate-y-0.5",
          className
        )}
        style={{ borderTop: `4px solid ${teamColor}` }}
      >
        <CardContent className="flex flex-col gap-3">
          {/* Driver number */}
          {driver.number != null && (
            <span
              className="stats-number text-4xl font-black leading-none"
              style={{ color: teamColor }}
            >
              {driver.number}
            </span>
          )}

          {/* Name */}
          <div>
            <span className="block text-sm text-text-secondary">
              {driver.firstName}
            </span>
            <span className="block text-lg font-bold text-text-primary">
              {driver.lastName}
            </span>
          </div>

          {/* Nationality */}
          <span className="text-sm text-text-secondary">
            {driver.nationality}
          </span>

          {/* Wins stat */}
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Trophy className="size-4 text-f1-red" />
            <span className="stats-number font-medium text-text-primary">
              {driver.stats.wins}
            </span>
            <span>wins</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
