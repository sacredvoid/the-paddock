# Luminous Dark Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive visual overhaul of The Paddock from generic dark theme to "Luminous Dark" aesthetic (Raycast + Apple inspired), replacing all colors, typography, spacing, component patterns, and motion across every page.

**Architecture:** Replace CSS variables and Tailwind theme tokens in globals.css, update font configuration, then systematically rebuild each shared component and page to use the new design system. No data/logic changes, purely visual.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, Motion (Framer Motion), Inter + JetBrains Mono fonts, Lucide icons

---

### Task 0: Design System Foundation - globals.css and fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `lib/fonts.ts`
- Modify: `app/layout.tsx`

**Step 1: Rewrite globals.css with new Luminous Dark tokens**

Replace the entire `@theme inline` block, `:root`, and `.dark` sections with the new palette:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

  /* Luminous Dark palette */
  --color-surface-1: #111113;
  --color-surface-2: #1A1A1E;
  --color-surface-3: #232328;
  --color-glow: #FF6B2C;
  --color-glow-muted: rgba(255, 107, 44, 0.08);
  --color-glow-ring: rgba(255, 107, 44, 0.15);
  --color-success: #34D399;
  --color-danger: #EF4444;
  --color-text-primary: #EDEDEF;
  --color-text-secondary: #8B8B8D;
  --color-text-tertiary: #5C5C5E;
  --font-heading: var(--font-inter);
}

:root {
  --background: #09090B;
  --foreground: #EDEDEF;
  --card: #111113;
  --card-foreground: #EDEDEF;
  --popover: #111113;
  --popover-foreground: #EDEDEF;
  --primary: #FF6B2C;
  --primary-foreground: #FFFFFF;
  --secondary: #1A1A1E;
  --secondary-foreground: #EDEDEF;
  --muted: #1A1A1E;
  --muted-foreground: #8B8B8D;
  --accent: #FF6B2C;
  --accent-foreground: #FFFFFF;
  --destructive: #EF4444;
  --border: rgba(255, 255, 255, 0.06);
  --input: rgba(255, 255, 255, 0.06);
  --ring: #FF6B2C;
  --chart-1: #FF6B2C;
  --chart-2: #34D399;
  --chart-3: #60A5FA;
  --chart-4: #A78BFA;
  --chart-5: #FBBF24;
  --radius: 0.75rem;
  --sidebar: #111113;
  --sidebar-foreground: #EDEDEF;
  --sidebar-primary: #FF6B2C;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #1A1A1E;
  --sidebar-accent-foreground: #EDEDEF;
  --sidebar-border: rgba(255, 255, 255, 0.06);
  --sidebar-ring: #FF6B2C;
}

/* No separate .dark block needed - dark by default */

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

/* Glass panel effect for overlays */
.glass {
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Gradient mesh for hero sections */
.hero-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 107, 44, 0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255, 107, 44, 0.06), transparent);
}

/* Subtle dot grid pattern */
.dot-grid {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Tabular numbers for stats alignment */
.stats-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* Card hover glow effect */
.card-glow {
  transition: border-color 150ms, box-shadow 150ms, transform 250ms;
}
.card-glow:hover {
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow: 0 0 20px rgba(255, 107, 44, 0.08);
  transform: scale(1.01);
}

/* Section heading style */
.section-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}
```

**Step 2: Simplify fonts.ts to Inter + JetBrains Mono only**

```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
```

**Step 3: Update root layout.tsx**

Remove `titillium` import. Update className to use only `inter` and `jetbrainsMono` variables. Remove `dark` class (no longer needed since we have a single palette).

```tsx
import { inter, jetbrainsMono } from "@/lib/fonts";
// ...
<html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
  <body className="min-h-screen bg-background antialiased">
