# UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical bugs and redesign the homepage + listing pages with a Premium Motorsport + Editorial Magazine hybrid visual direction.

**Architecture:** Incremental enhancement on existing components. Fix bugs first, add new design primitives, then layer them into existing pages. No full rewrites.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, motion (Framer Motion), Recharts, shadcn/ui, Lucide icons

---

### Task 1: Fix AnimateIn visibility bug on Drivers and Records pages

The `AnimateIn` component uses `whileInView` + `initial: { opacity: 0 }`. On Drivers and Records pages, above-fold content wrapped in these animations can fail to trigger the intersection observer, leaving content permanently invisible.

**Files:**
- Modify: `app/(main)/drivers/page.tsx`
- Modify: `app/(main)/records/page.tsx`
- Modify: `components/ui/animate-in.tsx`

**Step 1: Add an `immediate` variant to AnimateIn**

In `components/ui/animate-in.tsx`, add an optional `immediate` prop that uses `animate` instead of `whileInView`, so above-fold content renders visible immediately with a subtle entrance:

```tsx
// Add to AnimateInProps:
immediate?: boolean;

// In the component:
if (immediate) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
// ... existing whileInView code below
```

**Step 2: Update Drivers page to use immediate animations for above-fold content**

In `app/(main)/drivers/page.tsx`, the `PageHeader` and stat cards at the top should NOT be wrapped in scroll-triggered animations. Remove `AnimateIn` from the header area or switch to `immediate` mode. Keep `StaggerChildren` on the driver card grid below (it's below-fold and works fine).

**Step 3: Update Records page similarly**

In `app/(main)/records/page.tsx`, ensure the page header and section titles render immediately visible. The record lists below can keep scroll-triggered stagger.

**Step 4: Verify by loading both pages**

Run: `npm run dev` and navigate to `/drivers` and `/records`
Expected: Content visible immediately on page load, no blank/faded state.

**Step 5: Commit**

```bash
git add components/ui/animate-in.tsx app/(main)/drivers/page.tsx app/(main)/records/page.tsx
git commit -m "fix: resolve invisible content on Drivers and Records pages"
```

---

### Task 2: Fix Replay track - distribute driver dots at initial state

All 20 drivers have `trackProgress: 0` at Lap 1 start, causing them to stack on top of each other at the start/finish line. Only the last-drawn driver is visible.

**Files:**
- Modify: `lib/replay.ts` (the `interpolateFrame` function, around line 250-260)

**Step 1: Spread drivers by position gap at trackProgress 0**

In `interpolateFrame`, when returning the early case (`t <= 0`), instead of setting all drivers to `trackProgress: 0`, distribute them based on their gap to leader. Use gap values to create small offsets so cars are visually spaced:

```ts
// Replace the t <= 0 return (around line 250-257):
if (t <= 0) {
  return {
    ...frames[0],
    drivers: frames[0].drivers.map((d) => {
      // Spread cars by gap - use position-based offset so they're visually distinct
      // Leader at 0, each position ~2% behind around the track
      const posOffset = (d.position - 1) * 0.02;
      return {
        ...d,
        trackProgress: 1.0 - posOffset,
      };
    }),
  };
}
```

**Step 2: Verify replay shows all 20 dots**

Navigate to `/replay?year=2024&round=1`
Expected: All 20 driver dots visible on the track, spaced by position.

**Step 3: Commit**

```bash
git add lib/replay.ts
git commit -m "fix: distribute all driver dots on replay track at initial state"
```

---

### Task 3: Fix missing breadcrumbs, titles, and Explore links

**Files:**
- Modify: `app/(main)/compare/page.tsx`
- Modify: `app/(main)/what-if/page.tsx`
- Modify: `app/(main)/page.tsx` (SECTIONS array, around line 66-115)

**Step 1: Add breadcrumb and metadata to Compare page**

In `app/(main)/compare/page.tsx`, add metadata export and breadcrumbs to PageHeader:

```tsx
export const metadata = { title: "Compare | The Paddock" };
// Add breadcrumbs prop to PageHeader:
breadcrumbs={[{ label: "Home", href: "/" }, { label: "Compare" }]}
```

**Step 2: Add breadcrumb to What-If page**

In `app/(main)/what-if/page.tsx`, add a PageHeader wrapper with breadcrumbs (currently it just renders the title directly). The What-If page is a client component, so add the breadcrumb nav manually or wrap with a server component layout.

**Step 3: Add missing pages to SECTIONS array**

In `app/(main)/page.tsx`, add Compare, Replay, Predict, and Create to the `SECTIONS` array (around line 66):

```tsx
{ label: "Compare", href: "/compare", icon: BarChart3, description: "Overlay fastest-lap telemetry data" },
{ label: "Replay", href: "/replay", icon: Play, description: "Watch races unfold lap by lap" },
{ label: "Predict", href: "/predict", icon: Brain, description: "AI-powered race outcome forecasting" },
{ label: "Create", href: "/create", icon: Palette, description: "Generate shareable F1 graphics" },
```

Import the icons: `BarChart3, Play, Brain, Palette` from lucide-react.

**Step 4: Fix Circuits stat pill**

In `app/(main)/page.tsx` around line 182, the Circuits `AnimatedStatPill` should pass `value={allCircuits.length}`. Verify it's not accidentally using `isRange`.

**Step 5: Verify all fixes**

- `/compare` shows breadcrumb and has proper page title
- `/what-if` shows breadcrumb
- Homepage Explore section shows 12 cards (8 + 4 new)
- Homepage Circuits pill shows "78"

**Step 6: Commit**

```bash
git add app/(main)/compare/page.tsx app/(main)/what-if/page.tsx app/(main)/page.tsx
git commit -m "fix: add missing breadcrumbs, page titles, and Explore links"
```

---

### Task 4: Create new design primitives

Build the 6 new shared components that the homepage and listing page redesigns depend on.

**Files:**
- Create: `components/ui/racing-stripe.tsx`
- Create: `components/ui/ghost-text.tsx`
- Create: `components/ui/section-label.tsx`
- Create: `components/ui/bento-card.tsx`
- Create: `components/ui/grid-texture.tsx`
- Create: `components/ui/status-badge.tsx`
- Modify: `app/globals.css` (add supporting CSS classes)

**Step 1: Create RacingStripe**

```tsx
// components/ui/racing-stripe.tsx
export function RacingStripe({ className }: { className?: string }) {
  return (
    <div
      className={`h-1 w-full overflow-hidden ${className ?? ""}`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          var(--color-glow),
          var(--color-glow) 8px,
          transparent 8px,
          transparent 16px
        )`,
        opacity: 0.6,
      }}
    />
  );
}
```

**Step 2: Create GhostText**

```tsx
// components/ui/ghost-text.tsx
export function GhostText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none ${className ?? ""}`}
    >
      <span className="whitespace-nowrap text-[15vw] font-black uppercase leading-none text-white/[0.03]">
        {text}
      </span>
    </div>
  );
}
```

