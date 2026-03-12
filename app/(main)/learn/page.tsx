import { Metadata } from "next";
import { getAllTopics } from "@/lib/mdx";
import { PageHeader } from "@/components/ui/page-header";
import { TopicCard } from "@/components/learn/topic-card";
import { AnimateIn, StaggerChildren, StaggerItem } from "@/components/ui/animate-in";

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
      <AnimateIn direction="up">
        <PageHeader
          title="Learn F1"
          subtitle="Everything you need to know about Formula 1"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Learn F1" },
          ]}
        />
      </AnimateIn>

      <AnimateIn delay={0.1} direction="up">
        <p className="mb-10 max-w-2xl text-text-secondary leading-relaxed">
          New to Formula 1? Start with the beginner guides below to understand the
          basics of race weekends, tires, and scoring. Once you&apos;re comfortable,
          move on to intermediate topics like pit strategy and the history of the
          sport&apos;s regulations.
        </p>
      </AnimateIn>

      {/* Beginner Section */}
      <section className="mb-12">
        <AnimateIn direction="up">
          <h2
            className="mb-6 text-2xl font-bold text-text-primary"
          >
            Getting Started
          </h2>
        </AnimateIn>
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.07}>
          {beginnerTopics.map((topic, i) => (
            <StaggerItem key={topic.slug}>
              <TopicCard topic={topic} index={i} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Intermediate Section */}
      {intermediateTopics.length > 0 && (
        <section className="mb-12">
          <AnimateIn direction="up">
            <h2
              className="mb-6 text-2xl font-bold text-text-primary"
            >
              Going Deeper
            </h2>
          </AnimateIn>
          <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.07}>
            {intermediateTopics.map((topic, i) => (
              <StaggerItem key={topic.slug}>
                <TopicCard
                  topic={topic}
                  index={beginnerTopics.length + i}
                />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>
      )}
    </div>
  );
}
