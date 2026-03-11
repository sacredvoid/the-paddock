export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>;
}) {
  const { year, round } = await params;

  return (
    <div>
      <h1
        className="mb-4 text-4xl font-bold"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {year} Season - Round {round}
      </h1>
      <p className="text-text-secondary">Coming soon</p>
    </div>
  );
}
