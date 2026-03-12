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

interface StandingEntry {
  position: number;
  id: string;
  points: number;
  wins: number;
}

interface SeasonData {
  year: number;
  driverStandings: StandingEntry[];
}

interface DriverData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  code: string;
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
          Standings Unavailable
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

function getDriverCode(
  driverId: string,
  drivers: DriverData[]
): string {
  const driver = drivers.find((d) => d.id === driverId);
  if (driver) return driver.code;
  return driverId.substring(0, 3).toUpperCase();
}

function getDriverName(
  driverId: string,
  drivers: DriverData[]
): string {
  const driver = drivers.find((d) => d.id === driverId);
  if (driver) return `${driver.firstName} ${driver.lastName}`;
  return driverId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const theme = (searchParams.get("theme") || "dark") as ThemeMode;
  const size = (searchParams.get("size") || "square") as CardSize;

  const validTheme = theme in THEMES ? theme : "dark";
  const validSize = size in CARD_SIZES ? size : "square";
  const colors = THEMES[validTheme];
  const { width, height } = CARD_SIZES[validSize];

  if (!yearParam) {
    return renderErrorCard(
      "Year parameter is required",
      validTheme,
      validSize
    );
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return renderErrorCard("Invalid year", validTheme, validSize);
  }

  let standings: StandingEntry[] = [];
  let drivers: DriverData[] = [];

  try {
    const [seasonRaw, driversRaw] = await Promise.all([
      readFile(
        path.join(process.cwd(), "data", "seasons", `${year}.json`),
        "utf-8"
      ),
      readFile(path.join(process.cwd(), "data", "drivers.json"), "utf-8"),
    ]);

    const season: SeasonData = JSON.parse(seasonRaw);
    drivers = JSON.parse(driversRaw);
    standings = season.driverStandings || [];
  } catch {
    return renderErrorCard(
      `Data not available for ${year}`,
      validTheme,
      validSize
    );
  }

  if (standings.length === 0) {
    return renderErrorCard(
      `No standings data for ${year}`,
      validTheme,
      validSize
    );
  }

  const top10 = standings.slice(0, 10);
  const maxPoints = top10[0]?.points || 1;
  const isLandscape = validSize === "landscape";
  const rowHeight = isLandscape ? 44 : 68;
  const nameFontSize = isLandscape ? 16 : 22;
  const pointsFontSize = isLandscape ? 16 : 20;
  const posFontSize = isLandscape ? 16 : 22;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.bg,
          fontFamily: "sans-serif",
          padding: isLandscape ? 32 : 48,
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: isLandscape ? 16 : 28,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: colors.glow,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              marginBottom: 4,
              display: "flex",
            }}
          >
            Driver Championship
          </div>
          <div
            style={{
              fontSize: isLandscape ? 36 : 48,
              fontWeight: 800,
              color: colors.textPrimary,
              display: "flex",
            }}
          >
            {year} Standings
          </div>
        </div>

        {/* Standings rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isLandscape ? 4 : 6,
            flex: 1,
          }}
        >
          {top10.map((entry, index) => {
            const barWidth = Math.max(
              (entry.points / maxPoints) * 100,
              8
            );
            const isLeader = index === 0;

            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: rowHeight,
                  gap: isLandscape ? 8 : 12,
                }}
              >
                {/* Position */}
                <div
                  style={{
                    fontSize: posFontSize,
                    fontWeight: 700,
                    color: isLeader
                      ? colors.glow
                      : colors.textSecondary,
                    minWidth: isLandscape ? 28 : 36,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {entry.position}
                </div>

                {/* Driver code */}
                <div
                  style={{
                    fontSize: posFontSize,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    minWidth: isLandscape ? 48 : 56,
                    display: "flex",
                  }}
                >
                  {getDriverCode(entry.id, drivers)}
                </div>

                {/* Points bar container */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    height: "100%",
                  }}
                >
                  {/* Bar background */}
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: isLandscape ? 28 : 40,
                      borderRadius: 6,
                      background: isLeader
                        ? `linear-gradient(90deg, ${colors.glow}, ${colors.glow}88)`
                        : `linear-gradient(90deg, ${colors.surface}, ${colors.border})`,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}
                  >
                    {/* Driver name inside bar */}
                    <div
                      style={{
                        fontSize: nameFontSize - 4,
                        fontWeight: 600,
                        color: isLeader
                          ? "#FFFFFF"
                          : colors.textSecondary,
                        display: "flex",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {getDriverName(entry.id, drivers)}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div
                  style={{
                    fontSize: pointsFontSize,
                    fontWeight: 700,
                    color: isLeader
                      ? colors.glow
                      : colors.textPrimary,
                    minWidth: isLandscape ? 48 : 64,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {entry.points}
                </div>

                {/* Wins badge */}
                {entry.wins > 0 && (
                  <div
                    style={{
                      fontSize: isLandscape ? 12 : 14,
                      fontWeight: 600,
                      color: colors.textSecondary,
                      minWidth: isLandscape ? 36 : 48,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    {entry.wins}W
                  </div>
                )}
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
            marginTop: isLandscape ? 12 : 20,
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
            Top 10 Championship Standings
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
