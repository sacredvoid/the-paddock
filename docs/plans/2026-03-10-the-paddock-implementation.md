# The Paddock - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete F1 encyclopedia website with driver profiles, circuit maps, race analysis, historical records, interactive visualizations, and educational content.

**Architecture:** Static-first Next.js 15 App Router. Python build script fetches F1 data from Jolpica/OpenF1/F1DB APIs and writes JSON files. Next.js reads those JSON files at build time via SSG. No database, no runtime API calls for historical data. MDX for long-form content. Vercel Hobby for deployment.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, Recharts, react-simple-maps, Motion (Framer Motion), Fuse.js, TypeScript, Python (data pipeline)

---

## Wave 1: Foundation

### Task 0: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `components.json` (shadcn config)

**Step 1: Create Next.js 15 project**

```bash
cd /Users/samanvya/Documents/github/the-paddock
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --use-npm
```

Accept overwrite prompts for existing files. This creates the full Next.js 15 scaffold with Tailwind v4.

**Step 2: Install core dependencies**

```bash
npm install recharts react-simple-maps motion fuse.js @mdx-js/loader @mdx-js/react @next/mdx next-mdx-remote gray-matter
npm install -D @types/react-simple-maps
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, Zinc base color, CSS variables enabled.

**Step 4: Install shadcn components needed across the project**

```bash
npx shadcn@latest add button card badge tabs table command dialog input separator skeleton scroll-area select tooltip dropdown-menu
```

**Step 5: Verify dev server starts**

```bash
npm run dev
```

Visit http://localhost:3000, confirm default page renders.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 with Tailwind v4 and shadcn/ui"
```

---

### Task 1: Design System and Theme

**Files:**
- Modify: `app/globals.css`
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`
- Create: `lib/team-colors.ts`

**Step 1: Set up custom fonts**

Create `lib/fonts.ts`:

```typescript
import { Inter, Titillium_Web, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-titillium",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```

**Step 2: Configure dark carbon fiber theme in globals.css**

Replace the contents of `app/globals.css` with the F1 theme. Key tokens:

```css
@import "tailwindcss";

@theme {
  --color-background: #0A0A0A;
  --color-surface: #141414;
  --color-surface-elevated: #1E1E1E;
  --color-border: #2A2A2A;
  --color-f1-red: #E10600;
  --color-accent: #00D2BE;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #888888;

  --font-heading: var(--font-titillium);
  --font-body: var(--font-inter);
  --font-mono: var(--font-mono);
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

/* Carbon fiber texture - used on hero sections */
.carbon-fiber {
  background-image:
    repeating-conic-gradient(#141414 0% 25%, transparent 0% 50%) 0 0 / 4px 4px,
    repeating-conic-gradient(#141414 0% 25%, transparent 0% 50%) 2px 2px / 4px 4px;
}

/* Subtle dot grid pattern for section backgrounds */
.dot-grid {
  background-image: radial-gradient(circle, #2A2A2A 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Tabular numbers for stats alignment */
.stats-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

Note: Tailwind v4 uses `@theme` instead of `theme.extend` in config. The shadcn tokens will also need updating to match the dark theme. Refer to shadcn docs for Tailwind v4 CSS variable mapping.

**Step 3: Create team colors mapping**

Create `lib/team-colors.ts`:

```typescript
export const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  "red_bull": { primary: "#3671C6", secondary: "#1B3A6B" },
  "mercedes": { primary: "#27F4D2", secondary: "#00A19C" },
  "ferrari": { primary: "#E8002D", secondary: "#A80020" },
  "mclaren": { primary: "#FF8000", secondary: "#CC6600" },
  "aston_martin": { primary: "#229971", secondary: "#174F3B" },
  "alpine": { primary: "#FF87BC", secondary: "#CC6C96" },
  "williams": { primary: "#64C4FF", secondary: "#4A93BF" },
  "rb": { primary: "#6692FF", secondary: "#4D6EBF" },
  "kick_sauber": { primary: "#52E252", secondary: "#3DAB3D" },
  "haas": { primary: "#B6BABD", secondary: "#898C8E" },
  // Historic teams
  "lotus": { primary: "#FFB800", secondary: "#CC9300" },
  "brabham": { primary: "#00783E", secondary: "#005A2E" },
  "tyrrell": { primary: "#0044AA", secondary: "#003380" },
  "benetton": { primary: "#00A550", secondary: "#007A3B" },
  "brawn": { primary: "#B5F500", secondary: "#8AB900" },
  "jordan": { primary: "#FFC700", secondary: "#CCA000" },
  "force_india": { primary: "#F596C8", secondary: "#C2789F" },
  "racing_point": { primary: "#F596C8", secondary: "#C2789F" },
  "toro_rosso": { primary: "#469BFF", secondary: "#3578CC" },
  "alphatauri": { primary: "#4E7C9B", secondary: "#3B5D74" },
  "renault": { primary: "#FFF500", secondary: "#CCC400" },
  "minardi": { primary: "#000000", secondary: "#333333" },
  "caterham": { primary: "#005030", secondary: "#003820" },
  "marussia": { primary: "#6E0000", secondary: "#520000" },
  "manor": { primary: "#ED1C24", secondary: "#B8151B" },
  "sauber": { primary: "#006EFF", secondary: "#0054BF" },
  "alfa_romeo": { primary: "#A50F2D", secondary: "#7C0B22" },
};

export function getTeamColor(teamId: string): string {
  return TEAM_COLORS[teamId]?.primary ?? "#888888";
}
```

**Step 4: Update root layout with fonts and metadata**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { inter, titillium, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Paddock - F1 Encyclopedia",
  description: "Everything about Formula 1. Drivers, circuits, race analysis, historical records, and interactive visualizations.",
  openGraph: {
    title: "The Paddock - F1 Encyclopedia",
    description: "Everything about Formula 1.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${titillium.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 5: Verify theme renders**

```bash
npm run dev
```

Confirm dark background, fonts loaded, no layout shift.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: design system with F1 dark theme, fonts, and team colors"
```

---

### Task 2: Layout Shell (Header, Footer, Navigation)

