import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PredictClient } from "@/components/predict/predict-client";

export const metadata: Metadata = {
  title: "Race Predictions - The Paddock",
  description:
    "AI-powered F1 race predictions. Adjust variables and see how outcomes change.",
};

export default function PredictPage() {
  return (
    <div>
      <PageHeader
        title="Race Predictions"
        subtitle="AI-powered race outcome forecasting"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Predict" },
        ]}
      />
      <Suspense
        fallback={
          <div className="h-[400px] animate-pulse rounded-xl bg-surface-1" />
        }
      >
        <PredictClient />
      </Suspense>
    </div>
  );
}
