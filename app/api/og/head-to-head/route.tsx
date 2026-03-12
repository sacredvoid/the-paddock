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

interface DriverStats {
  championships: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
}

interface DriverData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nationality: string;
  stats: DriverStats | null;
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
          Comparison Unavailable
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug1 = searchParams.get("driver1");
  const slug2 = searchParams.get("driver2");
  const theme = (searchParams.get("theme") || "dark") as ThemeMode;
  const size = (searchParams.get("size") || "square") as CardSize;

  const validTheme = theme in THEMES ? theme : "dark";
  const validSize = size in CARD_SIZES ? size : "square";
  const colors = THEMES[validTheme];
  const { width, height } = CARD_SIZES[validSize];

  if (!slug1 || !slug2) {
    return renderErrorCard(
      "Both driver1 and driver2 params are required",
      validTheme,
      validSize
    );
  }

  let driver1: DriverData | undefined;
  let driver2: DriverData | undefined;
  try {
    const filePath = path.join(process.cwd(), "data", "drivers.json");
    const raw = await readFile(filePath, "utf-8");
    const drivers: DriverData[] = JSON.parse(raw);
    driver1 = drivers.find((d) => d.slug === slug1);
    driver2 = drivers.find((d) => d.slug === slug2);
  } catch {
    return renderErrorCard(
      "Could not load driver data",
      validTheme,
      validSize
    );
  }

  if (!driver1 || !driver2) {
    const missing = !driver1 ? slug1 : slug2;
    return renderErrorCard(
      `Driver "${missing}" not found`,
      validTheme,
      validSize
    );
  }

  if (!driver1.stats || !driver2.stats) {
    return renderErrorCard(
      "Stats unavailable for one or both drivers",
      validTheme,
      validSize
    );
  }

  const statRows: { label: string; key: keyof DriverStats }[] = [
    { label: "Wins", key: "wins" },
    { label: "Poles", key: "poles" },
    { label: "Podiums", key: "podiums" },
    { label: "Points", key: "points" },
  ];

  const isLandscape = validSize === "landscape";
  const nameFontSize = isLandscape ? 36 : 44;
  const statFontSize = isLandscape ? 36 : 44;
  const labelFontSize = isLandscape ? 16 : 18;
  const rowPadding = isLandscape ? "14px 0" : "18px 0";

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
            background: `linear-gradient(90deg, ${colors.glow}, transparent 50%, ${colors.glow})`,
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: isLandscape ? 20 : 32,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: colors.glow,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase" as const,
              display: "flex",
            }}
          >
            Head to Head
          </div>
        </div>

        {/* Driver names row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isLandscape ? 20 : 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: colors.textPrimary,
                display: "flex",
              }}
            >
              {driver1.firstName}
            </div>
            <div
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: colors.glow,
                display: "flex",
              }}
            >
              {driver1.lastName}
            </div>
          </div>

          <div
            style={{
              fontSize: 28,
              color: colors.textSecondary,
              fontWeight: 700,
              display: "flex",
            }}
          >
            VS
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: colors.textPrimary,
                display: "flex",
              }}
            >
              {driver2.firstName}
            </div>
            <div
              style={{
                fontSize: nameFontSize,
                fontWeight: 800,
                color: colors.glow,
                display: "flex",
              }}
            >
              {driver2.lastName}
            </div>
          </div>
        </div>

        {/* Stat comparison rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 4,
          }}
        >
          {statRows.map((row) => {
            const val1 = driver1.stats![row.key];
            const val2 = driver2.stats![row.key];
            const d1Wins = val1 > val2;
            const d2Wins = val2 > val1;

            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: rowPadding,
                  paddingLeft: 32,
                  paddingRight: 32,
                }}
              >
                {/* Left value */}
                <div
                  style={{
                    fontSize: statFontSize,
                    fontWeight: 800,
                    color: d1Wins ? colors.glow : colors.textPrimary,
                    display: "flex",
                    minWidth: 100,
                  }}
                >
                  {row.key === "points"
                    ? val1.toLocaleString()
                    : val1}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: labelFontSize,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    letterSpacing: 3,
                    textTransform: "uppercase" as const,
                    display: "flex",
                  }}
                >
                  {row.label}
                </div>

                {/* Right value */}
                <div
                  style={{
                    fontSize: statFontSize,
                    fontWeight: 800,
                    color: d2Wins ? colors.glow : colors.textPrimary,
                    display: "flex",
                    minWidth: 100,
                    justifyContent: "flex-end",
                  }}
                >
                  {row.key === "points"
                    ? val2.toLocaleString()
                    : val2}
                </div>
              </div>
            );
          })}
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
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
