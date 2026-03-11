export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;

  return (
    <div>
      <h1
        className="mb-4 text-4xl font-bold"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {year} Season
      </h1>
      <p className="text-text-secondary">Coming soon</p>
    </div>
  );
}
