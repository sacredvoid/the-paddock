export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;

  return (
    <div>
      <h1
        className="mb-4 text-4xl font-bold capitalize"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {topic.replace(/-/g, " ")}
      </h1>
      <p className="text-text-secondary">Coming soon</p>
    </div>
  );
}
