# The Paddock - Design Document

**Date:** 2026-03-10
**Status:** Approved
**Type:** Full F1 encyclopedia website

## Overview

The Paddock is a free, static-first F1 encyclopedia website hosted on Vercel. It serves both new fans (Drive to Survive converts) and data nerds with progressive disclosure - welcoming surface, deep rabbit holes underneath.

**Aesthetic:** Dark carbon fiber pit garage - near-black backgrounds, F1 red accents, team-colored highlights, monospace stat numbers.

## Architecture

Static-first Next.js 15 App Router. All pages statically generated at build time from JSON data files. No database, no runtime API calls for historical data. Python build script fetches from Jolpica + OpenF1 + F1DB + FastF1 before each build. MDX for long-form content.

### Data Flow

```
Jolpica F1 (1950+) ─┐
OpenF1 (2023+)      ─┤─> Python build script ─> /data/*.json ─> Next.js SSG ─> Vercel CDN
F1DB (database)     ─┤                         /content/*.mdx
FastF1 (telemetry)  ─┘
```

### Build Triggers

- GitHub Action cron: every Monday 6am UTC (after race weekends)
- Manual Vercel deploy hook for mid-week updates
- Content changes (MDX edits) trigger standard Vercel git deploy

### Project Structure

```
/app
  /(main)
    page.tsx                          # Home / landing
    /drivers/page.tsx                 # All drivers grid
    /drivers/[slug]/page.tsx          # Driver profile
    /teams/page.tsx                   # All teams grid
    /teams/[slug]/page.tsx            # Team profile + family tree
    /circuits/page.tsx                # World map view
    /circuits/[slug]/page.tsx         # Circuit detail
    /seasons/page.tsx                 # Season picker
    /seasons/[year]/page.tsx          # Season overview
    /seasons/[year]/[round]/page.tsx  # Individual race analysis
    /records/page.tsx                 # All-time records
    /learn/page.tsx                   # F1 101 index
    /learn/[topic]/page.tsx           # Individual lesson (MDX)
    /what-if/page.tsx                 # What-if simulator
    /family-tree/page.tsx             # Constructor lineage
/data
  drivers.json
  teams.json
  circuits.json
  records.json
  /seasons/2024.json
  /telemetry/...
/content
  /learn/*.mdx
  /drivers/*.mdx
  /circuits/*.mdx
/scripts
  fetch-data.py
/components
  /ui                                # shadcn components
  /charts                            # Recharts wrappers
  /track                             # SVG track components
  /animations                        # Motion components
```

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Framework | Next.js 15 (App Router) | Free |
| Styling | Tailwind CSS v4 + shadcn/ui | Free |
| Charts | Recharts | Free (MIT) |
| Maps | react-simple-maps | Free (MIT) |
| Animation | Motion (Framer Motion) | Free (MIT) |
| Search | Fuse.js + shadcn Command (Cmd+K) | Free (MIT) |
| Track visuals | SVGs from f1-circuits + F1-Track-Layouts-SVG | Free (MIT/CC0) |
| Data | Static JSON + MDX in repo | Free |
| Deployment | Vercel Hobby | Free |

## Data Sources

| Source | Coverage | Used For |
|--------|----------|----------|
| Jolpica F1 API | 1950-present | Historical results, standings, drivers, circuits |
| OpenF1 API | 2023+ | Telemetry, lap times, pit stops, team radio, weather |
| F1DB (GitHub) | 1950-present | Complete database as JSON/SQLite, circuit SVGs |
| FastF1 (Python) | Telemetry 2018+, results 1950+ | Pre-generate analysis data at build time |
| TracingInsights Archive | 2018+ | Bulk CSV telemetry dumps |

## Performance Strategy

### Data Layer
- All historical data (1950-2024) baked into JSON at build time - zero runtime API calls
- Current season data uses ISR: `revalidate: 3600` (hourly) for standings, `revalidate: 86400` (daily) for schedule
- Rebuild only when new race data drops (Monday after race weekends)

### Asset Optimization
- SVG track maps inlined as React components (no network requests)
- `next/image` with AVIF/WebP auto-conversion, proper `sizes` attributes, blur placeholders
- Self-hosted Titillium Web + Inter via `next/font` (zero layout shift)
- Code splitting per route, heavy chart components lazy-loaded with `next/dynamic`
- Tree-shake Recharts (import individual components)

### Caching Headers
- Static pages: `Cache-Control: public, max-age=31536000, immutable`
- ISR pages: `s-maxage=3600, stale-while-revalidate=86400`
- JSON data files: fingerprinted filenames for cache busting

### Runtime Performance
- React Server Components for all data-heavy pages (zero client JS)
- Client components only for interactivity (charts, search, what-if simulator)
- `Suspense` boundaries with skeleton loaders around chart sections
- Fuse.js search index pre-built at build time, loaded lazily on first Cmd+K
- Intersection Observer for scroll-triggered animations
- GPU-accelerated animations via `transform` and `will-change`

