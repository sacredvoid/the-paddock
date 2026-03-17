# UI Refresh Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Push every page in The Paddock from "functional" to "premium" by applying design primitives to detail pages, polishing interactive tools, fixing bugs, and running impeccable passes.

**Architecture:** Incremental enhancement on existing pages. No new components or dependencies. Layer existing design primitives (RacingStripe, SectionLabel, StatusBadge, GhostText, GridTexture) into every page that doesn't have them yet. Fix two bugs. Run impeccable skills at the end.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, motion (Framer Motion), shadcn/ui, Lucide icons

---

### Task 1: Fix homepage stat counter "0" bug

The `AnimatedStatPill` component wraps its `CountUp` in an `AnimateIn` with `whileInView`. Above-fold stat pills may never trigger the intersection observer, so the CountUp never fires, rendering "0".

**Files:**
- Modify: `components/home/home-animations.tsx` (AnimatedStatPill, ~lines 10-40)

**Step 1: Update AnimatedStatPill to use `immediate` mode**

In `components/home/home-animations.tsx`, the `AnimatedStatPill` wraps content in `AnimateIn`. Add the `immediate` prop so above-fold pills render without needing the intersection observer:

```tsx
// Before:
<AnimateIn direction="up" delay={0.1 + index * 0.08}>

// After:
<AnimateIn direction="up" delay={0.1 + index * 0.08} immediate>
```

**Step 2: Verify homepage loads with correct numbers**

Run: `npm run dev`
Navigate to `http://localhost:3000`
Expected: Stat pills show real numbers (860 Drivers, 200+ Constructors, 78 Circuits, 75 Seasons), not "0".

**Step 3: Commit**

```bash
git add components/home/home-animations.tsx
git commit -m "fix: stat counter pills render 0 due to intersection observer not firing"
```

---

### Task 2: Refresh driver detail page

Transform `/drivers/[slug]` from a plain data page into a premium editorial layout using existing design primitives and team color integration.

**Files:**
- Modify: `app/(main)/drivers/[slug]/page.tsx`

**Step 1: Add imports for design primitives**

Add to the imports at the top of the file:

```tsx
import { RacingStripe } from "@/components/ui/racing-stripe";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { GhostText } from "@/components/ui/ghost-text";
import { getTeamColor } from "@/lib/team-colors";
import { getTeamDrivers } from "@/lib/data";
```

**Step 2: Determine the driver's team color**

After the `sortedSeasons` calculation (line ~69), add logic to find the driver's most recent team color. Look through team-drivers data to find which team this driver belongs to:

```tsx
// Find the driver's team color from team-drivers data
import teamsData from "@/data/teams.json";

// Search all teams for this driver
let driverTeamColor = "#888888";
const allTeams = teamsData as Array<{ id: string; slug: string; color?: string }>;
for (const t of allTeams) {
  const td = getTeamDrivers(t.id);
  if (td.some((d) => d.driverId === driver.id || d.driverId === driver.slug)) {
    driverTeamColor = getTeamColor(t.id);
    break;
  }
}
```

If this approach is too slow or data structure differs, fall back to using `getTeamColor` with a hardcoded mapping for active drivers, or just use the glow color `#FF6B2C` as default.

**Step 3: Transform the identity section**

Replace the identity card (the `<section className="mb-10">` block) with:

- Add `relative overflow-hidden` to the card container
- Add `GhostText` with driver number behind the card content
- Add a team-color gradient strip across the top: `<div className="h-1 w-full" style={{ background: \`linear-gradient(90deg, ${driverTeamColor}, transparent)\` }} />`
- Increase headshot size from `size-[120px]/md:size-[160px]` to `size-[140px]/md:size-[200px]`
- Change the headshot border from `border-2 border-[rgba(255,255,255,0.06)]` to `border-2` with `borderColor: driverTeamColor`
- Replace the `Badge` for active/historic with `StatusBadge`:
  - Active: `<StatusBadge variant="active" pulse>Active</StatusBadge>`
  - Historic: `<StatusBadge>Historic</StatusBadge>`

**Step 4: Add SectionLabels and RacingStripes**

- Before "Career Statistics" h2: replace with `<SectionLabel>Career Statistics</SectionLabel>` and keep the h2 below it
- Between identity section and stats: add `<RacingStripe className="my-8" />`
- Replace all `teamColor` props on stat cards (currently hardcoded colors like `#E10600`) with `driverTeamColor`
- Before "Career Overview" h2: add `<SectionLabel>Career Overview</SectionLabel>`
- Between stats and career overview: add `<RacingStripe className="my-8" />`

**Step 5: Polish season chips**

Add team-color hover to season link chips:

```tsx
// Before:
className="rounded-md border border-[rgba(255,255,255,0.06)] bg-surface-2 px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-glow/30 hover:text-glow"

// After:
className="rounded-md border border-[rgba(255,255,255,0.06)] bg-surface-2 px-2 py-0.5 text-xs text-text-secondary transition-all hover:scale-105 hover:text-text-primary"
style={{ '--hover-border': driverTeamColor } as React.CSSProperties}
// Or simpler: just keep hover:border-glow/30 hover:text-glow
```