```

**Step 4: Verify build**

Run: `cd /Users/samanvya/Documents/github/the-paddock && npm run build`
Expected: Build succeeds (pages may have broken class references which we fix in subsequent tasks)

**Step 5: Commit**

```bash
git add app/globals.css lib/fonts.ts app/layout.tsx
git commit -m "feat: replace design system with Luminous Dark palette and tokens"
```

---

### Task 1: Core Layout - Header, Footer, Mobile Nav, Main Layout

**Files:**
- Modify: `components/layout/header.tsx`
- Modify: `components/layout/footer.tsx`
- Modify: `components/layout/mobile-nav.tsx`
- Modify: `app/(main)/layout.tsx`

**Step 1: Rebuild header.tsx**

Replace with Luminous Dark header: glass background, refined nav links, accent hover, keyboard shortcut hint on search.

Key changes:
- Background: `glass` class instead of `bg-background/80 backdrop-blur-md`
- Border: `border-b border-[rgba(255,255,255,0.06)]`
- Logo: Inter bold, `text-text-primary` with `glow` colored accent word
- Nav links: `text-text-secondary` base, `text-text-primary` hover, `text-glow` when active
- Search button: show `Cmd+K` keyboard shortcut badge
- Height: `h-16` instead of `h-14`
- Remove all `style={{ fontFamily: "var(--font-heading)" }}` - Inter is now the heading font via CSS
- Remove all `text-f1-red` - replace with `text-glow`
- Remove all `border-border-subtle` - replace with `border-[rgba(255,255,255,0.06)]`
- Remove all `bg-surface` - replace with `bg-surface-1`
- Remove all `bg-surface-elevated` - replace with `bg-surface-2`
- Remove all `text-text-primary` / `text-text-secondary` - these now map to `text-text-primary` / `text-text-secondary` (same token names but new values)

**Step 2: Rebuild footer.tsx**

Minimal footer: single line with logo, disclaimer, and GitHub link. Background `bg-surface-1`, subtle top border.

**Step 3: Rebuild mobile-nav.tsx**

Glass panel overlay. Active items get `bg-surface-2` with left border accent. Smooth slide animation.

**Step 4: Update main layout.tsx**

Increase max-width padding. Add `px-6 md:px-12` for breathing room. Change `py-8` to `py-10`.

**Step 5: Verify build and commit**

```bash
npm run build
git add components/layout/ app/\(main\)/layout.tsx
git commit -m "feat: rebuild layout shell with Luminous Dark glass header and refined footer"
```

---

### Task 2: Shared UI Components

**Files:**
- Modify: `components/ui/page-header.tsx`
- Modify: `components/ui/stat-card.tsx`
- Modify: `components/ui/driver-card.tsx`
- Modify: `components/ui/data-table.tsx`
- Modify: `components/ui/filter-bar.tsx`

**Step 1: Rebuild page-header.tsx**

- Breadcrumbs: `section-label` style (uppercase, tertiary color, 12px)
- Title: `text-5xl font-bold tracking-tight text-text-primary` (Apple-scale, no fontFamily override)
- Subtitle: `text-lg text-text-secondary mt-3`
- Remove all inline `style={{ fontFamily }}` throughout the entire codebase going forward

**Step 2: Rebuild stat-card.tsx**

- Card: `bg-surface-1 border-[rgba(255,255,255,0.06)] rounded-xl card-glow`
- Team color: left border 3px (same pattern, new border syntax)
- Label: `section-label` (uppercase, tertiary)
- Value: `stats-number text-3xl font-semibold text-text-primary`
- Trend: green/red using `text-success` / `text-danger` tokens

**Step 3: Rebuild driver-card.tsx**

- Card: `bg-surface-1 rounded-xl card-glow overflow-hidden`
- Team color top border: 3px solid
- Headshot: same circular approach but with `border-[rgba(255,255,255,0.06)]` and `bg-surface-2`
- Name: first name in `text-text-secondary text-sm`, last name in `text-lg font-semibold text-text-primary`
- Wins stat: `text-glow` for trophy icon instead of `text-f1-red`
- Remove nationality display (cleaner card)

**Step 4: Rebuild data-table.tsx**

- Remove alternating row backgrounds
- Row border: `border-b border-[rgba(255,255,255,0.06)]`
- Header: `section-label` style (uppercase, tertiary)
- Hover: `hover:bg-surface-2` on rows
- Sort indicator: `text-glow` instead of `text-f1-red`

**Step 5: Rebuild filter-bar.tsx**

- Container: `glass rounded-xl p-4` with subtle border
- Search input: `bg-surface-2 border-[rgba(255,255,255,0.06)]`
- Select dropdowns: same surface/border treatment

**Step 6: Verify build and commit**

```bash
npm run build
git add components/ui/page-header.tsx components/ui/stat-card.tsx components/ui/driver-card.tsx components/ui/data-table.tsx components/ui/filter-bar.tsx
git commit -m "feat: rebuild shared UI components with Luminous Dark design system"
```

---

### Task 3: Home Page

**Files:**
- Modify: `app/(main)/page.tsx`

**Step 1: Rebuild home page**

Major layout changes:
- **Hero**: Replace `carbon-fiber` with `hero-gradient`. Display-size headline (72px/`text-7xl`). Remove stat pills from hero, keep them as a subtle row below. Remove red divider bar.
- **Headline**: "THE PADDOCK" with "PADDOCK" in `text-glow`
- **Subtitle**: Slightly larger, more breathing room
- **Season section**: Replace red bar + heading pattern with `section-label` above, then large heading. Cards use new `bg-surface-1 card-glow` pattern.
- **Standings cards**: Glass panel with inner standings list. Team color dots. Points in monospace.
- **Top drivers**: Use rebuilt `DriverCard`. 5 columns on xl, 3 on md, 2 on mobile.
- **Champions**: Cards with team-color left border, `card-glow` hover. Year number in `text-text-tertiary`.
- **Explore grid**: Replace `text-f1-red` icons with `text-glow`. Cards use `card-glow` hover. Remove red hover border.
- Remove `dot-grid` background wrapper, use clean background
- Replace ALL `text-f1-red` with `text-glow`
- Replace ALL `bg-surface` with `bg-surface-1`
- Replace ALL `border-border-subtle` with `border-[rgba(255,255,255,0.06)]`
- Replace ALL `bg-surface-elevated` with `bg-surface-2`
- Remove ALL inline `style={{ fontFamily: "var(--font-titillium)" }}`
- Replace ALL `hover:text-f1-red` with `hover:text-glow`
- Replace ALL `hover:border-f1-red/30` with hover handled by `card-glow`

**Step 2: Verify build and commit**

```bash
npm run build
git add app/\(main\)/page.tsx
git commit -m "feat: rebuild home page with Luminous Dark hero and card system"
```

---

### Task 4: Drivers List Page

**Files:**
- Modify: `app/(main)/drivers/page.tsx`
- Modify: `app/(main)/drivers/drivers-list-client.tsx`

**Step 1: Update drivers/page.tsx**

- Page header with new breadcrumb style
- Stat cards use new tokens (replace hardcoded team colors `#E10600`, `#00D2BE`, `#FF8000`, `#3671C6` with `--glow` and neutral variations or keep as-is for visual variety)
- Remove inline font-family overrides