**Files:**
- Create: `components/layout/header.tsx`
- Create: `components/layout/footer.tsx`
- Create: `components/layout/mobile-nav.tsx`
- Modify: `app/layout.tsx`
- Create: `lib/navigation.ts`

**Step 1: Define navigation structure**

Create `lib/navigation.ts`:

```typescript
export const NAV_ITEMS = [
  { label: "Drivers", href: "/drivers" },
  { label: "Teams", href: "/teams" },
  { label: "Circuits", href: "/circuits" },
  { label: "Seasons", href: "/seasons" },
  { label: "Records", href: "/records" },
  { label: "Race Analysis", href: "/seasons" },
  { label: "Learn F1", href: "/learn" },
  { label: "What If?", href: "/what-if" },
] as const;
```

**Step 2: Build the header**

Create `components/layout/header.tsx` with:
- Logo/site name "The Paddock" on the left (Titillium Web 700 weight, F1 red accent on "Paddock")
- Desktop nav links centered or right-aligned
- Cmd+K search trigger button (icon only, opens command palette later)
- Mobile hamburger menu trigger
- Sticky header with `backdrop-blur-md` and slight transparency
- 1px bottom border using `--color-border`

**Step 3: Build mobile navigation**

Create `components/layout/mobile-nav.tsx`:
- Slide-in drawer from the right using shadcn Sheet component
- Full list of nav items
- Close on link click

**Step 4: Build the footer**

Create `components/layout/footer.tsx`:
- Minimal: "The Paddock" branding, "Not affiliated with Formula 1" disclaimer, GitHub link
- Built with grid layout, `--color-surface` background

**Step 5: Wire layout**

Update `app/layout.tsx` to include Header and Footer wrapping `{children}`. Add a `<main>` wrapper with max-width constraint and padding.

**Step 6: Create placeholder pages for all routes**

Create minimal `page.tsx` files for every route in the structure:
- `app/(main)/drivers/page.tsx`
- `app/(main)/drivers/[slug]/page.tsx`
- `app/(main)/teams/page.tsx`
- `app/(main)/teams/[slug]/page.tsx`
- `app/(main)/circuits/page.tsx`
- `app/(main)/circuits/[slug]/page.tsx`
- `app/(main)/seasons/page.tsx`
- `app/(main)/seasons/[year]/page.tsx`
- `app/(main)/seasons/[year]/[round]/page.tsx`
- `app/(main)/records/page.tsx`
- `app/(main)/learn/page.tsx`
- `app/(main)/learn/[topic]/page.tsx`
- `app/(main)/what-if/page.tsx`
- `app/(main)/family-tree/page.tsx`

Each placeholder should render the page title and a "Coming soon" message in the site's theme.

**Step 7: Verify navigation works**

```bash
npm run dev
```

Click through all nav links, verify header/footer render, mobile menu works.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: layout shell with header, footer, navigation, and route placeholders"
```

---

### Task 3: Data Pipeline - Python Fetch Script

**Files:**
- Create: `scripts/fetch_data.py`
- Create: `scripts/requirements.txt`
- Create: `data/drivers.json` (output)
- Create: `data/teams.json` (output)
- Create: `data/circuits.json` (output)
- Create: `data/seasons/` (output directory)
- Create: `data/records.json` (output)

**Step 1: Create requirements.txt**

```
requests>=2.31.0
fastf1>=3.8.0
pandas>=2.0.0
```

**Step 2: Write the data fetch script**

Create `scripts/fetch_data.py` that:

1. **Fetches from Jolpica F1 API** (`https://api.jolpi.ca/ergast/f1/`):
   - All drivers: `/drivers.json?limit=1000` (paginate as needed)
   - All constructors: `/constructors.json?limit=1000`
   - All circuits: `/circuits.json?limit=1000`
   - All seasons: `/seasons.json?limit=100`
   - For each season: race results, driver standings, constructor standings
   - Qualifying results (2003+)
   - Pit stop data (2012+)
   - Lap times (1996+, sample key races)

2. **Fetches from F1DB GitHub releases** (download latest JSON release):
   - Cross-reference with Jolpica data for completeness
   - Extract circuit layout SVG references

3. **Processes and writes JSON files:**
   - `data/drivers.json` - all drivers with career stats computed
   - `data/teams.json` - all constructors with stats and lineage
   - `data/circuits.json` - all circuits with records
   - `data/records.json` - all-time records (most wins, poles, etc.)
   - `data/seasons/{year}.json` - per-season data with race results, standings

Key implementation notes:
- Respect Jolpica rate limits: 4 req/s, 500 req/hr. Add `time.sleep(0.3)` between requests.
- Cache raw API responses in `scripts/.cache/` (gitignored) to avoid re-fetching on reruns.
- Compute derived stats: win rate, podium rate, pole rate, average finish position, DNF rate.
- Include team color mappings in teams.json.
- For drivers, compute head-to-head teammate records.

**Step 3: Create TypeScript types for the data**

Create `lib/types.ts`:

```typescript
export interface Driver {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  number?: number;
  code?: string;
  currentTeamId?: string;
  isActive: boolean;
  stats: DriverStats;
  seasons: number[];
}

export interface DriverStats {
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
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  nationality: string;
  color: string;
  isActive: boolean;
  stats: TeamStats;
  drivers: string[]; // driver IDs for current/last season
  lineage?: string[]; // previous team IDs in the lineage chain
}

export interface TeamStats {
  championships: number;
  wins: number;
  poles: number;
  podiums: number;
  races: number;
  points: number;
  firstEntry: number;
  lastEntry: number;
}

export interface Circuit {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  length?: number;
  turns?: number;
  drsZones?: number;
  lapRecord?: { time: string; driver: string; year: number };
  firstGP?: number;
  totalRaces: number;
}

export interface Season {
  year: number;
  champion: { driverId: string; teamId: string };
  constructorChampion: { teamId: string };
  races: Race[];
  driverStandings: StandingEntry[];
  constructorStandings: StandingEntry[];
}

export interface Race {
  round: number;
  name: string;
  circuitId: string;
  date: string;
  results: RaceResult[];
  qualifying?: QualifyingResult[];
  pitStops?: PitStop[];
  hasTelemetry: boolean;
}

export interface RaceResult {
  position: number;
  driverId: string;
  teamId: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
  time?: string;
  fastestLap?: { rank: number; lap: number; time: string };
}

export interface QualifyingResult {
  position: number;
  driverId: string;
  teamId: string;
  q1?: string;
  q2?: string;
  q3?: string;
}

export interface PitStop {
  driverId: string;
  lap: number;
  stop: number;
  duration: string;
}

export interface StandingEntry {
  position: number;
  id: string; // driverId or teamId
  points: number;
  wins: number;
}

export interface Record {
  category: string;
  title: string;
  entries: RecordEntry[];
}

export interface RecordEntry {
  rank: number;
  driverId?: string;
  teamId?: string;
  value: number | string;
  details?: string;
}
```

