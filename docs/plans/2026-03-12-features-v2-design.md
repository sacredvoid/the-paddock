# The Paddock - Features V2 Design

**Date**: 2026-03-12
**Status**: Approved

## Overview

Four new features for The Paddock, built independently and shipped incrementally.

Build order:
1. Learn F1 Articles (content, no code complexity)
2. Social Sharing Cards (Satori image generation)
3. Race Replay Animation (2D canvas visualization)
4. Race Prediction Engine (browser ML with ONNX)

---

## Feature 1: Learn F1 Articles

### New Articles (7 topics)

| File | Title | Difficulty | Order |
|------|-------|-----------|-------|
| aerodynamics.mdx | How F1 Aerodynamics Work | intermediate | 9 |
| power-units.mdx | Engine & Power Unit Basics | intermediate | 10 |
| reading-telemetry.mdx | Reading Telemetry Data | intermediate | 11 |
| weather.mdx | Weather's Impact on Racing | beginner | 12 |
| driver-pathway.mdx | Driver Development Pathway | beginner | 13 |
| business-of-f1.mdx | The Business of F1 | intermediate | 14 |
| famous-rivalries.mdx | Famous Rivalries | intermediate | 15 |

### New "Drama" Category (8 articles)

A third tier alongside beginner/intermediate. Mix of incident-specific, era-based, and thematic.

| File | Title | Style |
|------|-------|-------|
| crashgate.mdx | Crashgate: Singapore 2008 | Incident |
| spygate.mdx | Spygate: The McLaren-Ferrari Scandal | Incident |
| senna-prost.mdx | The Senna-Prost Wars | Era-based |
| multi-21.mdx | Multi 21: Vettel's Betrayal | Incident |
| abu-dhabi-2021.mdx | Abu Dhabi 2021: The Controversial Finale | Incident |
| schumacher-controversies.mdx | The Schumacher Controversies | Era-based |
| team-orders-gone-wrong.mdx | Team Orders Gone Wrong | Thematic |
| championship-deciders.mdx | Championship Deciders That Shocked the World | Thematic |

### Code Changes
- 15 new MDX files in `content/learn/`
- Update `app/(main)/learn/page.tsx` to render "Drama" section
- Each article 800-1200 words, matching existing style

---

## Feature 2: Social Sharing Cards

### Two Modes

**A) "Share This" buttons on existing pages**
- Driver detail pages, head-to-head comparison, race results, compare/telemetry page
- Modal with card preview + download/copy buttons
- Server-side generation via API route

**B) Dedicated "Create Post" page (`/create`)**
- Card types: Driver Stat Card, Head-to-Head Comparison, Race Result Summary, Season Standings Snapshot
- Select drivers/race/season from dropdowns
- Toggle dark/light theme
- Live preview + "Download PNG"

### Technical Approach
- API routes at `app/api/og/[type]/route.tsx` returning `ImageResponse`
- Card types: `driver`, `head-to-head`, `race-result`, `standings`
- React components rendered by Satori (JSX to SVG to PNG)
- Sizes: 1080x1080px (Instagram) + 1200x630px (Twitter/OG)
- Dark mode: Luminous Dark palette. Light mode: white/light gray inverted
- "The Paddock" watermark on every card
- No new dependencies (ImageResponse is built into Next.js)
- Stats shown: wins, poles, podiums, career points, best finish (not WDC - most drivers have 0)

---

## Feature 3: Race Replay Animation

### Page: `/replay`

### UI Layout
- **Left 70%**: Canvas-rendered 2D track with stylized car icons (team-colored, driver abbreviation)
- **Right 30%**: Broadcast-style leaderboard (position, driver code, team color, gap to leader, tire compound, pit count)
- **Bottom bar**: Play/pause, 1x/2x/4x/8x speed, lap scrubber, restart
- Gap lines between cars showing time delta
- Safety car periods: yellow overlay on track + leaderboard

### Technical Approach
- HTML Canvas for track + car rendering
- Track coordinates from circuit SVG paths, normalized to canvas
- Cars interpolate between lap data points for smooth movement
- Race selector: year + round dropdowns
- Data: existing `data/telemetry/` (2023-2025) with per-lap position, lap time, tire compound, pit stops
- No heavy dependencies - native canvas + maybe an easing utility

### Scope
- 2023-2025 races only (lap-level telemetry required)
- Older races show "replay not available"

---

## Feature 4: Race Prediction Engine

### Page: `/predict`

### Default View - Pre-Race Predictions
- Select any 2014-2025 race from dropdown
- Predicted finishing order as ranked list with probability bars
- Win %, Podium %, Points Finish % per driver
- Overall prediction confidence indicator

### Interactive "What If" Mode
- Toggles: Rain (yes/no), Safety Car likelihood (low/medium/high)
- Sliders: Driver form adjustment (per driver, -2 to +2)
- Circuit type auto-set from selected race
- Real-time prediction updates as user tweaks
- Visual diff from baseline prediction

### ML Pipeline
- Train XGBoost on 2014-2025 race data in Python
- Features: grid position, constructor strength, driver rolling form (5-race avg), circuit type, weather, historical circuit performance
- Export to ONNX (~500KB)
- Client-side inference via `onnxruntime-web`
- Training script: `scripts/train_prediction_model.py`
- Model file: `public/models/race-predictor.onnx`
- New dependency: `onnxruntime-web`

### Scope
- Fan model for entertainment, clear disclaimer
- 2014-2025 hybrid era data only
- Probabilistic outputs, not deterministic