**Step 2: Update drivers-list-client.tsx**

- Section dividers: replace `bg-border-subtle` with `bg-[rgba(255,255,255,0.06)]`
- Section headings: remove `fontFamily` override
- Grid: maintain same responsive columns
- Empty state: use `bg-surface-1` border tokens

**Step 3: Verify build and commit**

```bash
npm run build
git add app/\(main\)/drivers/
git commit -m "feat: restyle drivers list page with Luminous Dark tokens"
```

---

### Task 5: Driver Detail Page

**Files:**
- Modify: `app/(main)/drivers/[slug]/page.tsx`

**Step 1: Rebuild driver detail**

- Identity section: `bg-surface-1 rounded-xl` with team-colored top border (3px). Remove `bg-surface-elevated` references.
- Number/Code: `text-glow` for number instead of `text-f1-red`. Code badge: `bg-surface-2`.
- Active badge: `bg-success/10 text-success` for active, `bg-surface-2 text-text-secondary` for historic.
- Stats grid: uniform stat cards with new tokens.
- Career overview: Cards use `bg-surface-1`, headings lose `fontFamily` override.
- Season pills: `bg-surface-2 border-[rgba(255,255,255,0.06)]`, hover gets `border-glow/30 text-glow`.
- Replace all `text-f1-red` with `text-glow`, all `text-accent` with `text-glow`.

