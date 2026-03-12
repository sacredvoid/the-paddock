"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, animate } from "motion/react";

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (latest) => {
        if (decimals > 0) {
          setDisplayValue(latest.toFixed(decimals));
        } else {
          setDisplayValue(Math.round(latest).toLocaleString());
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, decimals, motionValue]);

  return (
    <span ref={ref} className={className ?? "stats-number"}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