**Step 6: Verify driver detail page**

Navigate to `/drivers/lewis-hamilton`
Expected: Team color stripe at top, larger headshot with team-color ring, ghost text number watermark, StatusBadge, racing stripes between sections, section labels, all stat cards using Hamilton's team color.

**Step 7: Commit**

```bash
git add "app/(main)/drivers/[slug]/page.tsx"
git commit -m "feat: refresh driver detail page with team colors and design primitives"
```

---

### Task 3: Refresh team detail page

Transform `/teams/[slug]` with full-width team color presence, progress bars for rates, and ranked driver list.

**Files:**
- Modify: `app/(main)/teams/[slug]/page.tsx`

**Step 1: Add design primitive imports**

```tsx
import { RacingStripe } from "@/components/ui/racing-stripe";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { GhostText } from "@/components/ui/ghost-text";
```

**Step 2: Transform the hero area**

- Replace the small `h-1.5 w-32` color bar with a full-width accent: `<div className="h-1.5 w-full rounded-full" style={{ backgroundColor: color }} />`
- Increase logo size from `size-20` to `size-24`
- Add team-color ring to logo container: `style={{ borderColor: color }}` with `border-2`
- Add `GhostText text={team.name.split(" ").pop() || team.name}` behind the hero area (wrap in relative container)
- Replace Badge with StatusBadge: `<StatusBadge variant={team.isActive ? "active" : "default"} pulse={team.isActive}>{team.isActive ? "Active" : "Historic"}</StatusBadge>`

**Step 3: Add section rhythm**

- Before "Career Statistics": add `<SectionLabel>Career Statistics</SectionLabel>` above the h2
- Add `<RacingStripe className="my-8" />` between hero and stats
- Before "Performance Rates": add `<SectionLabel>Performance Rates</SectionLabel>`
- Add `<RacingStripe className="my-8" />` between stats and performance rates
- Before "Top Drivers": add `<SectionLabel>Top Drivers</SectionLabel>`
- Add `<RacingStripe className="my-8" />` between performance rates and top drivers

**Step 4: Replace text percentages with progress bars**

In the Performance Rates section, replace the plain text with horizontal bars:

```tsx
<div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-surface-1 p-4">
  <p className="text-sm text-text-secondary">Win Rate</p>
  <p className="stats-number mt-1 text-2xl font-bold text-text-primary">
    {((stats.wins / stats.races) * 100).toFixed(1)}%
  </p>
  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
    <div
      className="h-full rounded-full transition-all"
      style={{
        width: `${(stats.wins / stats.races) * 100}%`,
        backgroundColor: color,
      }}
    />
  </div>
</div>
```

Apply same pattern to Podium Rate and Points per Race (normalize points/race to a reasonable max like 25).

**Step 5: Add rank medals to top drivers**

For positions 1-3 in the Top Drivers list, replace the plain number with medal icons:

```tsx
{i === 0 && <Trophy className="size-4 text-amber-400" />}
{i === 1 && <Medal className="size-4 text-gray-300" />}
{i === 2 && <Medal className="size-4 text-amber-700" />}
{i > 2 && <span className="stats-number w-6 text-center text-sm font-bold text-text-secondary">{i + 1}</span>}
```

**Step 6: Verify and commit**

Navigate to `/teams/ferrari` and `/teams/mclaren`
Expected: Full-width color bar, larger logo, ghost text, section labels, racing stripes, progress bars for rates, medal icons on top 3 drivers.

```bash
git add "app/(main)/teams/[slug]/page.tsx"
git commit -m "feat: refresh team detail page with progress bars and design primitives"
```

---

### Task 4: Refresh circuit detail page

**Files:**
- Modify: `app/(main)/circuits/[slug]/page.tsx`

**Step 1: Add imports**

```tsx
import { RacingStripe } from "@/components/ui/racing-stripe";
import { SectionLabel } from "@/components/ui/section-label";
import { GridTexture } from "@/components/ui/grid-texture";
```

**Step 2: Enhance track layout display**

Add GridTexture behind the SVG track image. Wrap the track display in a relative container:

```tsx
<div className="relative mb-8 flex justify-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface-1 p-6">
  <GridTexture />
  <img
    src={getCircuitSvgPath(circuit.id)}
    alt={`${circuit.name} track layout`}
    className="relative z-10 h-auto w-full max-w-md object-contain drop-shadow-[0_0_8px_rgba(255,107,44,0.3)]"
  />
</div>
```

**Step 3: Add section rhythm**

- After track display: `<RacingStripe className="my-8" />`
- Before stats row: `<SectionLabel>Circuit Data</SectionLabel>`
- Before "Location Details": `<SectionLabel>Location</SectionLabel>` (replace plain h2)
- Between stats and location: `<RacingStripe className="my-8" />`

**Step 4: Accent the "Races Hosted" stat**

In the info panel, make the races hosted number glow-colored (already `text-glow`), ensure it stays prominent.

**Step 5: Verify and commit**

Navigate to `/circuits/monza`
Expected: Grid texture behind track SVG, glow drop-shadow on track, racing stripes, section labels.

