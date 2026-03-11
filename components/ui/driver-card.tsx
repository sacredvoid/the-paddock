import Link from "next/link";
import Image from "next/image";
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
  imageUrl?: string;
  className?: string;
}

export function DriverCard({ driver, imageUrl, className }: DriverCardProps) {
  const teamColor = driver.teamId ? getTeamColor(driver.teamId) : "#888888";

  return (
    <Link href={`/drivers/${driver.slug}`} className="block">
      <Card
        className={cn(
          "border-border-subtle bg-surface transition-transform duration-200 hover:-translate-y-0.5 overflow-hidden",
          className
        )}
        style={{ borderTop: `4px solid ${teamColor}` }}
      >
        {/* Driver headshot */}
        <div className="relative mx-auto mt-4 size-20 overflow-hidden rounded-full border-2 border-border-subtle bg-surface-elevated">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${driver.firstName} ${driver.lastName}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              {driver.number != null ? (
                <span
                  className="stats-number text-xl font-black"
                  style={{ color: teamColor }}
                >
                  {driver.number}
                </span>
              ) : (
                <span
                  className="text-lg font-bold"
                  style={{ color: teamColor }}
                >
                  {driver.firstName.charAt(0)}
                  {driver.lastName.charAt(0)}
                </span>
              )}
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-3">
          {/* Name */}
          <div className="text-center">
            <span className="block text-sm text-text-secondary">
              {driver.firstName}
            </span>
            <span className="block text-lg font-bold text-text-primary">
              {driver.lastName}
            </span>
          </div>

          {/* Nationality */}
          <span className="text-center text-sm text-text-secondary">
            {driver.nationality}
          </span>

          {/* Wins stat */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-text-secondary">
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
