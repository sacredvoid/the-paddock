# UI Refresh Phase 2 - Design

**Date**: 2026-03-16
**Status**: Approved
**Scope**: Detail pages, interactive tools, bug fixes, impeccable polish

## Overview

Push every page in The Paddock from "functional" to "premium". Phase 1 nailed the homepage and listing pages. Phase 2 targets: detail pages (driver, team, circuit, race), interactive tools (compare, replay, predict, what-if, create), bug fixes (stat counters, compare stub), and a final polish pass.

**Design direction**: Mix of editorial magazine (heroes, team color integration, section rhythm) and data dashboard (dense stats stay dense, but every element gets the design primitive treatment). Use existing primitives (RacingStripe, SectionLabel, StatusBadge, GhostText, GridTexture, BentoCard) aggressively.

---

## Part A: Bug Fixes

### A1. Homepage stat counters showing "0"
The `AnimatedStatPill` CountUp animation fails when the intersection observer doesn't trigger for above-fold content. Fix: use `immediate` prop on the `AnimateIn` wrapper for the stat pills, or ensure values are passed as static props that render immediately.

### A2. Compare page duplicate header
The `/compare` page renders the PageHeader and then the CompareClient also renders its own header. Remove the duplicate from CompareClient or restructure so PageHeader is the single source.

---

## Part B: Detail Page Glow-Up

### B1. Driver Detail (`/drivers/[slug]`)

**Hero treatment:**
- Team color gradient stripe across the top of the identity card (currently just a plain surface-1 box)
- Larger headshot (200px+) with team-color ring instead of plain border
- Driver number rendered as GhostText watermark behind the identity section
- StatusBadge for "Active" (green pulse) or "Historic" (default) replacing the plain Badge
- RacingStripe divider between identity section and stats

**Stats grid:**
- Replace hardcoded `teamColor` values with actual team color from the driver's current/last team
- Add SectionLabel "Career Statistics" above the grid
- Stats that are exceptional (championships > 0, wins > 50) get a subtle glow highlight

**Career Overview:**
- RacingStripe between stats grid and career overview
- SectionLabel "Career Overview" replacing plain h2
- Season chips get hover effects with team color highlight

### B2. Team Detail (`/teams/[slug]`)

**Hero treatment:**
- Full-width team color accent bar (not just a tiny 32px bar)
- Logo displayed larger (96px) with team color ring
- StatusBadge for Active/Historic
- GhostText with team abbreviation behind hero area

**Stats + drivers:**
- SectionLabel for each section
- RacingStripe dividers between sections
- Performance Rates section: use horizontal progress bars with team color fill instead of plain text percentages
- Top Drivers list: add rank medals (gold/silver/bronze) for top 3

### B3. Circuit Detail (`/circuits/[slug]`)

**Track layout:**
- Larger display area with GridTexture background behind the SVG
- Subtle glow effect on the track outline (drop-shadow with glow color)

**Stats + location:**
- SectionLabel for sections
- RacingStripe between track display and stats
- "Races Hosted" stat gets the accent treatment (larger, glow color)

### B4. Race Detail (`/seasons/[year]/[round]`)

**Header area:**
- Winner highlighted with StatusBadge "Race Winner" on the winning StatCard
- Team color integration in stat cards (winner's team color)
- SectionLabel for each section (Race Results, Qualifying, Pit Stops)
- RacingStripe between the stats row and the results table

**Tables:**
- Podium positions (1-3) get subtle background highlights
- Position 1 row gets a left glow border effect
- DNF rows get a more visible danger styling

---

## Part C: Interactive Tools Polish

### C1. Compare page
- Fix duplicate header
- Add SectionLabel and RacingStripe to structure the page
- Ensure the chart area has proper loading skeleton

### C2. Replay page
- SectionLabel "Select Race" above the dropdowns
- RacingStripe between selector and visualization
- Loading state with proper skeleton (not just text)

### C3. Predict page
- SectionLabel and RacingStripe treatment
- Loading skeleton for the model loading state
- StatusBadge "AI Model" indicator

### C4. What-If page
- Add PageHeader with breadcrumbs (currently missing)
- SectionLabel treatment
- RacingStripe dividers

### C5. Create page
- SectionLabel treatment
- RacingStripe dividers

### C6. Learn page
- Add RacingStripe between difficulty sections
- SectionLabel treatment for "Getting Started", "Going Deeper", "F1 Drama"

---

## Part D: Impeccable Polish Pass

After all structural changes, run these impeccable passes:

1. **animate** - Add entrance animations to detail page sections (staggered fade-in for stat cards, subtle slide for hero elements)
2. **polish** - Fix alignment, spacing consistency, and detail issues across all modified pages
3. **bolder** - Push visual impact on hero sections of detail pages (team colors more prominent, numbers more dramatic)

---

## Technical Approach

- All changes are incremental enhancements to existing components
- No new dependencies
- Use existing design primitives (no new component creation needed)
- Server components stay server components
- All changes are visual/CSS, no data layer changes