**Step 3: Create SectionLabel**

```tsx
// components/ui/section-label.tsx
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-[0.2em] text-glow ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
```

**Step 4: Create StatusBadge**

```tsx
// components/ui/status-badge.tsx
const VARIANTS = {
  live: "border-green-500/30 bg-green-500/10 text-green-400",
  dominant: "border-glow/30 bg-glow/10 text-glow",
  active: "border-green-500/30 bg-green-500/10 text-green-400",
  default: "border-border bg-surface-2 text-text-secondary",
} as const;

export function StatusBadge({
  variant = "default",
  pulse,
  children,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${VARIANTS[variant]} ${className ?? ""}`}
    >
      {pulse && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
```

**Step 5: Create GridTexture**

```tsx
// components/ui/grid-texture.tsx
export function GridTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}
```

**Step 6: Create BentoCard**

```tsx
// components/ui/bento-card.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const VARIANTS = {
  dark: "bg-surface-2 border-border text-text-primary",
  light: "bg-[#F5F5F0] border-[#E5E5E0] text-[#1a1a1a]",
  accent: "bg-glow border-glow text-white",
} as const;

export function BentoCard({
  variant = "dark",
  href,
  icon: Icon,
  label,
  title,
  description,
  className,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${VARIANTS[variant]} ${className ?? ""}`}
    >
      {Icon && (
        <div className="mb-4 flex items-center justify-between">
          <Icon className="size-6 opacity-60" />
          {href && <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-60" />}
        </div>
      )}
      {label && (
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${variant === "accent" ? "text-white/70" : variant === "light" ? "text-glow" : "text-glow"}`}>
          {label}
        </span>
      )}
      <h3 className="mt-1 text-lg font-bold">{title}</h3>
      {description && (
        <p className={`mt-1 text-sm ${variant === "accent" ? "text-white/70" : variant === "light" ? "text-[#666]" : "text-text-secondary"}`}>
          {description}
        </p>
      )}
      {children}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
