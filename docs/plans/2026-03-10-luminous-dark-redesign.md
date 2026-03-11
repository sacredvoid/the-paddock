# The Paddock - Luminous Dark Redesign

**Date:** 2026-03-10
**Direction:** Apple minimalism + sports analytics + modern product design (Raycast/Apple inspired)
**Approach:** Comprehensive visual overhaul - design system + all pages rebuilt

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#09090B` | Page background (blue-black undertone) |
| `--surface-1` | `#111113` | Cards, panels |
| `--surface-2` | `#1A1A1E` | Elevated surfaces, hover states |
| `--surface-3` | `#232328` | Active/selected states |
| `--border` | `rgba(255,255,255,0.06)` | Subtle dividers |
| `--border-hover` | `rgba(255,255,255,0.10)` | Hover borders |
| `--text-primary` | `#EDEDEF` | Headings, primary content |
| `--text-secondary` | `#8B8B8D` | Labels, descriptions |
| `--text-tertiary` | `#5C5C5E` | Captions, disabled |
| `--accent` | `#FF6B2C` | Primary accent (warm amber) |
| `--accent-glow` | `rgba(255,107,44,0.15)` | Hover glow, focus rings |
| `--accent-muted` | `rgba(255,107,44,0.08)` | Subtle accent backgrounds |
| `--success` | `#34D399` | Position gains, positive stats |
| `--danger` | `#EF4444` | Position losses, DNFs |

Team colors remain the dynamic accent system on detail pages.

## Elevation System

- **Level 0**: Page background, no border
- **Level 1**: `surface-1` bg + `border` 1px (cards, content panels)
- **Level 2**: `surface-1/80%` + `backdrop-blur-xl` + `border-hover` (modals, command palette, dropdowns)
- **Level 3**: `surface-2` + stronger border (tooltips, popovers)

Hover on Level 1: border -> `border-hover`, faint `accent-glow` box-shadow.

## Typography

- **Font**: Inter for all text
- **Mono**: JetBrains Mono for stats/numbers (tabular-nums)
- **Display**: 72px / 1.0 / -0.04em (hero headlines)
- **H1**: 48px / 1.1 / -0.03em
- **H2**: 32px / 1.2 / -0.02em
- **H3**: 24px / 1.3 / -0.01em
- **H4**: 18px / 1.4
- **Body**: 16px / 1.6
- **Small**: 14px / 1.5
- **Caption**: 12px / 1.4 / 0.01em tracking, uppercase for labels

## Spacing & Radius

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Page padding**: 24px mobile, 48px desktop
- **Card padding**: 20px mobile, 24px desktop
- **Section gaps**: 64px between major sections, 32px between related groups
- **Radius**: 6px (badges), 8px (buttons/inputs), 12px (cards), 16px (modals)
- **No shadows by default** - borders define elevation. Glow on hover only.

## Component Patterns

**Cards**: `surface-1` bg, `border` 1px, `radius-lg` (12px). Hover: border brightens, faint `accent-glow` shadow, `scale(1.01)` lift. Team-colored left border on driver/team cards.

**Stat pills**: Monospace number on `accent-muted` bg with `radius-sm`. Inline for quick scanning.

**Data tables**: No alternating rows. Subtle `border-b` between rows. Header in `text-tertiary` uppercase caption style. Hover row gets `surface-2` bg.

**Buttons**: Primary = `accent` bg with slight gradient. Secondary = `surface-2` bg with border. Ghost = transparent with border on hover. All 8px radius.

**Badges**: `surface-2` bg, `border`, `radius-sm`, `caption` type. Team-colored variants: team color at 10% opacity bg + full color text.

**Page headers**: Display/H1 size, `text-primary`, tight tracking. Breadcrumbs above in `caption` style, `text-tertiary`. Subtitle in `text-secondary`.

**Glass panels**: `surface-1` at 80% opacity + `backdrop-blur-xl` for overlays, command palette, mobile nav.

## Motion System

- **Micro** (150ms): Button presses, toggle flips, border color changes
- **Standard** (250ms): Card hover lifts, fade-ins, slide-ins
- **Emphasis** (400ms): Page section reveals, chart draw-ins
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`, spring for bounce
- **Page load**: Staggered fade-up, 50ms delay between elements
- **Card hover**: `scale(1.01)` + glow intensify (150ms)
- **Numbers**: Count-up 800ms on scroll-into-view
- **Charts**: Draw-in 600ms with stagger per data series
- **Page transitions**: Crossfade 200ms

## Page Layouts

### Home
Full-bleed hero with gradient mesh background. Display-size headline ("The Complete F1 Encyclopedia"). Current season standings in glass card. Champion spotlight row. Section previews (drivers/circuits/seasons) as card grids with staggered entrance.

### Drivers Grid
Filter bar at top (glass panel). 3-column card grid (4 on xl). Each card: driver image, name, team badge with team color, key stat (wins).

### Driver Profile
Team-colored header band. Large name in display type. Stat pills row. Career chart (Recharts area chart with gradient fill). Season-by-season table. Teammate comparison section.

### Teams Grid
Team logo, color bar, constructor stats. Same grid pattern as drivers.

### Team Profile
Team-colored header. Stats row. Historical drivers list. Season results timeline.

### Circuits
World map (react-simple-maps) with dot markers that glow on hover. Circuit list below as compact rows. Circuit detail: SVG track map, race history table.

### Seasons
Year picker as responsive grid of pill buttons grouped by decade. Season detail: standings tables with position-change indicators (green/red), race calendar as horizontal timeline.

### Race Detail
Grid vs finish position chart. Lap chart visualization. Pit stop timeline. Fastest laps table.

### Records
Tab-based leaderboards (most wins, poles, championships). Ranked list with position numbers, driver cards, stat highlights.

### What-If
Split layout: controls panel (left/top) with glass card, results table (right/bottom) with position delta badges (green/red).

### Learn
Card grid with difficulty badges, topic icons. Article pages: MDX with Apple-style wide typography, callout boxes, inline data cards.

### Search (Cmd+K)
Glass overlay, large input, categorized results with keyboard navigation.
