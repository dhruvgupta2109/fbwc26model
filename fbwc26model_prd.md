# Product Requirements Document
## FIFA World Cup 2026 — Prediction Model Web App

**Version:** 1.0  
**Status:** Ready for Development  
**Target:** Codex / AI-assisted development  
**Deployment:** GitHub Pages (static export)

---

## 1. Project Overview

### 1.1 Summary

A visually polished, data-driven web application that predicts the outcome of the FIFA World Cup 2026 using a Monte Carlo simulation engine. The app is designed as a **portfolio/showcase project** targeting the general public — both casual football fans and stats-oriented users. There are no user accounts; all state is anonymous and session-based.

### 1.2 Goals

- Demonstrate advanced frontend engineering and data modelling skills
- Build a public-facing, shareable prediction tool for WC 2026
- Deliver a premium, clean UI with dark/light mode that works beautifully on desktop
- Run a stateless Monte Carlo simulation entirely client-side (no backend required)

### 1.3 Non-Goals

- User authentication or persistent profiles
- Real-time betting odds integration
- Mobile-first design (desktop-first; mobile is a nice-to-have)
- Paid API usage

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14** (static export) | React ecosystem, SSG support, GitHub Pages compatible |
| Styling | **Tailwind CSS** | Utility-first, fast iteration, dark mode built-in |
| Charts / Viz | **Recharts** + **D3.js** | Recharts for standard charts; D3 for custom bracket/simulation visuals |
| Animation | **Framer Motion** | Smooth bracket animations, transitions |
| Icons | **Lucide React** | Lightweight, consistent icon set |
| Data Fetching | **SWR** | Stale-while-revalidate, caching, free API rate limit friendliness |
| Data Sources | **football-data.org** (free tier) + **API-Football** (free tier) | Free APIs for fixtures, standings, team/player data |
| Static Data | JSON files in `/data` | Fallback for API gaps; historical WC data, squad info |
| Deployment | **GitHub Pages** via `next export` | Zero cost, portfolio-friendly |
| Share Feature | **html2canvas** | Client-side screenshot for shareable prediction cards |

---

## 3. Data Sources & API Strategy

### 3.1 Primary APIs (Free Tier)

| API | Base URL | Used For | Free Limit |
|---|---|---|---|
| football-data.org | `https://api.football-data.org/v4` | WC fixtures, standings, team data | 10 req/min |
| API-Football | `https://v3.football.api-sports.io` | Player stats, form, xG data | 100 req/day |

### 3.2 Static JSON Files (in `/public/data/`)

These are pre-built at dev time and bundled with the app to avoid hitting rate limits:

- `teams.json` — All 48 WC 2026 teams with metadata
- `groups.json` — Group stage draw
- `historical_wc.json` — Each team's World Cup history (appearances, wins, finals, best result)
- `players.json` — Top 3 players per team (name, position, club, caps, goals, xG per 90)
- `captains.json` — Captain name + birthday per team
- `managers.json` — Manager name + birthday per team
- `head_to_head.json` — H2H records between all possible matchups
- `elo_ratings.json` — Pre-calculated Elo ratings (from club-elo.com or eloratings.net)
- `fun_facts.json` — Quirky stat callouts per team

### 3.3 Data Refresh Strategy

- Static JSON files are updated manually before tournament start
- Live scores fetched from API-Football during the tournament window
- All API calls wrapped in SWR with aggressive caching to stay within free limits
- Graceful fallback to static data if API is unavailable

---

## 4. Prediction Model — Monte Carlo Engine

### 4.1 Overview

The simulation runs **10,000 full tournament iterations** client-side using a Web Worker to avoid blocking the UI thread. Each iteration plays out the entire tournament from group stage to final and records outcomes. Win probabilities are expressed as percentages across all 10,000 runs.

### 4.2 Match Outcome Model

Each match produces a scoreline based on expected goals (xG) drawn from a Poisson distribution:

