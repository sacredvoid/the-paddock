# Features V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 new features to The Paddock: Learn F1 articles (15 new MDX), social sharing cards, race replay animation, and a browser-based race prediction engine.

**Architecture:** Each feature is independent with no cross-dependencies. Build order is Learn Articles -> Sharing Cards -> Race Replay -> Prediction Engine (simplest to most complex). All features use the existing Luminous Dark design system and static data pipeline.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, HTML Canvas, Satori/ImageResponse, ONNX Runtime Web, XGBoost (Python training)

---

## Task 0: Update navigation and shared infrastructure

**Files:**
- Modify: `lib/navigation.ts`
- Modify: `lib/mdx.ts` (TopicMeta type)
- Modify: `components/learn/difficulty-badge.tsx`
- Modify: `app/(main)/learn/page.tsx`

**Step 1: Add new nav items**

In `lib/navigation.ts`, add Replay and Predict nav items:

```typescript
export const NAV_ITEMS = [
  { label: "Drivers", href: "/drivers" },
  { label: "Teams", href: "/teams" },
  { label: "Circuits", href: "/circuits" },
  { label: "Seasons", href: "/seasons" },
  { label: "Records", href: "/records" },
  { label: "Compare", href: "/compare" },
  { label: "Replay", href: "/replay" },
  { label: "Predict", href: "/predict" },
  { label: "Learn F1", href: "/learn" },
  { label: "What If?", href: "/what-if" },
  { label: "Family Tree", href: "/family-tree" },
] as const;
```

**Step 2: Add "drama" difficulty level**

In `lib/mdx.ts`, update the `TopicMeta` interface:

```typescript
difficulty: "beginner" | "intermediate" | "advanced" | "drama";
```

In `components/learn/difficulty-badge.tsx`, add drama config:

```typescript
drama: {
  label: "Drama",
  className: "bg-red-500/15 text-red-400 border-red-500/30",
},
```

Update the type:

```typescript
interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced" | "drama";
}
```

**Step 3: Add Drama section to learn page**

In `app/(main)/learn/page.tsx`, add a filter for drama topics and render a third section after intermediate:

```tsx
const dramaTopics = topics.filter((t) => t.difficulty === "drama");
```

Add a new `<section>` block after the intermediate section:

```tsx
{dramaTopics.length > 0 && (
  <section className="mb-12">
    <AnimateIn direction="up">
      <h2 className="mb-6 text-2xl font-bold text-text-primary">
        F1 Drama
      </h2>
      <p className="mb-6 text-sm text-text-secondary">
        The controversies, betrayals, and scandals that shaped Formula 1.
      </p>
    </AnimateIn>
    <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.07}>
      {dramaTopics.map((topic, i) => (
        <StaggerItem key={topic.slug}>
          <TopicCard
            topic={topic}
            index={beginnerTopics.length + intermediateTopics.length + i}
          />
        </StaggerItem>
      ))}
    </StaggerChildren>
  </section>
)}
```

**Step 4: Commit**

```bash
git add lib/navigation.ts lib/mdx.ts components/learn/difficulty-badge.tsx "app/(main)/learn/page.tsx"
git commit -m "feat: add drama difficulty tier, replay/predict nav items"
```

---

## Task 1: Write 7 new Learn F1 articles

**Files:**
- Create: `content/learn/aerodynamics.mdx`
- Create: `content/learn/power-units.mdx`
- Create: `content/learn/reading-telemetry.mdx`
- Create: `content/learn/weather.mdx`
- Create: `content/learn/driver-pathway.mdx`
- Create: `content/learn/business-of-f1.mdx`
- Create: `content/learn/famous-rivalries.mdx`

Each file follows the existing MDX format:

```markdown
---
title: "Article Title"
description: "One-line description for the card."
difficulty: "beginner" or "intermediate"
order: N
---

# Article Title

800-1200 words of content...
```