**Step 4: Create data loading utilities**

Create `lib/data.ts`:

```typescript
import driversData from "@/data/drivers.json";
import teamsData from "@/data/teams.json";
import circuitsData from "@/data/circuits.json";
import recordsData from "@/data/records.json";
import type { Driver, Team, Circuit, Season, Record } from "./types";

// These are loaded at build time - zero runtime cost
export function getAllDrivers(): Driver[] {
  return driversData as Driver[];
}

export function getDriver(slug: string): Driver | undefined {
  return (driversData as Driver[]).find((d) => d.slug === slug);
}

export function getAllTeams(): Team[] {
  return teamsData as Team[];
}

export function getTeam(slug: string): Team | undefined {
  return (teamsData as Team[]).find((t) => t.slug === slug);
}

export function getAllCircuits(): Circuit[] {
  return circuitsData as Circuit[];
}

export function getCircuit(slug: string): Circuit | undefined {
  return (circuitsData as Circuit[]).find((c) => c.slug === slug);
}

export function getAllRecords(): Record[] {
  return recordsData as Record[];
}

export async function getSeason(year: number): Promise<Season> {
  const data = await import(`@/data/seasons/${year}.json`);
  return data.default as Season;
}

export function getAvailableSeasons(): number[] {
  // Will be populated by build script
  // For now, hardcode range
  return Array.from({ length: 2026 - 1950 }, (_, i) => 2026 - i);
}
```

**Step 5: Run the data pipeline**

```bash
cd /Users/samanvya/Documents/github/the-paddock
python3 -m venv scripts/.venv
source scripts/.venv/bin/activate
pip install -r scripts/requirements.txt
python3 scripts/fetch_data.py
```

Verify JSON files are created in `/data/`.

**Step 6: Add scripts/.venv/ and scripts/.cache/ to .gitignore**

**Step 7: Verify Next.js can import the data**

Update `app/page.tsx` to import and display a count of drivers, teams, circuits.

```bash
npm run build
```

Confirm build succeeds with no errors.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: data pipeline fetching from Jolpica/F1DB with TypeScript types"
```

---

### Task 4: Reusable UI Components

**Files:**
- Create: `components/ui/stat-card.tsx`
- Create: `components/ui/driver-card.tsx`
- Create: `components/ui/circuit-mini-map.tsx`
- Create: `components/ui/page-header.tsx`
- Create: `components/ui/filter-bar.tsx`
- Create: `components/ui/data-table.tsx`
- Create: `components/ui/skeleton-chart.tsx`

**Step 1: Build stat card component**

`components/ui/stat-card.tsx` - displays a single stat with label and value. Uses `stats-number` class for tabular-nums. Optional trend indicator (up/down arrow with color). Optional team-color left border.

**Step 2: Build driver card component**

`components/ui/driver-card.tsx` - card with driver number, name, team badge, nationality flag emoji, key stat (wins/points). Team-colored top or left border. Hover lift animation with Motion.

**Step 3: Build circuit mini-map component**

`components/ui/circuit-mini-map.tsx` - accepts an SVG track path string, renders it in a small container. Used in race cards and the "Next Race" widget.

**Step 4: Build page header component**

`components/ui/page-header.tsx` - consistent page title + optional subtitle + optional breadcrumb. Uses Titillium Web font.

**Step 5: Build filter bar component**

`components/ui/filter-bar.tsx` - horizontal bar with filter dropdowns (shadcn Select) and search input. Used on drivers, circuits, seasons list pages.

**Step 6: Build data table wrapper**

`components/ui/data-table.tsx` - wraps shadcn Table with sortable columns, optional sparkline cells, and responsive horizontal scroll. Accepts typed column definitions.

**Step 7: Build skeleton chart placeholder**

`components/ui/skeleton-chart.tsx` - animated skeleton that mimics chart shapes (bar chart skeleton, line chart skeleton). Used in Suspense fallbacks.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: reusable UI components - stat cards, driver cards, data tables, filters"
```

---

## Wave 2: Encyclopedia Core

### Task 5: Home Page

**Files:**
- Modify: `app/(main)/page.tsx`
- Create: `components/home/hero.tsx`
- Create: `components/home/next-race.tsx`
- Create: `components/home/standings-snapshot.tsx`
- Create: `components/home/stats-ticker.tsx`
- Create: `components/home/quick-links.tsx`

**Step 1: Build hero section**

`components/home/hero.tsx`:
- Full-width section with carbon-fiber background
- Large "The Paddock" title with animated SVG track drawing behind it
- Subtitle: "Everything about Formula 1"
- The SVG track animation draws the outline of a circuit using CSS `stroke-dashoffset` animation on page load

**Step 2: Build next race countdown**

`components/home/next-race.tsx`:
- Card showing the next upcoming race from the current season data
- Countdown timer (days, hours, minutes, seconds) as a client component
- Circuit mini-map, race name, date, city/country
- If no upcoming race (off-season), show "Season starts [date]"

**Step 3: Build standings snapshot**

`components/home/standings-snapshot.tsx`:
- Two side-by-side cards: top 5 drivers, top 5 constructors
- Each entry: position, name, points, team color indicator
- Links to full standings page

**Step 4: Build stats ticker**

`components/home/stats-ticker.tsx`:
- Horizontal row of animated stat counters
- Stats: total races held, total drivers, total teams, years of F1
- Numbers count up on scroll (use Motion + Intersection Observer)