```
xG_A = f(elo_A, elo_B, form_A, h2h, player_quality_A, home_continent, xg_stats_A)
xG_B = f(elo_B, elo_A, form_B, h2h, player_quality_B, home_continent, xg_stats_B)

goals_A ~ Poisson(xG_A)
goals_B ~ Poisson(xG_B)
```

For knockout matches, if goals are level after 90 min, go to extra time then penalties (modelled as a weighted coin flip based on penalty shootout history).

### 4.3 Input Factors & Default Weights

All weights are user-adjustable via sliders in the Model Settings panel. Weights are normalised to sum to 1.0.

| Factor | Description | Default Weight | Data Source |
|---|---|---|---|
| FIFA / Elo Rating | Current team strength ranking | 0.25 | `elo_ratings.json` / FIFA API |
| Recent Form | W/D/L + goals in last 10 matches | 0.20 | API-Football |
| xG Stats | Expected goals for/against per 90 min | 0.15 | API-Football |
| Squad Quality | Avg player market value / club level proxy | 0.15 | `players.json` |
| Head-to-Head History | Historical results between teams | 0.10 | `head_to_head.json` |
| Home Continent Advantage | Bonus for CONCACAF teams (tournament in USA/Canada/Mexico) | 0.08 | Hardcoded |
| Captain's Birthday | +1% win chance if captain's birthday falls within ±3 days of match | 0.02 | `captains.json` |
| Manager's Birthday | Same birthday bonus for the manager | 0.02 | `managers.json` |
| Lucky Number | Sum of squad jersey numbers mod 7 — a chaos factor 🎲 | 0.01 | `players.json` |
| Moon Phase | Waxing gibbous = +0.5% for underdog. Full moon = chaos multiplier. | 0.02 | Computed from match date |

> **Note:** Birthday, Lucky Number, and Moon Phase factors are deliberately whimsical and disclosed as "fun" to the user. They are clearly labelled in the UI with a 🎉 icon.

### 4.4 Simulation Pipeline

```
1. Load weights (user-set or defaults)
2. Spawn Web Worker → run 10,000 iterations
   Each iteration:
     a. Simulate all 12 group stage matchdays
     b. Compute group standings (pts, GD, GF, H2H tiebreakers)
     c. Determine 32 qualified teams
     d. Simulate R32 → R16 → QF → SF → 3rd place → Final
     e. Record: winner, finalist, SF/QF/R16 exits, top scorer
3. Aggregate results → probabilities
4. Stream partial results to UI every 1,000 iterations (progress bar)
5. Final result triggers animated bracket reveal
```

---

## 5. App Structure & Pages

The app is a **dashboard with named tab sections**, all on a single URL (hash-based navigation). A persistent top navbar with tabs handles navigation.

```
/
├── [Tab] Overview        → Hero + tournament summary + model's top prediction
├── [Tab] Bracket         → Interactive animated knockout bracket
├── [Tab] Group Stage     → All 12 groups with predicted standings
├── [Tab] Teams           → Team card grid → click → deep-dive page
├── [Tab] Model Settings  → Weight sliders + re-run simulation
├── [Tab] Live Scores     → Real-time match scores (tournament period only)
└── /team/[code]          → Team deep-dive page (dynamic route)
```

---

## 6. Page & Component Specifications

### 6.1 Global Layout

**Navbar**
- Logo: "WC26 Oracle" with a ⚽ icon
- Tab links: Overview · Bracket · Groups · Teams · Model · Live
- Dark/Light mode toggle (sun/moon icon, top-right)
- Sticky on scroll, glassmorphism effect in dark mode

**Footer**
- Data attribution: football-data.org, API-Football
- "Built with Next.js · Deployed on GitHub Pages"
- Disclaimer: "Predictions are probabilistic simulations for entertainment purposes."

---

### 6.2 Tab: Overview