```bash
git add "app/(main)/circuits/[slug]/page.tsx"
git commit -m "feat: refresh circuit detail page with grid texture and design primitives"
```

---

### Task 5: Refresh race detail page

**Files:**
- Modify: `app/(main)/seasons/[year]/[round]/page.tsx`

**Step 1: Add imports**

```tsx
import { RacingStripe } from "@/components/ui/racing-stripe";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
```

**Step 2: Add StatusBadge to winner stat card**

Wrap or annotate the winner StatCard with a "Race Winner" badge. Add the StatusBadge next to the winner name:

```tsx
{winner && (
  <div className="relative">
    <StatusBadge variant="dominant" className="absolute -top-2 right-2 z-10">Winner</StatusBadge>
    <StatCard
      label="Winner"
      value={driverDisplayName(winner.driverId)}
      teamColor={getTeamColor(winner.teamId)}
    />
  </div>
)}
```

**Step 3: Add section labels and racing stripes**

- Before "Race Results" h2: replace with `<SectionLabel>Race Results</SectionLabel>` + keep the h2 with icon
- Between stats and results: `<RacingStripe className="my-8" />`
- Before "Qualifying" h2: add `<SectionLabel>Qualifying</SectionLabel>`
- Between results and qualifying: `<RacingStripe className="my-8" />`
- Before "Pit Stops" h2: add `<SectionLabel>Pit Stops</SectionLabel>`
- Between qualifying and pit stops: `<RacingStripe className="my-8" />`

**Step 4: Highlight podium rows**

Add subtle background to podium positions in the race results table:

```tsx
className={`border-[rgba(255,255,255,0.06)] hover:bg-surface-2 ${
  !finished ? "opacity-60" :
  result.position === 1 ? "bg-amber-500/5" :
  result.position === 2 ? "bg-gray-300/5" :
  result.position === 3 ? "bg-amber-700/5" : ""
}`}
```

**Step 5: Verify and commit**

Navigate to `/seasons/2024/1`
Expected: Winner badge, racing stripes between sections, section labels, podium row highlights.

```bash
git add "app/(main)/seasons/[year]/[round]/page.tsx"
git commit -m "feat: refresh race detail page with winner badge and podium highlights"
```

---

### Task 6: Polish interactive tool pages

Apply consistent design primitives to compare, replay, predict, what-if, create, and learn pages.

**Files:**
- Modify: `app/(main)/compare/page.tsx`
- Modify: `app/(main)/replay/page.tsx`
- Modify: `app/(main)/predict/page.tsx`
- Modify: `app/(main)/what-if/page.tsx`
- Modify: `app/(main)/create/page.tsx`
- Modify: `app/(main)/learn/page.tsx`

**Step 1: Add RacingStripe import to all six pages**

Each page gets:
```tsx
import { RacingStripe } from "@/components/ui/racing-stripe";
```

Pages that need SectionLabel:
```tsx
import { SectionLabel } from "@/components/ui/section-label";
```

**Step 2: Compare page**

After PageHeader, before Suspense: add `<RacingStripe className="my-6" />`

**Step 3: Replay page**

After PageHeader, before Suspense: add `<RacingStripe className="my-6" />`

**Step 4: Predict page**

After PageHeader, before Suspense: add `<RacingStripe className="my-6" />`

**Step 5: What-If page**

Already has PageHeader. Add `<RacingStripe className="my-6" />` after it.

**Step 6: Create page**

After PageHeader, before Suspense: add `<RacingStripe className="my-6" />`

**Step 7: Learn page**

Add `<RacingStripe className="my-6" />` between the beginner and intermediate sections, and between intermediate and drama sections. Also add SectionLabel above each section title if not already using the component.

**Step 8: Verify all pages**

Visit each page and confirm racing stripes appear.

**Step 9: Commit**

```bash
git add "app/(main)/compare/page.tsx" "app/(main)/replay/page.tsx" "app/(main)/predict/page.tsx" "app/(main)/what-if/page.tsx" "app/(main)/create/page.tsx" "app/(main)/learn/page.tsx"
git commit -m "feat: add racing stripes and section labels to interactive tool pages"
```

---

### Task 7: Build verification

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Fix any build errors and commit**

If errors found, fix and commit:

```bash
git add -A
git commit -m "fix: resolve build errors from UI refresh phase 2"
```

---

### Task 8: Impeccable polish passes

Run impeccable skills on the modified pages for final quality.

**Step 1: Run `/impeccable:animate`**

Target: detail pages (driver, team, circuit, race). Add entrance animations to stat cards and hero elements using the existing AnimateIn/StaggerChildren components.

**Step 2: Run `/impeccable:polish`**

Target: all modified pages. Fix alignment, spacing consistency, and any detail issues.

**Step 3: Run `/impeccable:bolder`**

Target: detail page hero sections. Push visual impact with team colors, make driver numbers more dramatic, ensure the editorial feel comes through.

**Step 4: Commit polish changes**

```bash
git add -A
git commit -m "feat: impeccable polish pass on all refreshed pages"
```