**Step 5: Build quick links grid**

`components/home/quick-links.tsx`:
- Grid of cards linking to main sections (Drivers, Circuits, Seasons, Records, Learn, What-If)
- Each card has an icon, title, short description
- Hover animation (lift + team-red glow)

**Step 6: Assemble home page**

Wire all components in `app/(main)/page.tsx`. Server component that imports data, passes to client sub-components as needed.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: home page with hero, next race countdown, standings, and quick links"
```

---

### Task 6: Drivers List Page

**Files:**
- Modify: `app/(main)/drivers/page.tsx`
- Create: `components/drivers/drivers-grid.tsx`
- Create: `components/drivers/driver-filters.tsx`

**Step 1: Build drivers grid**

`components/drivers/drivers-grid.tsx`:
- Responsive grid of `DriverCard` components (4 cols desktop, 2 cols tablet, 1 col mobile)
- Accepts filtered driver array
- Client component (for filter interactivity)

**Step 2: Build driver filters**

`components/drivers/driver-filters.tsx`:
- Filter by: Active/All/Retired toggle, Team dropdown, Nationality dropdown, Era dropdown (decades)
- Search input for driver name
- All client-side filtering (data already loaded)
- URL search params for shareable filtered views

**Step 3: Assemble drivers list page**

`app/(main)/drivers/page.tsx`:
- Server component that loads all drivers data
- Passes to client DriversGrid with filters
- Page header: "Drivers" with count
- `generateMetadata` for SEO

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: drivers list page with filterable grid"
```

---

### Task 7: Driver Profile Page

**Files:**
- Modify: `app/(main)/drivers/[slug]/page.tsx`
- Create: `components/drivers/driver-header.tsx`
- Create: `components/drivers/career-stats.tsx`
- Create: `components/drivers/season-chart.tsx`
- Create: `components/drivers/teammate-battles.tsx`
- Create: `components/drivers/career-timeline.tsx`
- Create: `components/charts/radar-chart.tsx`
- Create: `components/charts/line-chart.tsx`

**Step 1: Build driver header**

`components/drivers/driver-header.tsx`:
- Large driver number (team color), full name, nationality, date of birth
- Current/last team badge
- Active/retired status badge
- Key stats row: championships, wins, poles, podiums

**Step 2: Build career stats radar chart**

`components/charts/radar-chart.tsx`:
- Recharts RadarChart wrapper
- Axes: Win Rate, Pole Rate, Podium Rate, Consistency (inverse of DNF rate), Points Per Race
- Normalized to percentiles vs all-time drivers
- Team-colored fill

**Step 3: Build season-by-season points chart**

`components/charts/line-chart.tsx`:
- Recharts LineChart wrapper
- X axis: seasons, Y axis: points scored
- Line colored by team that year
- Tooltip showing position in standings

**Step 4: Build teammate battles section**

`components/drivers/teammate-battles.tsx`:
- For each season, show teammate head-to-head: qualifying score and race score
- Horizontal bar showing ratio (e.g., 15-7 in qualifying)
- Color-coded by who won the battle

**Step 5: Build career timeline**

`components/drivers/career-timeline.tsx`:
- Vertical timeline showing key career events
- Team stints with team colors
- First win, first pole, championship years marked
- Responsive: horizontal on desktop, vertical on mobile

**Step 6: Assemble driver profile page**

`app/(main)/drivers/[slug]/page.tsx`:
- Server component
- `generateStaticParams` to pre-render all driver pages at build time
- `generateMetadata` for SEO per driver
- Tabs: Overview (stats + radar), Career (season chart + timeline), Teammate Battles
- 404 handling for invalid slugs

**Step 7: Build head-to-head comparison tool**

Add a "Compare with..." button that opens a dialog to select another driver. Shows side-by-side stat cards and overlapping radar charts. Client component with URL param for sharing comparisons (e.g., `/drivers/max-verstappen?compare=lewis-hamilton`).

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: driver profile pages with stats, charts, teammate battles, and comparison tool"
```

---

### Task 8: Circuits List Page (World Map)

**Files:**
- Modify: `app/(main)/circuits/page.tsx`
- Create: `components/circuits/world-map.tsx`
- Create: `components/circuits/circuit-list.tsx`

**Step 1: Build interactive world map**

`components/circuits/world-map.tsx`:
- Uses `react-simple-maps` with `ComposableMap`, `Geographies`, `Marker`
- Dark-themed world map (dark gray continents, darker ocean)
- Red markers for each circuit location (lat/lng from data)
- Hover tooltip showing circuit name and country
- Click navigates to circuit detail page
- Zoom controls or scroll zoom
- Client component

**Step 2: Build circuit list view**

`components/circuits/circuit-list.tsx`:
- Alternative list/grid view below the map
- Filterable by continent, country, active/historic
- Each card shows circuit mini-map, name, country, total races hosted, lap record

**Step 3: Assemble circuits page**

`app/(main)/circuits/page.tsx`:
- Server component, loads all circuits
- Map at top (lazy-loaded with `next/dynamic` + Suspense)
- List view below with filters
- Toggle between map-only and list view

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: circuits page with interactive world map and filterable list"
```

---

### Task 9: Circuit Detail Page

**Files:**
- Modify: `app/(main)/circuits/[slug]/page.tsx`
- Create: `components/circuits/track-map.tsx`
- Create: `components/circuits/circuit-stats.tsx`
- Create: `components/circuits/circuit-records.tsx`
- Create: `components/circuits/lap-record-chart.tsx`

**Step 1: Build full track map component**

`components/circuits/track-map.tsx`:
- Renders the full SVG track layout from the MasterPlay007/F1-Track-Layouts-SVG repo
- SVG files stored in `public/tracks/{circuit-id}.svg`
- Corner numbers and names labeled on the map
- DRS zones highlighted in green
- Start/finish line marked
- Motion animation: track draws itself on page load

**Step 2: Build circuit stats panel**

`components/circuits/circuit-stats.tsx`:
- Key facts: track length, number of turns, DRS zones, first GP year, total GPs held
- Lap record with driver name and year
- Location info with country flag

