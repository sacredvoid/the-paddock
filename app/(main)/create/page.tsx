import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CreateClient } from "@/components/create/create-client";

export const metadata: Metadata = {
  title: "Create Post - The Paddock",
  description: "Generate shareable F1 graphics for social media.",
};

export default function CreatePage() {
  return (
    <div>
      <PageHeader
        title="Create Post"
        subtitle="Generate shareable F1 graphics"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Create" },
        ]}
      />
      <Suspense
        fallback={
          <div className="h-[400px] animate-pulse rounded-xl bg-surface-1" />
        }
      >
        <CreateClient />
      </Suspense>
    </div>
  );
}
