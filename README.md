# WC26 Oracle

A static Next.js portfolio app that predicts the FIFA World Cup 2026 with a client-side Monte Carlo engine.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
cd frontend
npm run build
```

The app uses `output: 'export'` in `next.config.js`, so production output is written to `frontend/out/` for GitHub Pages.

## What is included

- 48-team static data pack in `frontend/public/data/teams.json`
- 10,000 iteration group-stage-to-final simulation engine
- Web Worker progress updates
- Separate static pages for Overview, Bracket, Groups, Teams, Model, and Live
- Dark/light mode persistence
- Bracket, groups, teams, model settings, live scores, and team detail pages
- Animated shader-ring background and animated gradient headline treatment
- Shareable prediction card PNG download

Predictions are probabilistic and for entertainment/demo purposes.
