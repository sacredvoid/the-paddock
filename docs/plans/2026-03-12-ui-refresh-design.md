# UI Refresh Design - The Paddock

**Date:** 2026-03-12
**Scope:** Bug fixes + Homepage redesign + Listing page touch-ups (Option B)
**Design Direction:** Premium Motorsport texture/details + Editorial Magazine layout/typography
**SuperDesign References:**
- Premium Motorsport: https://p.superdesign.dev/draft/53873086-517a-4453-81dc-06268a4d890e
- Editorial Magazine: https://p.superdesign.dev/draft/440611c0-2182-466c-bbbc-fe3cbbd81bb8

---

## Existing Infrastructure

Already available in the project:
- `motion` (Framer Motion) v12.35
- `AnimateIn`, `StaggerChildren`, `StaggerItem` components (`components/ui/animate-in.tsx`)
- `CountUp` component (`components/ui/count-up.tsx`)
- Tailwind CSS v4, shadcn, Recharts, Lucide icons

---

## 1. Critical Bug Fixes

### 1.1 Drivers/Records Page Visibility Bug

**Root cause:** `AnimateIn` uses `whileInView` with `initial: { opacity: 0 }`. On these pages, the page header area is wrapped in `AnimateIn` but the intersection observer either doesn't fire or fires before hydration completes, leaving content permanently invisible.

**Fix:** Above-the-fold content (page headers, hero stats) must NOT use `whileInView` animations. Use `animate` with a simple delay instead, or render visible immediately. Only below-fold cards should use scroll-triggered entrance.

**Additionally for Drivers:** The hero area has massive whitespace (the "860 total drivers" stat is alone in a huge section). Collapse this into a compact inline header so driver cards appear immediately in the viewport.

### 1.2 Replay Track Dots

**Issue:** Only 1 of 20 driver dots renders on the track SVG at Lap 1.
**Fix:** Debug `ReplayCanvas` component. Likely an issue with frame data interpolation at lap 1 where only one driver has a valid `trackProgress` value. Ensure all drivers in the frame get default positions.

### 1.3 Missing UI Elements

- Add "78" to Circuits stat pill on homepage
- Add breadcrumbs to `/compare` and `/what-if`
- Fix Compare page `<title>` to "Compare | The Paddock"
- Add Compare, Replay, Predict, Create to homepage Explore grid
- Add Create to footer links

---

## 2. New Design Primitives

### 2.1 RacingStripe

Dashed diagonal orange line used as section divider. CSS/SVG repeating pattern.

```
Visual: ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
Color: #ff6b2c at 60% opacity
Height: 4px dashes, 45deg angle
Usage: Between hero and content, between major homepage sections
```

File: `components/ui/racing-stripe.tsx`

### 2.2 GhostText

Oversized faded text rendered behind content for visual emphasis.

```
Font size: 12-20vw (scales with viewport)
Color: white at 3-5% opacity
Position: absolute, behind section content
Usage: Homepage hero ("PADDOCK"), section backgrounds
```

File: `components/ui/ghost-text.tsx`

### 2.3 SectionLabel

Uppercase tracked label for section identification. Replaces the current plain text labels.

```
Style: uppercase, letter-spacing 0.2em, font-size 12px
Color: #ff6b2c (orange)
Optional: leading dot or icon
Usage: "CHAMPIONSHIP WATCH", "FEATURED", "NAVIGATE"
```

File: `components/ui/section-label.tsx`

### 2.4 BentoCard

Card component with 3 visual treatments:

- **dark** (default): Dark bg (#18181b), subtle border, standard content
- **light**: White/cream bg, dark text, stands out against dark page
- **accent**: Solid orange bg (#ff6b2c), white text, used for CTAs/featured items

All variants support hover scale (1.02x) and glow effect.

File: `components/ui/bento-card.tsx`

### 2.5 GridTexture

Subtle grid pattern overlay for hero/section backgrounds.

```
Pattern: Fine lines at ~60px intervals
Color: white at 2-3% opacity
Application: CSS background-image on hero section
```

File: `components/ui/grid-texture.tsx`

### 2.6 StatusBadge

Small pill badge for contextual status.

```
Variants: "live" (green dot + text), "dominant" (orange), "active" (green outline)
Size: Compact, ~24px height
Usage: On champion cards, driver cards, season status
```

File: `components/ui/status-badge.tsx`

---

## 3. Homepage Redesign

### 3.1 Hero Section

Current: Plain centered title, subtitle, stat pills on dark void.

New:
- `GridTexture` overlay on the background
- `GhostText` "PADDOCK" at 15vw behind the main title
- `StatusBadge` "LIVE: 2025 SEASON DATA" above the title (green dot pulse animation)
- Title stays "THE PADDOCK" with current typography
- Subtitle rewording: "The definitive Formula 1 encyclopedia. Decades of telemetry, historical data, and circuit analysis."
- Stat pills use `CountUp` for numbers (860, 186, 78, 75+)

### 3.2 Racing Stripe Divider

`RacingStripe` component between hero and season section.

### 3.3 Season Section

Current label "CURRENT SEASON" becomes `SectionLabel` "CHAMPIONSHIP WATCH".
Right-aligned link becomes "FULL SEASON STANDINGS" in uppercase tracked style.

Champion cards get:
- `StatusBadge` "CURRENT LEADER" on World Champion card
- `StatusBadge` "DOMINANT" on Constructor Champion card
- Faded trophy icon watermark in bottom-right of champion cards
- Points total shown below champion name

Race count card gets:
- Progress bar (orange, showing completed/total ratio)
- "16 COMPLETED / 8 REMAINING" sub-labels

Different Winners card gets:
- Colored team dots below the number (one per unique winner's team color)
- "WINNER DIVERSITY INDEX: HIGH" label

### 3.4 Bento Content Grid

Replace the three stacked sections (Top Active Drivers, Recent Champions, Explore) with a bento grid layout.

```
Layout (approximate):
+---------------------------+-------------+
|                           |   Hall of   |
|   Current Season /        |   Fame      |
|   Championship Outlook    |   (light)   |
|   (large dark card)       +-------------+
|                           |   Circuits  |
|                           |   (light)   |
+------------+--------------+-------------+
|  Records   | Predictions  |   Replay    |
|  (dark)    | (dark)       |  (accent    |
|            |              |   orange)   |
+------------+--------------+-------------+
```

Each card links to its respective page. Cards use `BentoCard` variants. Hover reveals subtle directional arrow.

### 3.5 Top Active Drivers

Keep the horizontal driver card row but add:
- `StaggerChildren` animation (cards appear one by one)
- Hover effect: card lifts slightly, team color glow on border
- `RacingStripe` divider above

### 3.6 Recent Champions

Keep the 2-column year grid but add:
- `StaggerChildren` animation
- `RacingStripe` divider above

### 3.7 Footer

Expand from 2 lines to structured footer:
- Logo + tagline left
- Quick links grid (Drivers, Teams, Circuits, Seasons, Records, Compare, Replay, Predict, Learn, Create)
- GitHub link + data attribution right
- Subtle top border gradient (orange fading out)

---

## 4. Listing Page Touch-ups

### 4.1 Drivers Page

- Remove oversized empty hero section
- Compact header: breadcrumb, title, subtitle, and "860 Total Drivers" stat all in one row
- Active/All/search filters immediately visible
- Driver cards use `StaggerChildren` for entrance
- Card hover: subtle scale + team color border glow

### 4.2 Teams Page

- Already works well structurally
- Add `RacingStripe` divider below stats cards
- Cards use `StaggerChildren` for entrance

### 4.3 Circuits Page

- Add `RacingStripe` below stats and above map
- Circuit cards use `StaggerChildren`

### 4.4 Records Page

- Fix visibility bug (same AnimateIn fix as Drivers)
- Add `SectionLabel` for "DRIVER RECORDS", "CONSTRUCTOR RECORDS"
- Stagger record list entrance animations

### 4.5 Seasons Page

- Add `RacingStripe` between "Recent Seasons" and historical decades
- Already looks good structurally

---

## 5. Global Enhancements

### 5.1 Card Hover Effects

All clickable cards site-wide get:
- `scale(1.02)` on hover with 200ms ease
- Border color brightens on hover
- Subtle box-shadow glow matching the card's accent color

### 5.2 Nav Hover Animation

Animated underline that slides to the hovered nav item (CSS transition on a pseudo-element positioned under the active link).

### 5.3 Above-fold Animation Strategy

- Above-fold content: renders visible immediately, optional subtle fade-in via `animate` (not `whileInView`)
- Below-fold content: `AnimateIn` with `whileInView` (existing component, already works for below-fold)
- Stat numbers: `CountUp` (existing component)
- Card grids: `StaggerChildren` (existing component)

---

## Non-Goals (Deferred)

- Driver detail page overhaul (Phase 4 in audit doc)
- Dark/light theme toggle
- Page transition animations (complex with Next.js App Router)
- Interactive expandable stat cards
- Virtualized driver list (performance, separate concern)