**Content guidelines:**
- Match the existing tone: informative, direct, no fluff, aimed at newcomers
- Use markdown headers (##, ###) to break into scannable sections
- Bold key terms on first use
- Keep paragraphs short (3-4 sentences max)
- Include concrete examples and numbers where possible
- No em dashes

**Article assignments:**

| File | Title | Difficulty | Order | Key Sections |
|------|-------|-----------|-------|--------------|
| aerodynamics.mdx | How F1 Aerodynamics Work | intermediate | 9 | Downforce basics, wings (front/rear), ground effect/floor, DRS mechanism, dirty air/following, aero development |
| power-units.mdx | Engine & Power Unit Basics | intermediate | 10 | V6 turbo hybrid, MGU-K, MGU-H, energy store, fuel flow limit, ICE vs full PU, manufacturer vs customer teams |
| reading-telemetry.mdx | Reading Telemetry Data | intermediate | 11 | Speed traces explained, throttle/brake inputs, gear usage, tire temps, how engineers read data, what fans can learn from public telemetry. Tie into /compare feature. |
| weather.mdx | Weather's Impact on Racing | beginner | 12 | Dry/intermediate/wet tire selection, when races go wet, red flags, formation laps behind safety car, track evolution, drying lines, rain specialists |
| driver-pathway.mdx | Driver Development Pathway | beginner | 13 | Karting, F4, F3, F2, super license points system, junior academies (Ferrari FDA, Red Bull junior team, Mercedes junior programme), reserve/test drivers, pay drivers |
| business-of-f1.mdx | The Business of F1 | intermediate | 14 | FOM revenue split, team budgets and budget cap, sponsorship tiers, hosting fees, driver salaries, Liberty Media, Concorde Agreement, new team entry process |
| famous-rivalries.mdx | Famous Rivalries | intermediate | 15 | Senna vs Prost, Schumacher vs Hill, Hamilton vs Rosberg, Hamilton vs Verstappen, Lauda vs Hunt. Brief overview format linking to drama articles for deep dives. |

**Step 1: Write all 7 articles**

Create each file with full content.

**Step 2: Verify build**

```bash
npx next build 2>&1 | grep -E "learn|error"
```

Expected: learn/[topic] shows 15+ paths, no errors.

**Step 3: Commit**

```bash
git add content/learn/
git commit -m "feat: add 7 new Learn F1 articles (aerodynamics, power units, telemetry, weather, driver pathway, business, rivalries)"
```

---

## Task 2: Write 8 Drama articles

**Files:**
- Create: `content/learn/crashgate.mdx`
- Create: `content/learn/spygate.mdx`
- Create: `content/learn/senna-prost.mdx`
- Create: `content/learn/multi-21.mdx`
- Create: `content/learn/abu-dhabi-2021.mdx`
- Create: `content/learn/schumacher-controversies.mdx`
- Create: `content/learn/team-orders-gone-wrong.mdx`
- Create: `content/learn/championship-deciders.mdx`

All use `difficulty: "drama"` in frontmatter.

| File | Title | Order | Style | Key Content |
|------|-------|-------|-------|-------------|
| crashgate.mdx | Crashgate: Singapore 2008 | 16 | Incident | Renault ordering Piquet Jr to crash, the investigation, Briatore/Symonds bans, aftermath |
| spygate.mdx | Spygate: The McLaren-Ferrari Scandal | 17 | Incident | 2007, Nigel Stepney leaking Ferrari dossier to Mike Coughlan, $100M fine, constructor disqualification |
| senna-prost.mdx | The Senna-Prost Wars | 18 | Era | 1988-1993, McLaren teammates to bitter enemies, Suzuka 1989 & 1990 collisions, Adelaide 1993, legacy |
| multi-21.mdx | Multi 21: Vettel's Betrayal | 19 | Incident | 2013 Malaysian GP, Red Bull team orders, Vettel ignoring call, Webber's fury, "Multi 21 Seb" |
| abu-dhabi-2021.mdx | Abu Dhabi 2021: The Controversial Finale | 20 | Incident | Latifi crash, Masi's safety car restart, one-lap shootout, Hamilton vs Verstappen, FIA investigation, rule changes |
| schumacher-controversies.mdx | The Schumacher Controversies | 21 | Era | Adelaide 1994 (Hill collision), Jerez 1997 (Villeneuve block, DSQ from championship), team orders Austria 2002, parking at Rascasse Monaco 2006 |
| team-orders-gone-wrong.mdx | Team Orders Gone Wrong | 22 | Thematic | Austria 2002 (Ferrari), Germany 2010 (Ferrari "Fernando is faster"), Malaysia 2013 (Red Bull), Russia 2018 (Mercedes), Brazil 2022 (Red Bull/Perez) |
| championship-deciders.mdx | Championship Deciders That Shocked the World | 23 | Thematic | 1976 (Lauda's comeback), 1986 (Prost tire blowout at Adelaide), 1994 (Schumacher-Hill), 2008 (Glock/Hamilton last corner), 2010 (4-way battle), 2021 (Abu Dhabi) |

**Content guidelines:**
- Same tone as other articles but more narrative-driven
- Set the scene: who, what, when, where, stakes
- Include the key moments/quotes
- Explain the aftermath and lasting impact
- 800-1200 words each

**Step 1: Write all 8 drama articles**

**Step 2: Verify build**

```bash
npx next build 2>&1 | grep -E "learn|error"
```

Expected: learn/[topic] shows 23+ paths.

**Step 3: Commit**

```bash
git add content/learn/
git commit -m "feat: add 8 F1 Drama articles (crashgate, spygate, senna-prost, multi-21, abu-dhabi-2021, schumacher, team-orders, championship-deciders)"
```

---

## Task 3: Social sharing cards - API routes

**Files:**
- Create: `app/api/og/driver/route.tsx`
- Create: `app/api/og/head-to-head/route.tsx`
- Create: `app/api/og/race-result/route.tsx`
- Create: `app/api/og/standings/route.tsx`
- Create: `lib/og-utils.ts`

**Step 1: Create shared OG utilities**

`lib/og-utils.ts` - shared constants and helpers for all card types:

```typescript
// Card dimensions
export const CARD_SIZES = {
  square: { width: 1080, height: 1080 },   // Instagram
  landscape: { width: 1200, height: 630 },  // Twitter/OG
} as const;

// Theme palettes
export const THEMES = {
  dark: {
    bg: "#0C0C0E",
    surface: "#16161A",
    border: "rgba(255,255,255,0.06)",
    textPrimary: "#F5F5F7",
    textSecondary: "#8E8E93",
    glow: "#FF6B2C",
  },
  light: {
    bg: "#FFFFFF",
    surface: "#F5F5F7",
    border: "rgba(0,0,0,0.08)",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    glow: "#FF6B2C",
  },
} as const;

export type ThemeMode = keyof typeof THEMES;
export type CardSize = keyof typeof CARD_SIZES;
```

**Step 2: Create driver card API route**

`app/api/og/driver/route.tsx` - generates a single driver stat card.

Query params: `?slug=lewis-hamilton&theme=dark&size=square`

Uses `ImageResponse` from `next/og`. Renders driver name, photo (via URL), nationality, and key stats (wins, poles, podiums, career points, best finish, podium rate) in a styled card layout with "THE PADDOCK" branding.

**Step 3: Create head-to-head card API route**

`app/api/og/head-to-head/route.tsx`

Query params: `?driver1=lewis-hamilton&driver2=max-verstappen&theme=dark&size=square`

Two-column comparison layout. Driver photos, names, team colors. Stat rows: wins, poles, podiums, career points, best finish, podium rate. Winning stat highlighted in glow color.

**Step 4: Create race result card API route**

`app/api/og/race-result/route.tsx`

Query params: `?year=2024&round=1&theme=dark&size=square`

Shows race name, circuit, date, top 3 drivers with positions and times, "THE PADDOCK" branding.

**Step 5: Create standings card API route**

`app/api/og/standings/route.tsx`

Query params: `?year=2024&theme=dark&size=square`

Shows top 10 in championship standings with points bars.

**Step 6: Verify all routes return images**

```bash
npx next dev &
# Test each route in browser
curl -o test.png "http://localhost:3000/api/og/driver?slug=lewis-hamilton&theme=dark&size=square"
file test.png  # should say PNG image
```

**Step 7: Commit**

```bash
git add lib/og-utils.ts app/api/og/
git commit -m "feat: add OG image API routes for driver, head-to-head, race-result, standings cards"
```

---

## Task 4: Social sharing cards - Share buttons on existing pages

**Files:**
- Create: `components/ui/share-button.tsx`
- Create: `components/ui/share-modal.tsx`
- Modify: `app/(main)/drivers/[slug]/page.tsx`
- Modify: `app/(main)/seasons/[year]/[round]/page.tsx`
- Modify: `components/compare/compare-client.tsx`

**Step 1: Create ShareButton component**

A button that opens the share modal. Props: `cardType`, `params` (the query params for the OG API), `label`.

```tsx
"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./share-modal";

interface ShareButtonProps {
  cardType: "driver" | "head-to-head" | "race-result" | "standings";
  params: Record<string, string>;
  label?: string;
}
```

**Step 2: Create ShareModal component**

Modal with:
- Card preview (rendered via `<img>` pointing to the API route)
- Theme toggle (dark/light)
- Size toggle (square/landscape)
- "Download PNG" button (fetches the image and triggers download)
- "Copy Link" button (copies the OG image URL)

**Step 3: Add share button to driver detail page**

In `app/(main)/drivers/[slug]/page.tsx`, add `<ShareButton cardType="driver" params={{ slug }} />` next to the Compare link.

**Step 4: Add share button to race results page**

In `app/(main)/seasons/[year]/[round]/page.tsx`, add share button in the race header area.

**Step 5: Add share button to compare page**

In `components/compare/compare-client.tsx`, add share button that generates a head-to-head card for the currently selected drivers.

**Step 6: Verify**

- Open driver page, click Share, see card preview, download works
- Toggle dark/light, image updates
- Toggle square/landscape, image updates

**Step 7: Commit**

```bash
git add components/ui/share-button.tsx components/ui/share-modal.tsx "app/(main)/drivers/[slug]/page.tsx" "app/(main)/seasons/" components/compare/compare-client.tsx
git commit -m "feat: add share buttons to driver, race, and compare pages"
```

---

## Task 5: Social sharing cards - Create Post page

**Files:**
- Create: `app/(main)/create/page.tsx`
- Create: `components/create/create-client.tsx`

**Step 1: Create the /create page**

Server component with Suspense wrapper, similar to compare page pattern.

**Step 2: Create the client component**

`components/create/create-client.tsx` - interactive card builder:

- **Card type selector**: tabs or buttons for Driver / Head-to-Head / Race Result / Standings
- **Dynamic form**: based on selected type, show relevant dropdowns (driver picker, year/round picker)
- **Theme toggle**: dark/light switch
- **Size toggle**: square (Instagram) / landscape (Twitter)
- **Live preview**: renders the card via `<img src="/api/og/...">` with current params
- **Download button**: fetches image blob and triggers download
- **Copy link button**: copies shareable URL

**Step 3: Add "Create" to navigation**

Already handled in Task 0 if desired, or add a link in the header. Since nav is already crowded, add it as a secondary CTA button in the header rather than a nav item.

**Step 4: Verify**

- Select each card type, pick data, see preview update
- Download works for both themes and sizes
- All dropdowns populate correctly

**Step 5: Commit**

```bash
git add "app/(main)/create/" components/create/
git commit -m "feat: add Create Post page for generating shareable F1 graphics"
```

---

## Task 6: Race replay - Track path extraction and data layer

**Files:**
- Create: `lib/replay.ts`
- Create: `lib/track-paths.ts`

**Step 1: Create track path utilities**

`lib/track-paths.ts` - hardcoded track coordinate arrays for each circuit that has telemetry data (2023-2025 circuits). Each track is an array of `{x, y}` points normalized to 0-1 range, derived from the circuit SVG paths.

For circuits without detailed SVG path data, use simplified oval/rectangle approximations.

**Step 2: Create replay data layer**

`lib/replay.ts` - functions to transform telemetry data into replay frames:

```typescript
export interface ReplayFrame {
  lap: number;
  timestamp: number; // ms into race
  drivers: {
    id: string;
    abbreviation: string;
    teamId: string;
    position: number;
    trackProgress: number; // 0-1 along track path
    compound: string;
    pitStops: number;
    gapToLeader: number; // seconds
    status: "racing" | "pit" | "retired";
  }[];
  safetyCar: boolean;
}

export function buildReplayFrames(telemetry: TelemetryData): ReplayFrame[];
export function interpolateFrame(frames: ReplayFrame[], timeMs: number): ReplayFrame;
```

The `buildReplayFrames` function converts per-lap telemetry into a frame array. The `interpolateFrame` function smoothly interpolates between laps for animation.

**Step 3: Commit**

```bash
git add lib/replay.ts lib/track-paths.ts
git commit -m "feat: add replay data layer and track path utilities"
```

---

## Task 7: Race replay - Canvas renderer and UI

**Files:**
- Create: `components/replay/replay-canvas.tsx`
- Create: `components/replay/replay-leaderboard.tsx`
- Create: `components/replay/replay-controls.tsx`
- Create: `components/replay/replay-client.tsx`
- Create: `app/(main)/replay/page.tsx`

**Step 1: Create ReplayCanvas component**

`components/replay/replay-canvas.tsx` - HTML Canvas component that:
- Draws the track outline (white/gray line on dark background)
- Renders team-colored car dots with 3-letter abbreviation labels
- Cars move along the track path based on `trackProgress`
- Cars in pit show moving through a pit lane path
- Safety car periods: track outline turns yellow
- Retired cars shown as faded/gray

Uses `useRef` for canvas, `requestAnimationFrame` for smooth rendering.

**Step 2: Create ReplayLeaderboard component**

`components/replay/replay-leaderboard.tsx` - right-side panel:
- Position number
- Driver abbreviation with team color bar
- Gap to leader (formatted as +X.XXXs)
- Tire compound indicator (colored circle: red=SOFT, yellow=MEDIUM, white=HARD, green=INTERMEDIATE, blue=WET)
- Pit stop count icon
- Current lap / total laps at top
- Highlights position changes with brief flash animation

**Step 3: Create ReplayControls component**

`components/replay/replay-controls.tsx` - bottom bar:
- Play/Pause button
- Speed buttons: 1x, 2x, 4x, 8x
- Lap progress bar (scrubber) - click to jump to any lap
- Current lap display
- Restart button

**Step 4: Create ReplayClient component**

`components/replay/replay-client.tsx` - orchestrator component:
- Race selector: year dropdown (2023, 2024, 2025) + round dropdown (populated from season data)
- Fetches telemetry data from `/api/telemetry/[year]/[round]`
- Manages playback state (playing, speed, currentTime)
- Calls `buildReplayFrames` and `interpolateFrame`
- Passes data to canvas, leaderboard, and controls
- Uses `requestAnimationFrame` loop for animation timing

**Step 5: Create the /replay page**

`app/(main)/replay/page.tsx` - server component with metadata and Suspense boundary:

```tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ReplayClient } from "@/components/replay/replay-client";

export const metadata: Metadata = {
  title: "Race Replay - The Paddock",
  description: "Watch F1 races unfold lap by lap with animated track visualization.",
};

export default function ReplayPage() {
  return (
    <div>
      <PageHeader
        title="Race Replay"
        subtitle="Watch races unfold lap by lap"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Race Replay" },
        ]}
      />
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-xl bg-surface-1" />}>
        <ReplayClient />
      </Suspense>
    </div>
  );
}
```

**Step 6: Verify**

- Select a 2024 race, click play, cars should animate around track
- Speed controls work (1x through 8x)
- Leaderboard updates in sync with canvas
- Scrubber allows jumping to specific laps
- Safety car periods show yellow track
- Pit stops show cars entering pit lane area

**Step 7: Commit**

```bash
git add components/replay/ "app/(main)/replay/" lib/replay.ts lib/track-paths.ts
git commit -m "feat: add interactive race replay with animated track visualization"
```

---

## Task 8: Prediction engine - Python training script

**Files:**
- Create: `scripts/train_prediction_model.py`
- Create: `scripts/requirements.txt` (update existing)
- Create: `public/models/race-predictor.onnx`

**Step 1: Create training script**

`scripts/train_prediction_model.py`:

```python
"""
Train an XGBoost model to predict F1 race finishing positions.
Trains on 2014-2025 data, exports to ONNX for browser inference.

Usage: python scripts/train_prediction_model.py
Output: public/models/race-predictor.onnx
"""
```

**Feature engineering:**
- `grid_position`: qualifying position (1-20)
- `constructor_strength`: constructor's championship points at time of race, normalized 0-1
- `driver_form`: rolling 5-race average finish position
- `circuit_type`: categorical (street=0, mixed=1, high_speed=2)
- `is_wet`: binary (0 or 1)
- `driver_circuit_history`: average finish at this circuit from prior years
- `teammate_quali_gap`: qualifying time delta to teammate (seconds)

**Target:** finishing position (1-20)

**Pipeline:**
1. Load all season JSON files from `data/seasons/` for 2014-2025
2. For each race result, compute features
3. Train XGBoost regressor (objective: reg:squarederror)
4. Cross-validate with 3-fold temporal split (train on earlier years, validate on later)
5. Export to ONNX using `onnxmltools` or `skl2onnx`
6. Save to `public/models/race-predictor.onnx`
7. Also save feature metadata to `public/models/model-metadata.json` (feature names, normalization params, circuit type mappings)

**Step 2: Update requirements.txt**

Add to existing `scripts/requirements.txt`:
```
xgboost
scikit-learn
onnxmltools
skl2onnx
onnxruntime
```

**Step 3: Run training**

```bash
cd scripts && pip install -r requirements.txt && python train_prediction_model.py
```

Expected: model file at `public/models/race-predictor.onnx` (~100KB-1MB)

**Step 4: Commit**

```bash
git add scripts/train_prediction_model.py scripts/requirements.txt public/models/
git commit -m "feat: add XGBoost prediction model training script and ONNX export"
```

---

## Task 9: Prediction engine - Browser inference and UI

**Files:**
- Create: `app/(main)/predict/page.tsx`
- Create: `components/predict/predict-client.tsx`
- Create: `components/predict/prediction-results.tsx`
- Create: `components/predict/variable-controls.tsx`
- Create: `lib/prediction.ts`
- Modify: `package.json` (add onnxruntime-web)

**Step 1: Install onnxruntime-web**

```bash
npm install onnxruntime-web
```

**Step 2: Create prediction inference layer**

`lib/prediction.ts`:

```typescript
import * as ort from "onnxruntime-web";

let session: ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  session = await ort.InferenceSession.create("/models/race-predictor.onnx");
}

export interface PredictionInput {
  gridPosition: number;
  constructorStrength: number;
  driverForm: number;
  circuitType: number;
  isWet: number;
  driverCircuitHistory: number;
  teammateQualiGap: number;
}

export interface PredictionOutput {
  driverId: string;
  predictedPosition: number;
  winProbability: number;
  podiumProbability: number;
  pointsProbability: number;
}

export async function predict(inputs: PredictionInput[]): Promise<number[]>;
```

The `predict` function creates an ONNX tensor from input features, runs inference, and returns predicted positions. Probabilities are derived by running multiple perturbations (mini Monte Carlo: ~100 samples with small noise) and counting outcomes.

**Step 3: Create VariableControls component**

`components/predict/variable-controls.tsx`:
- Rain toggle: switch component
- Safety car likelihood: 3-button group (Low / Medium / High)
- Per-driver form sliders: expandable section, each driver has a -2 to +2 range slider
- All changes call `onUpdate` callback to trigger re-prediction

**Step 4: Create PredictionResults component**

`components/predict/prediction-results.tsx`:
- Ranked driver list with position numbers
- Driver name, team, and photo
- Probability bars: Win % (red), Podium % (amber), Points % (green)
- Animated transitions when predictions change (motion library)
- Baseline diff indicators: arrows showing position change from default prediction

**Step 5: Create PredictClient component**

`components/predict/predict-client.tsx`:
- Race selector: year + round dropdowns (2014-2025)
- Loads model on mount via `loadModel()`
- Fetches season data to get race grid and driver info
- Computes features from race data + user variable adjustments
- Runs prediction and displays results
- Shows loading state while model loads (~1-2s first time)
- Toggle between "Predictions" view and "What If" interactive view
- Disclaimer banner: "Fan model for entertainment. Predictions are probabilistic estimates based on historical data."

**Step 6: Create the /predict page**

```tsx
import { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PredictClient } from "@/components/predict/predict-client";

export const metadata: Metadata = {
  title: "Race Predictions - The Paddock",
  description: "AI-powered F1 race predictions. Adjust variables and see how outcomes change.",
};

export default function PredictPage() {
  return (
    <div>
      <PageHeader
        title="Race Predictions"
        subtitle="AI-powered race outcome forecasting"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Predict" },
        ]}
      />
      <Suspense fallback={<div className="h-[400px] animate-pulse rounded-xl bg-surface-1" />}>
        <PredictClient />
      </Suspense>
    </div>
  );
}
```

**Step 7: Verify**

- `/predict` loads without errors
- Model loads (check network tab for .onnx file)
- Select a race, see prediction results
- Toggle rain/safety car, predictions shift
- Adjust driver form slider, positions update in real-time
- Mobile responsive

**Step 8: Commit**

```bash
git add package.json package-lock.json lib/prediction.ts components/predict/ "app/(main)/predict/"
git commit -m "feat: add browser-based race prediction engine with interactive variable controls"
```

---

## Task 10: Final build verification and push

**Step 1: Run full build**

```bash
npx next build
```

Expected: all routes compile, no TypeScript errors.

**Step 2: Spot-check routes**

```bash
npx next dev
```

Visit:
- `/learn` - should show beginner, intermediate, and drama sections
- `/learn/crashgate` - drama article renders
- `/create` - card builder works
- `/replay` - race replay animates
- `/predict` - prediction engine loads model and shows results
- `/api/og/driver?slug=lewis-hamilton&theme=dark&size=square` - returns PNG

**Step 3: Commit any final fixes**

**Step 4: Push**

```bash
git push origin main
```
