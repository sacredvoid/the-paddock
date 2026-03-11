import Link from "next/link";
import type { TopicMeta } from "@/lib/mdx";
import { DifficultyBadge } from "./difficulty-badge";

interface TopicCardProps {
  topic: TopicMeta;
  index: number;
}

export function TopicCard({ topic, index }: TopicCardProps) {
  return (
    <Link href={`/learn/${topic.slug}`} className="group block">
      <div className="flex h-full gap-4 rounded-xl bg-surface-1 border-[rgba(255,255,255,0.06)] border p-5 card-glow">
        <span
          className="text-3xl font-bold text-text-tertiary"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <h3
            className="text-lg font-semibold text-text-primary group-hover:text-glow"
          >
            {topic.title}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {topic.description}
          </p>
          <div className="mt-auto flex items-center gap-3 pt-2">
            <DifficultyBadge difficulty={topic.difficulty} />
            <span className="text-xs text-text-secondary">
              {topic.readingTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
