export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div>
      <h1
        className="mb-4 text-4xl font-bold capitalize"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {slug.replace(/-/g, " ")}
      </h1>
      <p className="text-text-secondary">Coming soon</p>
    </div>
  );
}
