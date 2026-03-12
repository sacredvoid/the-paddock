"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CompareClient } from "@/components/compare/compare-client";
import { SkeletonChart } from "@/components/ui/skeleton-chart";

function CompareFallback() {
  return (
    <div>
      <PageHeader
        title="Compare"
        subtitle="Overlay fastest-lap speed traces, throttle, brake, and gear data"
      />
      <div className="flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 px-6 py-16">
        <SkeletonChart type="line" className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div>
      <PageHeader
        title="Compare"
        subtitle="Overlay fastest-lap speed traces, throttle, brake, and gear data"
      />
      <Suspense fallback={<CompareFallback />}>
        <CompareClient />
      </Suspense>
    </div>
  );
}