**Hero Section**
- Headline: "Who Will Lift the Trophy?"
- Animated ticker showing top 5 predicted winners with % probability
- "Run Simulation" CTA button (reruns the Monte Carlo)
- Progress bar shown during simulation (0–100%, "Simulating 4,271 / 10,000 tournaments...")

**Predicted Champion Card**
- Large team flag + name
- Win probability percentage (animated counter)
- Confidence bar
- "Upset Alert" badge if win probability < 15% (underdog)

**Top 8 Predictions Panel**
- Horizontal scrollable cards showing: predicted QF teams with their probability of reaching that stage

**Quirky Stat Callouts**
- 3–4 rotating fun fact cards, e.g.:
  - "🌕 Brazil has won 3 of 4 WC finals played on a full moon"
  - "🎂 Messi's birthday falls on the day of Argentina's group opener"
  - "⚡ CONCACAF teams are 2× more likely to reach QF on home soil"
- Source labelled as "Fun Stats — not all are statistically significant 😄"

---

### 6.3 Tab: Bracket

**Animated Knockout Bracket**
- Full visual bracket: R32 → R16 → QF → SF → Final
- Teams populate via animation after simulation completes (bracket "fills in" progressively, left to right)
- Each matchup shows:
  - Team flag + name
  - Win probability % for that specific match
  - Upset Alert 🔥 badge if underdog has > 35% chance
- Click any team → opens Team Deep-Dive drawer/modal
- "Show Most Likely Path" toggle: highlights the single most probable route to the final
- Resimulate button in top-right corner

**Golden Boot Prediction**
- Sidebar card: Top 5 predicted scorers with projected goals and probability

---

### 6.4 Tab: Group Stage

- Grid of all 12 groups (A–L), 4 teams each
- Per group card shows:
  - Predicted final standings (1st, 2nd, 3rd, 4th)
  - Points projection (average across simulations)
  - Qualification probability % per team (e.g. "87% chance of advancing")
  - Team flag, name, predicted GF / GA
- Click group → expands to show all 6 matchups with predicted scores and win probabilities
- Colour coding: green (likely advance), amber (uncertain), red (likely eliminated)

---

### 6.5 Tab: Teams

**Team Grid**
- 48 team cards in a responsive grid (4 per row on desktop)
- Each card: flag, team name, FIFA ranking, WC win probability pill
- Filter bar: by confederation (UEFA, CONMEBOL, CAF, AFC, CONCACAF, OFC)
- Sort by: Win Probability · FIFA Ranking · Historical Titles
- Search input

**Team Deep-Dive Page (`/team/[code]`)**

Sections on this page:

1. **Hero** — Flag, team name, confederation badge, manager name
2. **Prediction Summary** — Win %, Finalist %, SF %, QF % (from simulation)
3. **Model Inputs Panel** — Radar chart showing the team's score on each factor (Elo, Form, xG, etc.)
4. **Historical WC Performance** — Timeline viz: every WC appearance, colour-coded by best round reached; total titles, finals, appearances
5. **Player Spotlight** — Top 3 players: photo placeholder, name, position, club, caps, goals, xG/90
6. **Head-to-Head** — Predicted group/knockout opponents with H2H record and predicted win %
7. **Fun Facts** — 2–3 quirky callouts specific to this team

---

### 6.6 Tab: Model Settings

**Weight Sliders Panel**
- One slider per factor (10 total)
- Each slider: 0–100%, with live percentage label
- Auto-normalisation: sliders always sum to 100% (adjusting one redistributes proportionally)
- Factor label + info icon (hover tooltip explains the factor)
- Fun factors grouped separately under "🎉 Fun Chaos Factors"
- "Reset to Defaults" button
- "Run Simulation" button → triggers re-run with new weights
- Simulation history: last 3 weight configurations with their predicted winner (compare runs)