### Bundle Targets
- First load JS under 80KB per route
- LCP under 1.2s, CLS 0, INP under 200ms
- Lighthouse 95+ across all pages

## Visual Design

### Color System

```
Background:        #0A0A0A (near-black)
Surface:           #141414 (cards, panels)
Surface elevated:  #1E1E1E (hover states, modals)
Border:            #2A2A2A (subtle dividers)
Primary:           #E10600 (F1 red - CTAs, active states)
Accent:            #00D2BE (teal - data highlights, links)
Text primary:      #F5F5F5
Text secondary:    #888888
```

### Design Principles
- Carbon fiber texture via CSS repeating-conic-gradient (pure CSS, no images)
- Subtle grid/dot pattern on backgrounds
- Cards with 1px #2A2A2A borders, no heavy shadows
- Team-colored accents on driver/team pages from data
- Monospace numbers with tabular-nums for stats alignment
- Micro-interactions: cards lift on hover with Motion, stats count up on scroll
- Dark mode only

### Typography
- Headings: Titillium Web (close to F1's official font)
- Body: Inter
- Numbers/Stats: JetBrains Mono or Geist Mono

## Features

### 1. Home Page
- Hero with animated SVG track drawing (path animation)
- "Next Race" countdown card with circuit mini-map
- Current championship standings snapshot (top 5 drivers + constructors)
- Featured stats ticker (animated number counters)
- Quick links grid to all sections

### 2. Drivers
- Grid of driver cards with team-colored borders
- Filterable by era, team, nationality, active/retired
- **Profile page:** Career stats radar chart, season-by-season points line chart, teammate battle history, head-to-head comparison tool (pick any 2 drivers), career timeline, fastest laps by circuit heatmap

### 3. Circuits
- World map (react-simple-maps) with circuit markers, filterable by continent/country
- **Detail page:** Full SVG track map with corner names/numbers, track records table, lap record progression, all-time winners, key facts (length, corners, DRS zones)

### 4. Seasons
- Year picker grid (1950-present, color-coded by champion's team)
- **Season page:** Race calendar with results, animated championship progression (racing-bars style), standings tables, key moments, inter-team battle summary

### 5. Race Analysis (telemetry data: 2018+)
- Lap chart (position by lap bump chart)
- Tire strategy Gantt chart (horizontal bars with compound colors)
- Pit stop timeline with durations
- Gap-to-leader progression
- Safety car / VSC / red flag markers on timeline

### 6. Records & Stats
- All-time leaderboards: wins, poles, podiums, fastest laps, championships
- Derived stats: consistency rating, wet weather index, qualifying vs race delta, overtaking stats, circuit specialists
- Sortable, filterable tables with sparkline trends
- Era comparison tool

### 7. F1 101 (Learn)
- Progressive disclosure: beginner -> intermediate -> advanced
- MDX articles with embedded interactive diagrams
- Topics: race weekend structure, tire compounds, DRS/overtake mode, flags, points system, pit strategy, regulations timeline, safety evolution
- Animated diagrams (DRS flap opening, tire degradation curve)

### 8. Constructor Family Tree
- Full-screen interactive tree/timeline visualization
- Every team traced back to origins (1950-2026)
- Click any node to see era stats, drivers, results
- Color-coded by team identity at each point

### 9. What-If Simulator
- Pick any historical season
- Toggle alternate scoring systems (pre-2003, modern, double points, custom)
- Toggle "remove DNFs" for pure pace rankings
- Real-time result updates as parameters change
- Shareable URLs for each configuration
- Client-side computation (all data in JSON)

### 10. Global Features
- Cmd+K search (Fuse.js + shadcn Command) across all entities
- Mobile-first responsive design
- Dark mode only
- Share buttons with generated OG images

## Open Source Assets

| Resource | License | Usage |
|----------|---------|-------|
| bacinger/f1-circuits (300 stars) | MIT | GeoJSON track coordinates |
| MasterPlay007/F1-Track-Layouts-SVG | CC0 | Drop-in SVG track maps |
| joscaz/f1-tracks-animejs | MIT | Track drawing animation reference |
| hatemhosny/racing-bars (121 stars) | MIT | Championship progression animations |
| LottieFiles | Free tier | Checkered flags, speedometer animations |

## Build Waves

All features ship together, but implementation order is:

1. **Foundation:** Project setup, data pipeline, design system, layout shell
2. **Encyclopedia core:** Drivers, Circuits, Seasons, Records, Home
3. **Visual features:** Race Analysis, Constructor Family Tree, World Map
4. **Interactive:** What-If Simulator, F1 101 Learn section
5. **Polish:** Search, animations, OG images, performance audit
