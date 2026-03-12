import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ReplayClient } from "@/components/replay/replay-client";

export const metadata: Metadata = {
  title: "Race Replay - The Paddock",
  description:
    "Watch F1 races unfold lap by lap with animated track visualization.",
};

export default function ReplayPage() {
  return (
    <div>
      <PageHeader
        title="Race Replay"
        subtitle="Watch races unfold lap by lap"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Race Replay" },
        ]}
      />
      <Suspense
        fallback={
          <div className="h-[600px] animate-pulse rounded-xl bg-surface-1" />
        }
      >
        <ReplayClient />
      </Suspense>
    </div>
  );
}
