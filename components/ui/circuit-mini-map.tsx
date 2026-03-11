import { cn } from "@/lib/utils";
import { getCircuitSvgPath } from "@/lib/images";

interface CircuitMiniMapProps {
  svgPath?: string;
  circuitId?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function CircuitMiniMap({
  svgPath,
  circuitId,
  className,
  width = 64,
  height = 64,
}: CircuitMiniMapProps) {
  // If a circuitId is provided, render the SVG file as an image
  if (circuitId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getCircuitSvgPath(circuitId)}
        alt="Track layout"
        width={width}
        height={height}
        className={cn("shrink-0 object-contain", className)}
        loading="lazy"
      />
    );
  }

  // Fallback: inline SVG with path data (original behavior)
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
