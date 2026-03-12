"use client";

import { AnimateIn, StaggerChildren, StaggerItem } from "@/components/ui/animate-in";
import { CountUp } from "@/components/ui/count-up";

/**
 * Animated stat pill for the hero section.
 * Renders a CountUp for numeric values or static text for ranges like "1950-2026".
 */
export function AnimatedStatPill({
  value,
  label,
  isRange,
  rangeText,
  index,
}: {
  value?: number;
  label: string;
  isRange?: boolean;
  rangeText?: string;
  index: number;
}) {
  return (
    <AnimateIn delay={0.1 + index * 0.08} direction="up">
      <span className="rounded-full border border-[rgba(255,255,255,0.06)] bg-surface-1 px-4 py-1.5 text-sm text-text-secondary inline-flex items-center gap-1.5">
        {isRange ? (
          <span className="stats-number font-bold text-text-primary">
            {rangeText}
          </span>
        ) : (
          <CountUp
            value={value ?? 0}
            className="stats-number font-bold text-text-primary"
          />
        )}
        {" "}{label}
      </span>
    </AnimateIn>
  );
}

/**
 * Wraps the hero section with a fade-in animation.
 */
export function AnimatedHero({ children }: { children: React.ReactNode }) {
  return (
    <AnimateIn delay={0} direction="up">
      {children}
    </AnimateIn>
  );
}

/**
 * Wraps a section with AnimateIn.
 */
export function AnimatedSection({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}) {
  return (
    <AnimateIn delay={delay} direction={direction} className={className}>
      {children}
    </AnimateIn>
  );
}

/**
 * Stagger wrapper for card grids.
 */
export function AnimatedCardGrid({
  children,
  className,
  staggerDelay,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <StaggerChildren className={className} staggerDelay={staggerDelay}>
      {children}
    </StaggerChildren>
  );
}

/**
 * Stagger item wrapper for individual cards.
 */
export function AnimatedCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <StaggerItem className={className}>{children}</StaggerItem>;
}
