import { getRaceTelemetry } from "@/lib/data";
import { RaceAnalysisCharts } from "./race-analysis-charts";

interface RaceAnalysisSectionProps {
  year: number;
  round: number;
}

export async function RaceAnalysisSection({
  year,
  round,
}: RaceAnalysisSectionProps) {
  const telemetry = await getRaceTelemetry(year, round);

  if (!telemetry) return null;

  return <RaceAnalysisCharts telemetry={telemetry} />;
}
