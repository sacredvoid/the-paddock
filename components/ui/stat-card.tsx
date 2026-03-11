import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  teamColor?: string;
  className?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-danger" },
  neutral: { icon: Minus, className: "text-text-secondary" },
} as const;

export function StatCard({
  label,
  value,
  trend,
  teamColor,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "bg-surface-1 border-[rgba(255,255,255,0.06)] rounded-xl card-glow",
        className
      )}
      style={
        teamColor
          ? { borderLeft: `3px solid ${teamColor}` }
          : undefined
      }
    >
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="section-label">{label}</p>
          <p className="stats-number mt-1 text-3xl font-semibold text-text-primary">
            {value}
          </p>
        </div>
        {trend && (
          <TrendIndicator trend={trend} />
        )}
      </CardContent>
    </Card>
  );
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "neutral" }) {
  const { icon: Icon, className } = trendConfig[trend];
  return <Icon className={cn("mt-1 size-5", className)} />;
}
