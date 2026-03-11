import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced";
}

const config = {
  beginner: {
    label: "Beginner",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  advanced: {
    label: "Advanced",
    className: "bg-glow/15 text-glow border-glow/30",
  },
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { label, className } = config[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