**Step 3: Build circuit records table**

`components/circuits/circuit-records.tsx`:
- Most wins at this circuit, most poles, all-time winners list
- Table sorted by wins descending

**Step 4: Build lap record progression chart**

`components/circuits/lap-record-chart.tsx`:
- Line chart showing how the lap record has improved over the years
- Each point labeled with driver name
- Shows impact of regulation changes on lap times

**Step 5: Assemble circuit detail page**

`app/(main)/circuits/[slug]/page.tsx`:
- `generateStaticParams` for all circuits
- Track map at top, stats panel beside it
- Tabs: Records, History (MDX content from `/content/circuits/{slug}.mdx` if exists)

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: circuit detail pages with SVG track maps, stats, and records"
```

---

### Task 10: Seasons List and Season Detail

**Files:**
- Modify: `app/(main)/seasons/page.tsx`
- Modify: `app/(main)/seasons/[year]/page.tsx`
- Create: `components/seasons/year-grid.tsx`
- Create: `components/seasons/race-calendar.tsx`
- Create: `components/seasons/championship-chart.tsx`
- Create: `components/seasons/standings-table.tsx`

**Step 1: Build year picker grid**

`components/seasons/year-grid.tsx`:
- Grid of year buttons from 1950 to present
- Each cell color-coded by that year's champion's team color
- Hover shows champion name
- Click navigates to season detail

**Step 2: Build race calendar**

`components/seasons/race-calendar.tsx`:
- Table/list of all races in the season
- Columns: Round, Race Name, Circuit, Date, Winner, Team
- Winner cell colored by team
- Click row to navigate to race detail

**Step 3: Build championship progression chart**

`components/seasons/championship-chart.tsx`:
- Animated line chart (Recharts AreaChart or racing-bars)
- X axis: race rounds, Y axis: cumulative points
- One line per driver (top 5-10), colored by team
- Animated on scroll: lines draw progressively
- Toggle to show all drivers or top N

**Step 4: Build standings tables**

`components/seasons/standings-table.tsx`:
- Final driver standings table: position, driver, team, points, wins
- Final constructor standings: position, team, points, wins
- Team-colored indicators

**Step 5: Assemble seasons list page**

`app/(main)/seasons/page.tsx`:
- Server component
- Year picker grid as the main UI
- Optional: decade filter tabs (1950s, 1960s, etc.)

**Step 6: Assemble season detail page**

`app/(main)/seasons/[year]/page.tsx`:
- `generateStaticParams` for all years
- Tabs: Calendar, Championship Battle, Driver Standings, Constructor Standings
- Championship progression chart as the hero visual

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: seasons explorer with year grid, race calendar, and championship charts"
```

---

### Task 11: Race Detail Page

**Files:**
- Modify: `app/(main)/seasons/[year]/[round]/page.tsx`
- Create: `components/races/race-header.tsx`
- Create: `components/races/race-results-table.tsx`
- Create: `components/races/qualifying-results.tsx`

**Step 1: Build race header**

`components/races/race-header.tsx`:
- Race name, circuit, date
- Circuit mini-map
- Weather conditions (if available in data)
- Winner highlight card

**Step 2: Build race results table**

`components/races/race-results-table.tsx`:
- Full classification: position, driver, team, grid, laps, time/retired, points
- Team-colored indicators
- Highlight positions gained/lost from grid (green up, red down)
- Fastest lap indicator

**Step 3: Build qualifying results**

`components/races/qualifying-results.tsx`:
- Q1, Q2, Q3 times per driver
- Elimination zones highlighted
- Gap to pole position column

**Step 4: Assemble race detail page**

`app/(main)/seasons/[year]/[round]/page.tsx`:
- `generateStaticParams` for all year/round combinations
- Tabs: Results, Qualifying, Analysis (placeholder for Task 13)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: race detail pages with results and qualifying tables"
```

---

### Task 12: Records & Stats Page

**Files:**
- Modify: `app/(main)/records/page.tsx`
- Create: `components/records/leaderboard.tsx`
- Create: `components/records/record-category.tsx`

**Step 1: Build leaderboard component**

`components/records/leaderboard.tsx`:
- Reusable ranked list component
- Shows: rank, name (driver or team), value, optional sparkline
- Top 3 highlighted with gold/silver/bronze accents
- Team-colored indicators

**Step 2: Build record category component**

`components/records/record-category.tsx`:
- Section with title and leaderboard
- Categories: Most Wins, Most Poles, Most Podiums, Most Championships, Most Fastest Laps, Most Races, Most Points (all-time)
- Each expandable to show top 20 (default shows top 10)

**Step 3: Build derived stats section**

Add computed stats to the page:
- Highest win rate (min 50 races)
- Highest podium rate (min 50 races)
- Best average finish (min 50 races)
- Most consecutive wins
- Most consecutive podiums
- Most races without a win
- Youngest/oldest champion, winner, pole sitter

**Step 4: Assemble records page**

`app/(main)/records/page.tsx`:
- Server component
- Grid layout: 2 columns on desktop, 1 on mobile
- Tabs or anchor sections for driver records vs constructor records

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: records page with all-time leaderboards and derived statistics"
```

---

### Task 13: Teams List and Team Profile Pages

**Files:**
- Modify: `app/(main)/teams/page.tsx`
- Modify: `app/(main)/teams/[slug]/page.tsx`
- Create: `components/teams/team-card.tsx`
- Create: `components/teams/team-grid.tsx`
- Create: `components/teams/team-header.tsx`
- Create: `components/teams/team-stats.tsx`
- Create: `components/teams/team-drivers-history.tsx`

**Step 1: Build team card**

`components/teams/team-card.tsx`:
- Card with team color gradient top border
- Team name, nationality, active/historic badge
- Key stats: championships, wins, races
- Hover lift animation

**Step 2: Build teams list page**

`app/(main)/teams/page.tsx`:
- Grid of team cards
- Filter: active/all/historic
- Sort by: championships, wins, alphabetical

**Step 3: Build team profile header**

`components/teams/team-header.tsx`:
- Team name with team color accent
- Nationality, active years, championship count
- Current drivers (if active)

