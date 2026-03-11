import { cn } from "@/lib/utils";

interface CircuitMiniMapProps {
  svgPath?: string;
  circuitId?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function CircuitMiniMap({
  svgPath,
  className,
  width = 64,
  height = 64,
}: CircuitMiniMapProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {svgPath ? (
        <path
          d={svgPath}
          stroke="var(--color-f1-red)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : (
        <circle
          cx={50}
          cy={50}
          r={40}
          stroke="var(--color-f1-red)"
          strokeWidth={2}
          fill="none"
        />
      )}
    </svg>
  );
}
