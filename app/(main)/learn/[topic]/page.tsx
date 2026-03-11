import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllTopics, getTopicContent } from "@/lib/mdx";
import { PageHeader } from "@/components/ui/page-header";
import { DifficultyBadge } from "@/components/learn/difficulty-badge";

export async function generateStaticParams() {
  const topics = getAllTopics();
  return topics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: slug } = await params;
  const result = getTopicContent(slug);
  if (!result) return { title: "Not Found" };
  return {
    title: `${result.meta.title} - Learn F1 - The Paddock`,
    description: result.meta.description,
  };
}

const mdxComponents = {
  h1: (props: React.ComponentProps<"h1">) => (
    <h1
      className="mb-6 mt-10 text-3xl font-bold text-text-primary first:mt-0"
      {...props}
    />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      className="mb-4 mt-8 text-2xl font-bold text-text-primary"
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      className="mb-3 mt-6 text-xl font-semibold text-text-primary"
      {...props}
    />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p className="mb-4 leading-relaxed text-text-secondary" {...props} />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      className="mb-4 ml-6 list-disc space-y-1 text-text-secondary"
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className="mb-4 ml-6 list-decimal space-y-1 text-text-secondary"
      {...props}
    />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a className="text-glow hover:underline" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-text-primary" {...props} />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="mb-4 border-l-4 border-glow pl-4 italic text-text-secondary"
      {...props}
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      className="rounded bg-surface-2 px-1.5 py-0.5 text-sm font-mono text-text-primary"
      {...props}
    />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      className="mb-4 overflow-x-auto rounded-lg bg-surface-1 p-4 text-sm"
      {...props}
    />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-left" {...props} />
    </div>
  ),
  thead: (props: React.ComponentProps<"thead">) => (
    <thead className="border-b border-[rgba(255,255,255,0.06)]" {...props} />
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th
      className="px-4 py-2 text-sm font-semibold text-text-primary"
      {...props}
    />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td
      className="border-b border-[rgba(255,255,255,0.06)] px-4 py-2 text-sm text-text-secondary"
      {...props}
    />
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr className="my-8 border-[rgba(255,255,255,0.06)]" {...props} />
  ),
};

export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const result = getTopicContent(slug);

  if (!result) {
    notFound();
  }

  const { meta, content } = result;
  const allTopics = getAllTopics();
  const currentIndex = allTopics.findIndex((t) => t.slug === slug);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  return (
    <div>
      <PageHeader
        title={meta.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Learn F1", href: "/learn" },
          { label: meta.title },
        ]}
      />

      <div className="mb-6 flex items-center gap-4">
        <DifficultyBadge difficulty={meta.difficulty} />
        <span className="text-sm text-text-secondary">{meta.readingTime}</span>
      </div>

      {/* MDX Content */}
      <article className="max-w-3xl">
        <MDXRemote source={content} components={mdxComponents} />
      </article>

      {/* Previous / Next Navigation */}
      <nav className="mt-12 flex items-stretch gap-4 border-t border-[rgba(255,255,255,0.06)] pt-8">
        {prevTopic ? (
          <Link
            href={`/learn/${prevTopic.slug}`}
            className="group flex flex-1 flex-col rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4 card-glow"
          >
            <span className="mb-1 text-xs text-text-secondary">
              Previous
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-glow">
              {prevTopic.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextTopic ? (
          <Link
            href={`/learn/${nextTopic.slug}`}
            className="group flex flex-1 flex-col items-end rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4 text-right card-glow"
          >
            <span className="mb-1 text-xs text-text-secondary">
              Next
            </span>
            <span className="text-sm font-semibold text-text-primary group-hover:text-glow">
              {nextTopic.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </div>
  );
}