**Step 4: Build team stats and driver history**

`components/teams/team-stats.tsx` and `components/teams/team-drivers-history.tsx`:
- Season-by-season results chart
- List of all drivers who drove for the team, grouped by season
- Championship years highlighted
- Constructor lineage section (links to predecessor/successor teams)

**Step 5: Assemble team profile page**

`app/(main)/teams/[slug]/page.tsx`:
- `generateStaticParams` for all teams
- Tabs: Overview, Stats, Driver History, Lineage

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: teams pages with profiles, stats, and driver history"
```

---

## Wave 3: Visual Features

### Task 14: Race Analysis (Telemetry Visualizations)

**Files:**
- Create: `components/races/lap-chart.tsx`
- Create: `components/races/tire-strategy.tsx`
- Create: `components/races/pit-stop-chart.tsx`
- Create: `components/races/gap-chart.tsx`
- Create: `components/races/race-events-timeline.tsx`
- Modify: `app/(main)/seasons/[year]/[round]/page.tsx`

**Prerequisites:** This task requires telemetry data in `data/telemetry/`. The Python script should pre-generate per-race analysis JSONs for races from 2018+ with available data.

**Step 1: Extend data pipeline for telemetry**

Add to `scripts/fetch_data.py`:
- Use FastF1 to load session data for recent seasons (2023-2025)
- Export per-race JSON: lap times, positions by lap, pit stops with durations, tire compounds per stint, safety car periods
- Save to `data/telemetry/{year}/{round}.json`

**Step 2: Build lap chart (bump chart)**

`components/races/lap-chart.tsx`:
- Recharts LineChart with inverted Y axis (P1 at top)
- One line per driver, colored by team
- X axis: lap numbers
- Hover tooltip shows position and gap
- Safety car periods highlighted as vertical bands (yellow)
- Client component, lazy-loaded

**Step 3: Build tire strategy Gantt chart**

`components/races/tire-strategy.tsx`:
- Horizontal bar chart, one row per driver
- Each bar segment colored by tire compound (Soft=red, Medium=yellow, Hard=white, Inter=green, Wet=blue)
- Segment width proportional to stint length (laps)
- Pit stop markers between segments

**Step 4: Build pit stop comparison chart**

`components/races/pit-stop-chart.tsx`:
- Bar chart showing pit stop durations for each driver
- Grouped by stop number (Stop 1, Stop 2, etc.)
- Highlight fastest pit stop

**Step 5: Build gap-to-leader chart**

`components/races/gap-chart.tsx`:
- Area chart showing gap to leader over laps
- Converging lines show battles, diverging lines show dominance
- Team colored

**Step 6: Build race events timeline**

`components/races/race-events-timeline.tsx`:
- Horizontal timeline bar showing safety cars, VSC, red flags, key overtakes
- Color-coded markers with hover details

**Step 7: Wire into race detail page**

Add "Analysis" tab to `app/(main)/seasons/[year]/[round]/page.tsx`:
- Only shown for races with telemetry data
- All charts lazy-loaded with Suspense boundaries and skeleton fallbacks

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: race analysis with lap charts, tire strategy, pit stops, and gap visualization"
```

---

### Task 15: Constructor Family Tree

**Files:**
- Modify: `app/(main)/family-tree/page.tsx`
- Create: `components/family-tree/tree-visualization.tsx`
- Create: `components/family-tree/team-node.tsx`
- Create: `data/team-lineage.json`

**Step 1: Create team lineage data**

`data/team-lineage.json` - manually curated data:

```json
{
  "lineages": [
    {
      "id": "aston-martin-line",
      "chain": [
        { "id": "jordan", "name": "Jordan", "years": [1991, 2005], "color": "#FFC700" },
        { "id": "midland", "name": "Midland", "years": [2006, 2006], "color": "#CC0000" },
        { "id": "spyker", "name": "Spyker", "years": [2007, 2007], "color": "#FF6600" },
        { "id": "force_india", "name": "Force India", "years": [2008, 2018], "color": "#F596C8" },
        { "id": "racing_point", "name": "Racing Point", "years": [2019, 2020], "color": "#F596C8" },
        { "id": "aston_martin", "name": "Aston Martin", "years": [2021, 2026], "color": "#229971" }
      ]
    }
  ]
}
```

Include all lineage chains: Red Bull line (Stewart -> Jaguar -> Red Bull), Alpine line (Toleman -> Benetton -> Renault -> Lotus -> Alpine), etc.

**Step 2: Build tree visualization**

`components/family-tree/tree-visualization.tsx`:
- Horizontal timeline from 1950 to present
- Each lineage is a horizontal lane
- Nodes are blocks spanning their active years, colored by team color
- Connected by lines/arrows showing succession
- Zoom and pan support
- Built with SVG + Motion for animations

**Step 3: Build team node component**

`components/family-tree/team-node.tsx`:
- Clickable node showing team name, years active
- On click: expand to show championships, notable drivers, key moments
- Links to full team profile page

**Step 4: Assemble family tree page**

`app/(main)/family-tree/page.tsx`:
- Full-width visualization
- Legend showing what colors/connections mean
- Filter by decade or search by team name

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: interactive constructor family tree with full team lineage visualization"
```

---

## Wave 4: Interactive Features

### Task 16: What-If Simulator

**Files:**
- Modify: `app/(main)/what-if/page.tsx`
- Create: `components/what-if/season-picker.tsx`
- Create: `components/what-if/scoring-system-picker.tsx`
- Create: `components/what-if/simulator-results.tsx`
- Create: `lib/scoring-systems.ts`
- Create: `lib/what-if-engine.ts`

**Step 1: Define scoring systems**

Create `lib/scoring-systems.ts`:

```typescript
export interface ScoringSystem {
  id: string;
  name: string;
  years: string;
  points: Record<number, number>; // position -> points
  fastestLap?: number;
}

