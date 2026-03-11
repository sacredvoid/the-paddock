import { Metadata } from "next";
import { getAllTopics } from "@/lib/mdx";
import { PageHeader } from "@/components/ui/page-header";
import { TopicCard } from "@/components/learn/topic-card";

export const metadata: Metadata = {
  title: "Learn F1 - The Paddock",
  description:
    "Everything you need to know about Formula 1. Beginner-friendly guides covering race weekends, tires, DRS, flags, points, pit strategy, and more.",
};

export default function LearnPage() {
  const topics = getAllTopics();

  const beginnerTopics = topics.filter((t) => t.difficulty === "beginner");
  const intermediateTopics = topics.filter(
    (t) => t.difficulty === "intermediate"
  );

  return (
    <div>
      <PageHeader
        title="Learn F1"
        subtitle="Everything you need to know about Formula 1"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Learn F1" },
        ]}
      />

      <p className="mb-10 max-w-2xl text-text-secondary leading-relaxed">
        New to Formula 1? Start with the beginner guides below to understand the
        basics of race weekends, tires, and scoring. Once you're comfortable,
        move on to intermediate topics like pit strategy and the history of the
        sport's regulations.
      </p>

      {/* Beginner Section */}
      <section className="mb-12">
        <h2
          className="mb-6 text-2xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          Getting Started
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beginnerTopics.map((topic, i) => (
            <TopicCard key={topic.slug} topic={topic} index={i} />
          ))}
        </div>
      </section>

      {/* Intermediate Section */}
      {intermediateTopics.length > 0 && (
        <section className="mb-12">
          <h2
            className="mb-6 text-2xl font-bold text-text-primary"
            style={{ fontFamily: "var(--font-titillium)" }}
          >
            Going Deeper
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {intermediateTopics.map((topic, i) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                index={beginnerTopics.length + i}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