**Model Explainability Panel**
- After simulation: shows top 3 reasons the model picked the predicted winner
  - e.g. "France ranked #1 in xG stats (2.31 per game)", "Brazil gets +8% CONCACAF home bonus"
- "Why this team?" expandable for any team

---

### 6.7 Tab: Live Scores

> Active only during tournament window (June–July 2026). Outside tournament, shows a countdown clock.

- Live and recent match cards: team A vs team B, score, match status (Live / FT / Upcoming)
- Match clock for live games
- "Update Simulation" button — re-runs Monte Carlo using actual results for completed matches
- Cards auto-refresh every 60 seconds via SWR polling

---

### 6.8 Shareable Prediction Card

Available via a "Share My Prediction" button on Overview and Bracket tabs.

- html2canvas captures a styled card showing:
  - App branding
  - Predicted champion + probability
  - User's custom weight configuration (if modified)
  - Generated date
- Download as PNG
- Copy image to clipboard
- Share URL (encodes weights as URL params so predictions are reproducible)

---

### 6.9 Upset Alert System

Displayed across Bracket, Group Stage, and Overview:

- Computed as: teams ranked outside top 16 (by Elo) with > 30% chance of advancing past their expected round
- Displayed as a 🔥 badge on bracket slots and group cards
- "Upset Watch" sidebar widget on Overview: top 3 most likely upsets in the tournament

---

## 7. UI/UX Design Spec

### 7.1 Theme

| Token | Light Mode | Dark Mode |
|---|---|---|
| Background | `#F8FAFC` | `#0D1117` |
| Surface | `#FFFFFF` | `#161B22` |
| Border | `#E2E8F0` | `#30363D` |
| Primary | `#1D4ED8` (blue) | `#3B82F6` |
| Accent | `#F59E0B` (amber/gold) | `#FBBF24` |
| Text Primary | `#0F172A` | `#E6EDF3` |
| Text Muted | `#64748B` | `#8B949E` |
| Success | `#16A34A` | `#22C55E` |
| Danger | `#DC2626` | `#F87171` |

### 7.2 Typography

- Font: **Inter** (Google Fonts)
- Headings: `font-bold`, tight tracking
- Data labels: `font-mono` for numbers/percentages
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48px

### 7.3 Component Patterns

- Cards: rounded-2xl, subtle shadow in light mode, border in dark mode
- Probability bars: animated fill on load, colour-coded (green → amber → red by likelihood)
- Team flags: use `flagcdn.com` or bundled SVGs, always shown at 4:3 ratio
- Transitions: all interactive elements use 150ms ease-in-out
- Bracket lines: SVG connectors between matchup boxes, animate on reveal

### 7.4 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `xl` (1280px+) | Full dashboard, 4-col grids, side-by-side panels |
| `lg` (1024px) | 3-col grids, slightly compressed bracket |
| `md` (768px) | 2-col grids, stacked panels, scrollable bracket |
| `sm` (< 768px) | 1-col, hamburger nav, horizontal scroll for bracket |

---

## 8. Performance Requirements

- **Simulation runtime:** < 3 seconds for 10,000 iterations (Web Worker, optimised JS)
- **First Contentful Paint:** < 1.5s (static export, CDN-served)
- **Lighthouse score target:** Performance ≥ 90, Accessibility ≥ 85
- **Bundle size:** < 500KB gzipped (code-split by tab)
- **API calls:** Debounced and cached; never more than 1 call per 6 seconds to respect free tier limits

---

## 9. File & Folder Structure

