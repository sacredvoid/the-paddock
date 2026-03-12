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

interface DriverData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nationality: string;
  number: string | number;
  code: string;
  stats: {
    championships: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    races: number;
    points: number;
    dnfs: number;
    winRate: number;
    podiumRate: number;
    averageFinish: number;
    bestFinish: number;
  } | null;
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
          Driver Not Found
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
  const slug = searchParams.get("slug");
  const theme = (searchParams.get("theme") || "dark") as ThemeMode;
  const size = (searchParams.get("size") || "square") as CardSize;

  if (!slug) {
    return renderErrorCard("No driver slug provided", theme, size);
  }

  const validTheme = theme in THEMES ? theme : "dark";
  const validSize = size in CARD_SIZES ? size : "square";
  const colors = THEMES[validTheme];
  const { width, height } = CARD_SIZES[validSize];

  let driver: DriverData | undefined;
  try {
    const filePath = path.join(process.cwd(), "data", "drivers.json");
    const raw = await readFile(filePath, "utf-8");
    const drivers: DriverData[] = JSON.parse(raw);
    driver = drivers.find((d) => d.slug === slug);
  } catch {
    return renderErrorCard("Could not load driver data", validTheme, validSize);
  }

  if (!driver) {
    return renderErrorCard(
      `No driver found for "${slug}"`,
      validTheme,
      validSize
    );
  }

  const stats = driver.stats;
  const statItems = stats
    ? [
        { label: "Wins", value: stats.wins },
        { label: "Poles", value: stats.poles },
        { label: "Podiums", value: stats.podiums },
        { label: "Points", value: stats.points.toLocaleString() },
      ]
    : [];

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
          padding: 60,
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

        {/* Driver number watermark */}
        <div
          style={{
            position: "absolute",
            top: -20,
            right: 40,
            fontSize: 280,
            fontWeight: 900,
            color: colors.border,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {String(driver.number)}
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: colors.glow,
              fontWeight: 600,
              letterSpacing: 3,
              marginBottom: 12,
              textTransform: "uppercase" as const,
              display: "flex",
            }}
          >
            {driver.nationality}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.textPrimary,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {driver.firstName}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.glow,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {driver.lastName}
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              flex: 1,
            }}
          >
            {statItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: "28px 36px",
                  minWidth: validSize === "landscape" ? 180 : 200,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    fontWeight: 500,
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                    marginBottom: 8,
                    display: "flex",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    display: "flex",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Championships badge */}
        {stats && stats.championships > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: colors.glow,
                display: "flex",
              }}
            >
              {stats.championships}x World Champion
            </div>
          </div>
        )}

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            Career Statistics
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