```

**Step 7: Commit all primitives**

```bash
git add components/ui/racing-stripe.tsx components/ui/ghost-text.tsx components/ui/section-label.tsx components/ui/bento-card.tsx components/ui/grid-texture.tsx components/ui/status-badge.tsx
git commit -m "feat: add design primitives for UI refresh"
```

---

### Task 5: Redesign homepage

Apply the new design language to the homepage using the primitives from Task 4.

**Files:**
- Modify: `app/(main)/page.tsx` (major changes to JSX layout, ~lines 160-516)
- Modify: `components/home/home-animations.tsx` (may need updates)
- Modify: `app/globals.css` (add new CSS classes if needed)

**Step 1: Update hero section**

In `app/(main)/page.tsx`, update the hero section (around line 162-184):
- Wrap hero in `relative` container, add `GridTexture` and `GhostText text="PADDOCK"` inside
- Add `StatusBadge variant="live" pulse` with "LIVE: 2025 SEASON DATA" above the title
- Keep existing title, update subtitle text
- Stat pills already use CountUp, just ensure Circuits has the correct value

**Step 2: Add RacingStripe divider**

After the stat pills section (after line 184), add:
```tsx
<RacingStripe className="my-8" />
```

**Step 3: Redesign season section with new labels and badges**

Update the season section (around line 188-300):
- Replace `<span className="section-label">Current Season</span>` with `<SectionLabel>Championship Watch</SectionLabel>`
- Replace "Full standings" link text with "FULL SEASON STANDINGS" in uppercase tracked style
- Add `StatusBadge variant="dominant"` with "CURRENT LEADER" to the World Champion `StatCard`
- Add `StatusBadge variant="dominant"` with "DOMINANT" to the Constructor Champion `StatCard`

**Step 4: Add bento content grid**

Below the season standings, replace the Explore navigation section (around line 455-515) with a bento grid:

```tsx
<section>
  <SectionLabel>Navigate</SectionLabel>
  <h2 className="mt-2 text-2xl font-bold text-text-primary">Explore</h2>
  <div className="mt-6 grid grid-cols-3 gap-4">
    <BentoCard variant="dark" href="/records" icon={Award} label="All-time" title="Records" description="Driver and constructor statistical records" className="row-span-1" />
    <BentoCard variant="light" href="/drivers" icon={Users} label="860 Legends" title="Hall of Fame" description="From Fangio to the current grid" />
    <BentoCard variant="dark" href="/circuits" icon={MapPin} label="78 Tracks" title="Circuits" description="Track maps, lap records, and race history" />
    <BentoCard variant="dark" href="/predict" icon={Brain} label="AI Analytics" title="Predictive Engine" description="Strategic simulations for upcoming races" />
    <BentoCard variant="dark" href="/compare" icon={BarChart3} label="Fastest Laps" title="Speed Wall" description="Every track record, every qualifying heater" />
    <BentoCard variant="accent" href="/replay" icon={Play} label="Watch Again" title="Race Archives" description="Re-live every race lap by lap" />
  </div>
</section>
```

**Step 5: Add RacingStripe between major sections**

Add `<RacingStripe className="my-12" />` between:
- Season standings and Top Active Drivers
- Top Active Drivers and Recent Champions
- Recent Champions and Explore bento grid

**Step 6: Verify homepage looks correct**

Navigate to `http://localhost:3000`
Expected: Grid texture background, ghost text, status badges, racing stripes, bento grid explore section.