```
/
├── public/
│   └── data/                  # Static JSON files (teams, fixtures, history, etc.)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Root → redirects to /overview
│   │   ├── layout.tsx         # Global layout, theme provider
│   │   └── team/[code]/       # Team deep-dive dynamic route
│   ├── components/
│   │   ├── bracket/           # Bracket viz components
│   │   ├── charts/            # Win probability bars, radar charts
│   │   ├── cards/             # TeamCard, PlayerCard, MatchCard
│   │   ├── layout/            # Navbar, Footer, TabBar
│   │   ├── settings/          # Weight sliders, model config
│   │   └── ui/                # Shared primitives (Button, Badge, Tooltip)
│   ├── simulation/
│   │   ├── engine.ts          # Monte Carlo core logic
│   │   ├── worker.ts          # Web Worker wrapper
│   │   ├── poisson.ts         # Poisson goal distribution
│   │   ├── factors.ts         # Factor scoring functions
│   │   └── types.ts           # TypeScript interfaces
│   ├── hooks/
│   │   ├── useSimulation.ts   # Simulation state + progress
│   │   ├── useLiveScores.ts   # SWR hook for live data
│   │   └── useTheme.ts        # Dark/light toggle
│   ├── lib/
│   │   ├── api.ts             # API client (football-data.org + API-Football)
│   │   ├── shareCard.ts       # html2canvas share logic
│   │   └── moonPhase.ts       # Moon phase calculator 🌕
│   └── store/
│       └── simulationStore.ts # Zustand store for weights + results
├── next.config.js             # output: 'export', basePath for GitHub Pages
└── tailwind.config.ts
```

---

## 10. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "tailwindcss": "^3.x",
    "framer-motion": "^11.x",
    "recharts": "^2.x",
    "d3": "^7.x",
    "swr": "^2.x",
    "zustand": "^4.x",
    "lucide-react": "^0.x",
    "html2canvas": "^1.x",
    "clsx": "^2.x"
  }
}
```

---

## 11. Simulation Factor Implementation Notes

### Birthday Factor
```typescript
// Returns true if the person's birthday falls within ±3 days of matchDate
function isBirthdayWindow(birthday: string, matchDate: string): boolean {
  const bDay = dayOfYear(birthday);
  const mDay = dayOfYear(matchDate);
  return Math.abs(bDay - mDay) <= 3;
}
// Adds BIRTHDAY_BOOST (default 0.04 xG) to that team's expected goals
```

### Moon Phase Factor
```typescript
// Waxing gibbous: underdog gets +0.03 xG bonus
// Full moon: apply ±0.05 random chaos modifier to both teams
// New moon: slight defensive bonus (−0.02 xG for both)
```

### Home Continent Factor
```typescript
// WC 2026 hosts: USA, Canada, Mexico → CONCACAF confederation
// CONCACAF teams get +0.12 xG home advantage modifier
// Neighbouring continent bonus (CONMEBOL): +0.04 xG
```

---

## 12. Phased Delivery Plan

| Phase | Scope | Est. Effort |
|---|---|---|
| **Phase 1** | Static data + Monte Carlo engine + Bracket tab | Core |
| **Phase 2** | Group Stage tab + Teams grid + Team deep-dive | Core |
| **Phase 3** | Model Settings sliders + Overview tab with fun stats | Polish |
| **Phase 4** | Live Scores tab + API integration | Live |
| **Phase 5** | Share card + Upset alerts + Performance tuning | Extras |

---

## 13. Out of Scope (v1)

- User accounts or saved predictions
- Betting odds integration
- Push notifications
- Native mobile app
- Multi-language support
- Comment/discussion features

---

## 14. Acceptance Criteria

- [ ] Monte Carlo simulation completes 10,000 runs in < 3 seconds
- [ ] Bracket animates correctly with all 48→32→16→8→4→2→1 teams
- [ ] Dark/light toggle persists across tabs (localStorage)
- [ ] All 10 model factors are reflected in simulation output
- [ ] Share card generates and downloads correctly
- [ ] Upset Alert badges appear for appropriate teams
- [ ] App builds and deploys to GitHub Pages via `next export`
- [ ] No broken states when API is unavailable (graceful fallback to static data)
- [ ] Lighthouse Performance ≥ 90 on desktop

---

*PRD generated for Codex — World Cup 2026 Oracle project.*