**Step 2: Verify build and commit**

```bash
npm run build
git add app/\(main\)/drivers/\[slug\]/
git commit -m "feat: restyle driver profile page with Luminous Dark design"
```

---

### Task 6: Teams Page + Team Detail

**Files:**
- Modify: `app/(main)/teams/page.tsx`
- Modify: `app/(main)/teams/teams-list.tsx`
- Modify: `app/(main)/teams/[slug]/page.tsx`

**Step 1: Update teams/page.tsx**

- Replace token references. Stat cards use new tokens.

**Step 2: Update teams-list.tsx**

Read this file first, then apply the same token replacements as drivers-list-client.

**Step 3: Rebuild teams/[slug]/page.tsx**

- Logo container: `bg-surface-1 border-[rgba(255,255,255,0.06)]` instead of `bg-white/10 border-white/10`
- Color bar: keep as-is (team color)
- Identity badges: `text-glow` for active instead of `text-accent`
- Stats grid: new tokens
- Performance rates: `bg-surface-1 border-[rgba(255,255,255,0.06)]`
- Top drivers list: `bg-surface-1 card-glow` with team color left border. Replace `hover:border-f1-red/30` with `card-glow`
- Remove all `fontFamily` overrides

**Step 4: Verify build and commit**

```bash
npm run build
git add app/\(main\)/teams/
git commit -m "feat: restyle teams pages with Luminous Dark design"
```

---

### Task 7: Circuits Page + Circuit Detail

**Files:**
- Modify: `app/(main)/circuits/page.tsx`
- Modify: `app/(main)/circuits/[slug]/page.tsx`
- Modify: `app/(main)/circuits/circuit-map.tsx`
- Modify: `app/(main)/circuits/circuit-location-map.tsx`

**Step 1: Update circuits/page.tsx**

- Circuit cards: `bg-surface-1 card-glow`. Replace `hover:border-f1-red/40 hover:bg-surface-elevated`.
- Track SVG: increase opacity on hover from 0.6 to 0.8.
- Remove `fontFamily` overrides.

**Step 2: Update circuits/[slug]/page.tsx**

- Track display: `bg-surface-1 border-[rgba(255,255,255,0.06)]`
- Info panel icons: `text-glow` instead of `text-f1-red`
- Icon containers: `bg-surface-2`
- Races hosted number: `text-glow` instead of `text-f1-red`

**Step 3: Update circuit-map.tsx and circuit-location-map.tsx**

Read these files, then update marker colors from `#E10600` to `#FF6B2C`, background colors to match `#09090B`, border strokes to match border token.

**Step 4: Verify build and commit**

```bash
npm run build
git add app/\(main\)/circuits/
git commit -m "feat: restyle circuits pages with Luminous Dark design"
```

---

### Task 8: Seasons Page + Season Detail

**Files:**
- Modify: `app/(main)/seasons/page.tsx`
- Modify: `app/(main)/seasons/[year]/page.tsx`

**Step 1: Update seasons/page.tsx**

- Recent season cards: `bg-surface-1 card-glow`. Replace `hover:border-f1-red/50 hover:bg-surface-elevated`.
- Year number: keep large, use `text-text-primary`
- Champion trophy icon: keep `text-amber-400`
- Chevron hover: `text-glow` instead of `text-f1-red`
- Historic decade grid: `bg-surface-1` pills, `hover:border-glow/30`, group-hover text `text-glow`
- Remove `fontFamily` overrides

**Step 2: Update seasons/[year]/page.tsx**

- Tables: Remove alternating row colors. Add `hover:bg-surface-2` on rows.
- Table headers: `bg-surface-2` background
- Team color left borders: keep (dynamic per team)
- Trophy icons: keep `text-amber-400`
- Links: `hover:text-glow` instead of `hover:text-accent` or `hover:text-f1-red`
- Remove `fontFamily` overrides