**Step 7: Commit**

```bash
git add app/(main)/page.tsx components/home/home-animations.tsx app/globals.css
git commit -m "feat: redesign homepage with Premium Motorsport + Editorial layout"
```

---

### Task 6: Refresh listing pages

Apply consistent touch-ups to Drivers, Teams, Circuits, Records, and Seasons pages.

**Files:**
- Modify: `app/(main)/drivers/page.tsx`
- Modify: `app/(main)/teams/page.tsx`
- Modify: `app/(main)/circuits/page.tsx`
- Modify: `app/(main)/records/page.tsx`
- Modify: `app/(main)/seasons/page.tsx`

**Step 1: Compact Drivers page header**

In `app/(main)/drivers/page.tsx`, collapse the oversized hero into a compact header. The "Total Drivers: 860" stat should be inline with the title area, not in its own massive section. Driver grid should start within the first viewport.

**Step 2: Add RacingStripe dividers to Teams and Circuits pages**

Import `RacingStripe` and add between the stats cards and the content grid on both pages.

**Step 3: Replace section-label class with SectionLabel component on Records page**

In `app/(main)/records/page.tsx`, use `<SectionLabel>Driver Records</SectionLabel>` and `<SectionLabel>Constructor Records</SectionLabel>`.

**Step 4: Add card hover effects**

Add the `card-glow` CSS class to the main clickable card containers on Drivers, Teams, Circuits, and Seasons pages. This class already exists in `globals.css` with hover scale + glow.

**Step 5: Add RacingStripe to Seasons page**

Between decade sections if applicable, or between the "Recent Seasons" header and the grid.

**Step 6: Verify all listing pages**

Navigate to each: `/drivers`, `/teams`, `/circuits`, `/records`, `/seasons`
Expected: Compact headers, racing stripes, card hover effects, no visibility bugs.

**Step 7: Commit**

```bash
git add app/(main)/drivers/page.tsx app/(main)/teams/page.tsx app/(main)/circuits/page.tsx app/(main)/records/page.tsx app/(main)/seasons/page.tsx
git commit -m "feat: refresh listing pages with racing stripes, section labels, and card hover effects"
```

---

### Task 7: Expand footer

**Files:**
- Modify: `components/layout/footer.tsx`

**Step 1: Redesign footer with expanded layout**

Replace the simple one-line footer with a structured 3-column layout:
- Left: Logo + tagline "Pure racing data."
- Center: Quick links grid (2 rows of links to all major pages)
- Right: Data attribution + GitHub link

Add a subtle gradient top border (orange fading out) using:
```tsx
<div className="h-px bg-gradient-to-r from-transparent via-glow/30 to-transparent" />
```

**Step 2: Verify footer**

Scroll to bottom of any page.
Expected: Expanded footer with gradient border, links, and branding.

**Step 3: Commit**

```bash
git add components/layout/footer.tsx
git commit -m "feat: expand footer with nav links and gradient border"
```

---

### Task 8: Add nav hover animation

**Files:**
- Modify: `components/layout/header.tsx`

**Step 1: Add animated underline to nav links**

Replace the plain active text color with a bottom underline that transitions smoothly. Use a CSS approach with `after` pseudo-element or Framer Motion `layoutId` for a shared animated indicator.

Simple CSS approach in the nav Link:
```tsx
className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors
  ${isActive ? "text-glow" : "text-text-secondary hover:text-text-primary"}
  after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:bg-glow after:transition-all after:duration-200
  ${isActive ? "after:w-full after:-translate-x-1/2" : "after:w-0 after:-translate-x-1/2 hover:after:w-full"}
`}
```

**Step 2: Verify navigation**

Hover over nav items, check active page indicator.
Expected: Smooth underline animation on hover, persistent underline on active page.

**Step 3: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat: add animated underline to nav links"
```

---

### Task 9: Final build verification and cleanup

**Files:**
- None new, verify existing changes compile

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No type errors.

**Step 2: Run build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

**Step 3: Visual verification**

Check all pages in browser for regressions.

**Step 4: Commit any fixes**

If build/type errors found, fix and commit.
