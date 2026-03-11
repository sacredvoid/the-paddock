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
  up: { icon: TrendingUp, className: "text-green-500" },
  down: { icon: TrendingDown, className: "text-red-500" },
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
        "border-border-subtle bg-surface",
        className
      )}
      style={
        teamColor
          ? { borderLeft: `4px solid ${teamColor}` }
          : undefined
      }
    >
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="stats-number mt-1 text-3xl font-bold text-text-primary">
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