**Step 3: Verify build and commit**

```bash
npm run build
git add app/\(main\)/seasons/
git commit -m "feat: restyle seasons pages with Luminous Dark design"
```

---

### Task 9: Race Detail Page

**Files:**
- Modify: `app/(main)/seasons/[year]/[round]/page.tsx`

**Step 1: Update race detail**

- Same table treatment as season detail: no alternating rows, `hover:bg-surface-2`
- Table headers: `bg-surface-2`
- DNF opacity: keep at 0.6
- Status text: `text-danger` instead of `text-f1-red` for DNFs
- Section headings: `text-glow` for trophy icon instead of `text-f1-red`
- Qualifying gauge icon: keep `text-purple-400`
- Pit stops fuel icon: keep `text-amber-400`
- Links: `hover:text-glow`
- Remove `fontFamily` overrides

**Step 2: Verify build and commit**

```bash
npm run build
git add app/\(main\)/seasons/\[year\]/\[round\]/
git commit -m "feat: restyle race detail page with Luminous Dark design"
```

---

### Task 10: Records Page

**Files:**
- Modify: `app/(main)/records/page.tsx`

**Step 1: Update records page**

- Section dividers: Replace `bg-f1-red` bar with `bg-glow` bar, and `bg-accent` bar with `bg-text-tertiary` bar (or both `bg-glow`)
- Record cards: `bg-surface-1 border-[rgba(255,255,255,0.06)]`
- Top 3 rows: `bg-surface-2` (keep pattern)
- Non-top-3 hover: `hover:bg-surface-2/50`
- Links: `hover:text-glow` instead of `hover:text-f1-red`
- Rank badges: keep gold/silver/bronze colors
- Remove `fontFamily` overrides

**Step 2: Verify build and commit**

```bash
npm run build
git add app/\(main\)/records/
git commit -m "feat: restyle records page with Luminous Dark design"
```

---

### Task 11: What-If Simulator

**Files:**
- Modify: `app/(main)/what-if/page.tsx`
- Modify: `components/what-if/season-picker.tsx`
- Modify: `components/what-if/scoring-picker.tsx`
- Modify: `components/what-if/simulator-results.tsx`

**Step 1: Update what-if/page.tsx**

- Empty state: `bg-surface-1 border-[rgba(255,255,255,0.06)]`
- Loading state: same

**Step 2: Update season-picker.tsx**

- Select trigger: `bg-surface-2 border-[rgba(255,255,255,0.06)]`
- Select content: `bg-surface-2 border-[rgba(255,255,255,0.06)]`
- Champion text: `text-glow` instead of `text-accent`

**Step 3: Update scoring-picker.tsx**

- Selected system: `border-glow bg-glow-muted` instead of `border-f1-red bg-f1-red/10`
- Unselected: `border-[rgba(255,255,255,0.06)] bg-surface-1 hover:border-[rgba(255,255,255,0.1)]`
- Toggle switch: `bg-glow` when on instead of `bg-f1-red`, `bg-surface-3` when off instead of `bg-border-subtle`

**Step 4: Update simulator-results.tsx**

- Champion banner: `border-glow/30 bg-glow-muted` instead of `border-f1-red/30 bg-f1-red/10`. Trophy: `text-glow`. Champion name: `text-glow font-bold`.
- Table: same treatment as other tables (no alternating rows, hover)
- Position change: `text-success` / `text-danger` instead of `text-green-500` / `text-red-500`
- Top 3 positions: `text-glow` instead of `text-f1-red`
- Team color bars: keep

**Step 5: Verify build and commit**

```bash
npm run build
git add app/\(main\)/what-if/ components/what-if/
git commit -m "feat: restyle what-if simulator with Luminous Dark design"
```

---

### Task 12: Learn Section

**Files:**
- Modify: `app/(main)/learn/page.tsx`
- Modify: `components/learn/topic-card.tsx`
- Modify: `components/learn/difficulty-badge.tsx`

