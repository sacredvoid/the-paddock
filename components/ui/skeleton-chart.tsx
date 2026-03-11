import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonChartProps {
  type: "bar" | "line" | "radar";
  className?: string;
}

export function SkeletonChart({ type, className }: SkeletonChartProps) {
  return (
    <div className={cn("relative h-64 w-full overflow-hidden rounded-lg", className)}>
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-end justify-center p-6">
        {type === "bar" && <BarSkeleton />}
        {type === "line" && <LineSkeleton />}
        {type === "radar" && <RadarSkeleton />}
      </div>
    </div>
  );
}

function BarSkeleton() {
  const heights = [40, 65, 85, 55, 72];
  return (
    <div className="flex h-full w-full items-end justify-center gap-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-8 animate-pulse rounded-t bg-muted-foreground/20"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function LineSkeleton() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <path
        d="M 0 60 Q 25 30, 50 45 T 100 25 T 150 40 T 200 15"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="animate-pulse text-muted-foreground/20"
      />
    </svg>
  );
}

function RadarSkeleton() {
  // Hexagonal shape centered at 50,50, radius ~35
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const r = 35;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full max-w-[200px]"
      preserveAspectRatio="xMidYMid meet"
    >
      <polygon
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="animate-pulse text-muted-foreground/20"
      />
    </svg>
  );
}
