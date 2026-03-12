import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import {
  CARD_SIZES,
  THEMES,
  type ThemeMode,
  type CardSize,
} from "@/lib/og-utils";

export const runtime = "nodejs";

interface RaceResult {
  position: number;
  driverId: string;
  teamId: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
  time: string;
}

interface Race {
  round: number;
  name: string;
  circuitId: string;
  date: string;
  results: RaceResult[];
}

interface SeasonData {
  year: number;
  races: Race[];
}

interface DriverData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  code: string;
}

interface CircuitData {
  id: string;
  name: string;
  country: string;
}

function renderErrorCard(
  message: string,
  theme: ThemeMode,
  size: CardSize
): ImageResponse {
  const colors = THEMES[theme];
  const { width, height } = CARD_SIZES[size];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
          color: colors.textPrimary,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
          Race Not Found
        </div>
        <div style={{ fontSize: 24, color: colors.textSecondary }}>
          {message}
        </div>
        <div
          style={{
            fontSize: 18,
            color: colors.glow,
            marginTop: 32,
            letterSpacing: 4,
          }}
        >
          THE PADDOCK
        </div>
      </div>
    ),
    { width, height }
  );
}

const POSITION_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function formatDriverName(
  driverId: string,
  drivers: DriverData[]
): { first: string; last: string; code: string } {
  const driver = drivers.find((d) => d.id === driverId);
  if (driver) {
    return {
      first: driver.firstName,
      last: driver.lastName,
      code: driver.code,
    };
  }
  // Fallback: parse the slug
  const parts = driverId.split("-");
  return {
    first: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "",
    last: parts.slice(1).join(" "),
    code: driverId.substring(0, 3).toUpperCase(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const roundParam = searchParams.get("round");
  const theme = (searchParams.get("theme") || "dark") as ThemeMode;
  const size = (searchParams.get("size") || "square") as CardSize;

  const validTheme = theme in THEMES ? theme : "dark";
  const validSize = size in CARD_SIZES ? size : "square";
  const colors = THEMES[validTheme];
  const { width, height } = CARD_SIZES[validSize];

  if (!yearParam || !roundParam) {
    return renderErrorCard(
      "Both year and round params are required",
      validTheme,
      validSize
    );
  }

  const year = parseInt(yearParam, 10);
  const round = parseInt(roundParam, 10);

  if (isNaN(year) || isNaN(round)) {
    return renderErrorCard(
      "Invalid year or round",
      validTheme,
      validSize
    );
  }

  let race: Race | undefined;
  let drivers: DriverData[] = [];
  let circuits: CircuitData[] = [];

  try {
    const [seasonRaw, driversRaw, circuitsRaw] = await Promise.all([
      readFile(
        path.join(process.cwd(), "data", "seasons", `${year}.json`),
        "utf-8"
      ),
      readFile(path.join(process.cwd(), "data", "drivers.json"), "utf-8"),
      readFile(path.join(process.cwd(), "data", "circuits.json"), "utf-8"),
    ]);

    const season: SeasonData = JSON.parse(seasonRaw);
    drivers = JSON.parse(driversRaw);
    circuits = JSON.parse(circuitsRaw);

    race = season.races.find((r) => r.round === round);
  } catch {
    return renderErrorCard(
      `Data not available for ${year}`,
      validTheme,
      validSize
    );
  }

  if (!race) {
    return renderErrorCard(
      `Round ${round} not found in ${year} season`,
      validTheme,
      validSize
    );
  }

  const circuit = circuits.find((c) => c.id === race!.circuitId);
  const circuitName = circuit ? circuit.name : race.circuitId;
  const circuitCountry = circuit ? circuit.country : "";
  const top3 = race.results.slice(0, 3);
  const isLandscape = validSize === "landscape";

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.bg,
          fontFamily: "sans-serif",
          padding: isLandscape ? 40 : 60,
        }}
      >
        {/* Glow accent at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${colors.glow}, transparent)`,
          }}
        />

        {/* Race name header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: isLandscape ? 24 : 40,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: colors.glow,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              marginBottom: 8,
              display: "flex",
            }}
          >
            Round {race.round} - {year}
          </div>
          <div
            style={{
              fontSize: isLandscape ? 44 : 56,
              fontWeight: 800,
              color: colors.textPrimary,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {race.name}
          </div>
          <div
            style={{
              fontSize: 22,
              color: colors.textSecondary,
              marginTop: 8,
              display: "flex",
            }}
          >
            {circuitName}
            {circuitCountry ? ` - ${circuitCountry}` : ""}
          </div>
        </div>

        {/* Podium results */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
          }}
        >
          {top3.map((result, index) => {
            const driverInfo = formatDriverName(result.driverId, drivers);
            const posColor = POSITION_COLORS[index];

            return (
              <div
                key={result.position}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: isLandscape ? "20px 32px" : "28px 36px",
                  gap: 24,
                }}
              >
                {/* Position number */}
                <div
                  style={{
                    fontSize: isLandscape ? 48 : 64,
                    fontWeight: 900,
                    color: posColor,
                    minWidth: isLandscape ? 60 : 80,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {result.position}
                </div>

                {/* Driver info */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: isLandscape ? 28 : 36,
                      fontWeight: 800,
                      color: colors.textPrimary,
                      display: "flex",
                    }}
                  >
                    {driverInfo.first} {driverInfo.last}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      color: colors.textSecondary,
                      display: "flex",
                    }}
                  >
                    {result.teamId
                      .split("-")
                      .map(
                        (w) => w.charAt(0).toUpperCase() + w.slice(1)
                      )
                      .join(" ")}
                  </div>
                </div>

                {/* Time */}
                <div
                  style={{
                    fontSize: isLandscape ? 18 : 22,
                    color: colors.textSecondary,
                    fontWeight: 500,
                    display: "flex",
                  }}
                >
                  {result.time}
                </div>
              </div>
            );
          })}
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isLandscape ? 16 : 24,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: colors.glow,
              fontWeight: 700,
              letterSpacing: 6,
              display: "flex",
            }}
          >
            THE PADDOCK
          </div>
          <div
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              display: "flex",
            }}
          >
            {race.date}
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
  imageResponse.headers.set(
    "Cache-Control",
    "public, s-maxage=604800, stale-while-revalidate=2592000"
  );
  return imageResponse;
}