export const SCORING_SYSTEMS: ScoringSystem[] = [
  {
    id: "current",
    name: "Current System (2010+)",
    years: "2010-present",
    points: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 },
    fastestLap: 1,
  },
  {
    id: "2003-2009",
    name: "2003-2009 System",
    years: "2003-2009",
    points: { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 },
  },
  {
    id: "1991-2002",
    name: "1991-2002 System",
    years: "1991-2002",
    points: { 1: 10, 2: 6, 3: 4, 4: 3, 5: 2, 6: 1 },
  },
  {
    id: "1961-1990",
    name: "1961-1990 System",
    years: "1961-1990",
    points: { 1: 9, 2: 6, 3: 4, 4: 3, 5: 2, 6: 1 },
  },
  {
    id: "1950-1960",
    name: "Original System",
    years: "1950-1960",
    points: { 1: 8, 2: 6, 3: 4, 4: 3, 5: 2 },
    fastestLap: 1,
  },
  {
    id: "winner-takes-all",
    name: "Winner Takes All",
    years: "Custom",
    points: { 1: 1 },
  },
  {
    id: "double-points",
    name: "Double Points Final Race",
    years: "2014 experiment",
    points: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 },
  },
];
```

**Step 2: Build the what-if calculation engine**

Create `lib/what-if-engine.ts`:
- Takes a season's race results + a scoring system
- Optionally removes DNFs (assigns would-have-finished position based on running order)
- Recalculates all points
- Returns new standings sorted by points
- Pure function, runs entirely client-side

**Step 3: Write tests for the engine**

Create `__tests__/what-if-engine.test.ts`:
- Test each scoring system produces correct points
- Test DNF removal works correctly
- Test tie-breaking (most wins, then most second places)
- Test custom scoring system

```bash
npm run test -- --watch __tests__/what-if-engine.test.ts
```

**Step 4: Build season picker**

`components/what-if/season-picker.tsx`:
- Dropdown to select any season (1950-present)
- Shows current champion as preview

**Step 5: Build scoring system picker**

`components/what-if/scoring-system-picker.tsx`:
- Radio group of preset scoring systems
- "Custom" option that shows a form to define points per position
- "Remove DNFs" toggle switch
- URL search params update for shareable links

**Step 6: Build simulator results**

`components/what-if/simulator-results.tsx`:
- Side-by-side or overlay: actual standings vs simulated standings
- Highlight position changes (who gains, who loses)
- "Alternate champion" banner if champion changes
- Animated transitions when switching scoring systems

**Step 7: Assemble what-if page**

`app/(main)/what-if/page.tsx`:
- Client component (heavy interactivity)
- Season picker + scoring system picker at top
- Results below, updating in real-time
- Share button that copies URL with params

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: what-if simulator with alternate scoring systems and DNF removal"
```

---

### Task 17: F1 101 Learn Section

**Files:**
- Modify: `app/(main)/learn/page.tsx`
- Modify: `app/(main)/learn/[topic]/page.tsx`
- Create: `content/learn/race-weekend.mdx`
- Create: `content/learn/tire-compounds.mdx`
- Create: `content/learn/drs-and-overtaking.mdx`
- Create: `content/learn/flags.mdx`
- Create: `content/learn/points-system.mdx`
- Create: `content/learn/pit-strategy.mdx`
- Create: `content/learn/regulations-timeline.mdx`
- Create: `content/learn/safety-evolution.mdx`
- Create: `components/learn/topic-card.tsx`
- Create: `components/learn/difficulty-badge.tsx`
- Create: `lib/mdx.ts`

**Step 1: Set up MDX processing**

Create `lib/mdx.ts`:
- Use `next-mdx-remote` for rendering MDX content
- Configure to allow custom components (interactive diagrams)
- Support frontmatter (title, difficulty, description, order)

Configure `next.config.ts` for MDX support if needed.

**Step 2: Build topic card component**

`components/learn/topic-card.tsx`:
- Card with title, short description, difficulty badge (Beginner/Intermediate/Advanced)
- Reading time estimate
- Numbered ordering for suggested learning path

**Step 3: Build learn index page**

`app/(main)/learn/page.tsx`:
- Server component
- Reads all MDX files from `/content/learn/`, extracts frontmatter
- Displays as a grid of topic cards, ordered by suggested learning path
- Grouped by difficulty level

**Step 4: Build topic detail page**

`app/(main)/learn/[topic]/page.tsx`:
- Renders MDX content with custom components
- Table of contents sidebar (auto-generated from headings)
- Previous/Next topic navigation
- `generateStaticParams` from all MDX files

**Step 5: Write MDX content**

Write all 8 learn articles with:
- Clear explanations aimed at new fans
- Embedded diagrams and illustrations (SVG or React components)
- Each article 500-1500 words
- Frontmatter: title, difficulty (beginner/intermediate/advanced), description, order

Topics:
1. **Race Weekend Structure** (beginner) - FP1/2/3, Qualifying, Sprint, Race
2. **Tire Compounds** (beginner) - Soft/Medium/Hard/Inters/Wets
3. **DRS and Overtaking** (beginner) - how DRS works, 2026 Overtake Mode
4. **Flags** (beginner) - all flag meanings with color swatches
5. **Points System** (beginner) - current points, sprint points
6. **Pit Strategy** (intermediate) - undercut, overcut, safety car windows
7. **Regulations Timeline** (intermediate) - key reg changes through history
8. **Safety Evolution** (intermediate) - from no helmets to Halo

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: F1 101 learn section with 8 MDX articles for new fans"
```

---

## Wave 5: Polish

### Task 18: Global Search (Cmd+K)

**Files:**
- Create: `components/search/command-palette.tsx`
- Create: `lib/search-index.ts`
- Modify: `components/layout/header.tsx`
- Modify: `app/layout.tsx`

**Step 1: Build search index**

Create `lib/search-index.ts`:
- At build time, generate a Fuse.js-compatible index from all data
- Index entries: drivers (name, nationality, teams), teams (name), circuits (name, country, city), seasons (year, champion), learn topics (title)
- Each entry has: type, title, subtitle, href
- Export as a typed array

**Step 2: Build command palette**

`components/search/command-palette.tsx`:
- Uses shadcn `Command` component (wraps cmdk)
- Triggered by Cmd+K (Mac) or Ctrl+K (Windows) keyboard shortcut
- Groups results by type (Drivers, Teams, Circuits, Seasons, Learn)
- Fuzzy matching via Fuse.js
- Recent searches stored in localStorage
- Keyboard navigation (arrow keys + enter)
- Client component, lazy-loaded

**Step 3: Wire into layout**

- Add search trigger button in header (magnifying glass icon)
- Render CommandPalette in root layout (portal-based, always available)
- Keyboard shortcut listener

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: global Cmd+K search with fuzzy matching across all content"
```