**Step 1: Update learn/page.tsx**

- Remove `fontFamily` overrides
- Intro text: same `text-text-secondary` (new value)

**Step 2: Update topic-card.tsx**

- Card: `bg-surface-1 border-[rgba(255,255,255,0.06)] card-glow`
- Replace `hover:border-accent/40 hover:bg-surface-elevated` with `card-glow` class
- Index number: `text-text-tertiary` instead of `text-text-secondary/40`
- Title hover: `group-hover:text-glow` instead of `group-hover:text-accent`
- Remove `fontFamily` overrides

**Step 3: Update difficulty-badge.tsx**

Read this file first. Replace `text-accent` / `bg-accent/10` references with `text-glow` / `bg-glow-muted`.

**Step 4: Verify build and commit**

```bash
npm run build
git add app/\(main\)/learn/ components/learn/
git commit -m "feat: restyle learn section with Luminous Dark design"
```

---

### Task 13: Global Search-and-Replace Cleanup

**Files:**
- All files in `app/` and `components/`

**Step 1: Find and replace any remaining old token references**

Search across all `.tsx` files for these patterns and replace:
- `text-f1-red` -> `text-glow`
- `bg-f1-red` -> `bg-glow`
- `border-f1-red` -> `border-glow`
- `hover:text-f1-red` -> `hover:text-glow`
- `text-accent` (when used as accent color, not shadcn component) -> `text-glow`
- `bg-surface` (when standalone, not surface-1/2/3) -> `bg-surface-1`
- `bg-surface-elevated` -> `bg-surface-2`
- `border-border-subtle` -> `border-[rgba(255,255,255,0.06)]`
- `var(--font-heading)` -> remove (Inter is heading font by default)
- `var(--font-titillium)` -> remove
- `style={{ fontFamily: "var(--font-titillium)" }}` -> remove entirely
- `style={{ fontFamily: "var(--font-heading)" }}` -> remove entirely

**Step 2: Verify build**

```bash
npm run build
```
Expected: Clean build with zero errors

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete Luminous Dark token migration across all pages"
```

---

### Task 14: Add Motion Animations

**Files:**
- Create: `components/ui/animate-in.tsx`
- Modify: `app/(main)/page.tsx` (add entrance animations)
- Modify: `components/ui/stat-card.tsx` (add number count-up)

**Step 1: Create animate-in.tsx utility component**

```tsx
"use client";

import { motion } from "motion/react";

interface AnimateInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Add entrance animations to home page**

Wrap hero section, section headings, and card grids with `AnimateIn` and `StaggerChildren`/`StaggerItem` for staggered fade-up effect.

**Step 3: Optional - Add count-up animation to stat-card**

Only if time permits. Use a simple count-up effect when numeric values are provided.

**Step 4: Verify build and commit**

```bash
npm run build
git add components/ui/animate-in.tsx app/\(main\)/page.tsx components/ui/stat-card.tsx
git commit -m "feat: add entrance animations and motion utilities"
```

---

### Task 15: Visual QA and Final Polish

**Step 1: Start dev server and check every page**

Run: `npm run dev`

Navigate to each page in the browser and verify:
- [ ] Home page hero gradient renders correctly
- [ ] Header glass effect works
- [ ] All cards have consistent border/surface treatment
- [ ] Team colors display correctly on driver/team cards
- [ ] Tables have no alternating rows, hover works
- [ ] Font is consistently Inter everywhere (no Titillium remnants)
- [ ] All `text-f1-red` has been replaced (no red accents remain)
- [ ] Accent color (#FF6B2C) appears on hover states, active nav, accent elements
- [ ] Stats numbers use monospace font
- [ ] Mobile responsive layout works
- [ ] Mobile nav glass overlay works

**Step 2: Fix any visual issues found**

Address any inconsistencies discovered during QA.

**Step 3: Final production build**

```bash
npm run build
```
Expected: Clean build, all pages statically generated

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: visual QA polish and consistency fixes"
```
