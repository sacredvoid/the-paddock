import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string; round: string }> }
) {
  const { year, round } = await params;

  // Validate inputs
  const yearNum = parseInt(year, 10);
  const roundNum = parseInt(round, 10);

  if (
    isNaN(yearNum) ||
    isNaN(roundNum) ||
    yearNum < 2023 ||
    yearNum > 2025 ||
    roundNum < 1 ||
    roundNum > 30
  ) {
    return NextResponse.json(
      { error: "Invalid year or round" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "telemetry",
      String(yearNum),
      `${roundNum}.json`
    );
    const data = await readFile(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data), {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Telemetry data not available" },
      { status: 404 }
    );
  }
}