---

### Task 19: Animations and Micro-Interactions

**Files:**
- Create: `components/animations/count-up.tsx`
- Create: `components/animations/fade-in.tsx`
- Create: `components/animations/card-hover.tsx`
- Create: `components/animations/track-draw.tsx`
- Modify: various existing components

**Step 1: Build scroll-triggered count-up animation**

`components/animations/count-up.tsx`:
- Uses Motion + Intersection Observer
- Animates a number from 0 to target value
- Used in stat cards and home page stats ticker
- Configurable duration and easing

**Step 2: Build fade-in-on-scroll wrapper**

`components/animations/fade-in.tsx`:
- Motion component that fades + slides up on scroll
- Stagger option for lists (each item delays slightly)
- Used on card grids, leaderboards

**Step 3: Build card hover animation**

`components/animations/card-hover.tsx`:
- Wraps any card with Motion
- On hover: slight Y translate up (-4px), subtle shadow increase, border glow in team color
- On tap (mobile): same effect

**Step 4: Build SVG track drawing animation**

`components/animations/track-draw.tsx`:
- Takes an SVG path and animates `stroke-dashoffset` from full to 0
- Creates the "drawing" effect for circuit maps
- Triggered on mount or on scroll intersection
- Used on home page hero and circuit detail pages

**Step 5: Apply animations across the site**

- Wrap all card grids with FadeIn + stagger
- Add CountUp to all stat number displays
- Add CardHover to all interactive cards
- Add TrackDraw to circuit pages and home hero

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: animations - count-up stats, fade-in scroll, card hovers, track drawing"
```

---

### Task 20: OG Images and Social Sharing

**Files:**
- Create: `app/api/og/route.tsx`
- Create: `lib/og-image.tsx`
- Modify: metadata in all page files

**Step 1: Build OG image generator**

`app/api/og/route.tsx`:
- Uses `next/og` (Vercel OG Image Generation)
- Accepts query params: type (driver/circuit/season/general), id, title
- Renders a 1200x630 card with:
  - "The Paddock" branding
  - Dark background matching site theme
  - F1 red accent bar
  - Dynamic content based on type (driver name + stats, circuit name + track outline, etc.)

**Step 2: Add OG metadata to all pages**

Update `generateMetadata` in every page to include:
- `openGraph.images` pointing to the OG API route with correct params
- `twitter.card: "summary_large_image"`
- Proper title and description per page

**Step 3: Add share buttons**

Create a `ShareButton` component that copies URL or opens native share dialog (Web Share API with clipboard fallback).

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: dynamic OG images and social sharing for all pages"
```

---

### Task 21: Performance Audit and Final Polish

**Files:**
- Modify: `next.config.ts`
- Modify: various components for optimization
- Create: `.github/workflows/lighthouse.yml` (optional)

**Step 1: Run Lighthouse audit**

```bash
npm run build && npm run start
```

Run Lighthouse on: home page, a driver profile, a circuit page, the what-if simulator.

Target: 95+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO.

**Step 2: Optimize based on audit results**

Common fixes:
- Ensure all images have explicit width/height
- Add `loading="lazy"` to below-fold images (next/image does this by default)
- Verify no layout shift (CLS = 0)
- Check JS bundle sizes per route with `@next/bundle-analyzer`
- Tree-shake any unused Recharts components
- Ensure all Motion animations use `transform`-only properties

**Step 3: Add performance headers in next.config.ts**

```typescript
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};
```

**Step 4: Verify all pages build successfully**

```bash
npm run build
```

Check for: zero build errors, all static pages generated, reasonable build time.

**Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel dashboard for automatic deploys.

**Step 6: Final smoke test**

Visit the deployed site. Check:
- All pages load correctly
- Navigation works
- Search works
- Charts render
- Mobile responsive
- No console errors

**Step 7: Commit any final fixes**

```bash
git add -A
git commit -m "perf: lighthouse optimization and production polish"
```

---

## Dependency Graph

```
Task 0 (Scaffold)
  └─> Task 1 (Design System)
       └─> Task 2 (Layout Shell)
            └─> Task 4 (UI Components)
                 ├─> Task 5 (Home Page)
                 ├─> Task 6 (Drivers List)
                 │    └─> Task 7 (Driver Profile)
                 ├─> Task 8 (Circuits List)
                 │    └─> Task 9 (Circuit Detail)
                 ├─> Task 10 (Seasons)
                 │    └─> Task 11 (Race Detail)
                 ├─> Task 12 (Records)
                 └─> Task 13 (Teams)
Task 3 (Data Pipeline) ─────────────┘
       │
       └─> Task 14 (Race Analysis) ─ requires telemetry data from Task 3
       └─> Task 15 (Family Tree) ─ requires team lineage from Task 3
Task 16 (What-If) ─ requires season data from Task 3
Task 17 (Learn) ─ independent (MDX content)
Task 18 (Search) ─ requires all data loaded
Task 19 (Animations) ─ requires existing components
Task 20 (OG Images) ─ requires all pages built
Task 21 (Performance) ─ final task, depends on everything
```

## Track SVG Assets Setup

Before Wave 2, download track SVGs:

```bash
# Clone CC0-licensed track SVGs
cd /tmp
git clone https://github.com/MasterPlay007/F1-Track-Layouts-SVG.git
cp F1-Track-Layouts-SVG/svg/* /Users/samanvya/Documents/github/the-paddock/public/tracks/
cp F1-Track-Layouts-SVG/png/* /Users/samanvya/Documents/github/the-paddock/public/tracks/png/

# Also grab GeoJSON coordinates for the world map
git clone https://github.com/bacinger/f1-circuits.git
cp f1-circuits/f1-circuits.geojson /Users/samanvya/Documents/github/the-paddock/data/circuits-geo.json
```
