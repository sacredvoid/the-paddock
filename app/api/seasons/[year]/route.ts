import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum) || yearNum < 1950 || yearNum > 2026) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "seasons",
      `${yearNum}.json`
    );
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    // Return only race list (lighter payload)
    const races = (data.races || []).map(
      (r: { round: number; name: string }) => ({
        round: r.round,
        name: r.name,
      })
    );

    return NextResponse.json(
      { year: yearNum, races },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Season data not available" },
      { status: 404 }
    );
  }
}
