import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; round: string }> }
) {
  const { year, round } = await params;
  const filePath = path.join(
    process.cwd(),
    "data",
    "telemetry-detail",
    year,
    `${round}.json`
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return NextResponse.json(data);
}
