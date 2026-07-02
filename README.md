# WC26 Oracle

**Display description:** A static Next.js dashboard that simulates FIFA World Cup 2026 outcomes with Monte Carlo predictions, bracket paths, group tables, model controls, and live-score context.

WC26 Oracle is a polished client-side prediction model for the 2026 FIFA World Cup. It runs a 10,000-iteration Monte Carlo simulation in the browser, projects the 48-team tournament from group stage through the final, and lets users adjust model weights to see how the forecast changes.

> Predictions are probabilistic and intended for entertainment, portfolio, and demo use.

## Screenshots

### Overview

![WC26 Oracle overview dashboard](frontend/public/screenshots/overview.png)

### Knockout Bracket

![WC26 Oracle animated knockout bracket](frontend/public/screenshots/bracket.png)

### Group Predictions

![WC26 Oracle group-stage standings](frontend/public/screenshots/groups.png)

### Model Settings

![WC26 Oracle model settings and explainability](frontend/public/screenshots/model.png)

## Features

- 10,000-run Monte Carlo tournament simulation.
- Full 48-team World Cup 2026 data pack.
- Group-stage projections with qualification probabilities.
- Animated knockout bracket with most-likely path highlighting.
- Adjustable model weights for Elo, FIFA ranking, form, xG, squad quality, host advantage, travel fatigue, altitude, and moon phase.
- Explainability notes for the current champion projection.
- Live-score cache and refresh flow with bundled fallback data.
- Shareable prediction-card PNG download.
- Dark/light theme persistence.
- Static export support for GitHub Pages.

## Model Factors

The simulation converts each team into a weighted strength score for every matchup, then turns that score into expected goals and match outcomes. Weights are normalized, so increasing one factor lowers the relative influence of the others.

### Core Football Factors

- **Elo Rating:** Baseline team strength from Elo-style ratings, normalized across the tournament field.
- **FIFA Ranking:** Official ranking signal. Lower FIFA ranks score better after inversion.
- **Recent Form:** Recent performance proxy covering wins, scoring trend, and defensive trend.
- **Attacking xG:** Expected goals created per 90 minutes. Higher attacking output raises a team's expected goals.
- **Defensive xG:** Expected goals allowed per 90 minutes. Lower conceded xG improves the defensive score.
- **Squad Quality:** Player-depth and club-level proxy, scaled as an overall roster-strength input.
- **World Cup Titles:** Historical winning pedigree, capped so past trophies help without overpowering current quality.
- **World Cup Appearances:** Big-tournament experience from previous finals appearances, also capped.
- **Matchup Profile:** Opponent-specific proxy built from rating gap, form gap, and tournament-pedigree gap.
- **Home Continent Advantage:** Host-region adjustment. CONCACAF teams get the strongest boost; CONMEBOL teams get a smaller nearby-region boost.

### Chaos Factors

- **Captain's Birthday:** Tiny boost when the captain's birthday lands within three days of matchday.
- **Manager's Birthday:** Tiny boost when the manager's birthday lands within three days of matchday.
- **Lucky Number:** Small randomness-style factor based on each team's bundled lucky-number value.
- **Moon Phase:** Small underdog-chaos modifier. Full and waxing moon phases can slightly change matchup strength.

### Outcome Flow

1. Each team's factor scores are normalized and combined into a matchup strength.
2. Strength difference, attacking xG, and opponent defensive xG produce expected goals.
3. Match scores are sampled with a Poisson model.
4. Knockout draws go through extra-time and penalty-style tiebreak logic.
5. Repeating the tournament 10,000 times produces champion odds, group probabilities, bracket paths, upset watch, and golden boot projections.

## Tech Stack

- Next.js 14 with static export
- React 18 and TypeScript
- Tailwind CSS
- Zustand for client state
- Framer Motion for transitions
- D3, Recharts, and Three.js for visual layers
- Web Worker simulation execution

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
cd frontend
npm run build
```

The production build exports static files to `frontend/out/`.

## Deployment

The app is configured with `output: 'export'` in `frontend/next.config.js`. In GitHub Actions, the production base path is inferred from `GITHUB_REPOSITORY` for project pages unless `NEXT_PUBLIC_BASE_PATH` or `BASE_PATH` is set explicitly.

## Project Structure

```text
frontend/
  app/                  Next.js app routes
  components/           UI, layout, cards, pages, bracket, and visuals
  hooks/                Simulation, theme, and live-score hooks
  lib/                  Data helpers, live-score utilities, and sharing helpers
  public/data/          Static teams and live-score cache
  public/screenshots/   README screenshot assets
  simulation/           Monte Carlo engine, factors, worker, and types
  store/                Zustand simulation store
```

## Data Notes

The app uses bundled team data and public football-rating references, with live-score data cached under `frontend/public/data/live-scores.json`. Forecasts should not be treated as betting, financial, or factual guarantees.
