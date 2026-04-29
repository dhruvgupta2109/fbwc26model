# Project Panenka

Stochastic, event-driven football simulation engine for tactical match intelligence and
what-if scenario testing (World Cup 2026).

## Structure

- backend/ - FastAPI service and simulation engine
- frontend/ - Placeholder for the React/Next.js dashboard

## Backend quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### API endpoints

- POST /simulate
- POST /simulate/monte-carlo

Player attributes are normalized to 0-1 in the current engine.

## Frontend quick start

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Data ingestion scaffolding

- Seed JSON: [backend/data/seed_teams.json](backend/data/seed_teams.json)
- Loader and update hooks: [backend/panenka/ingestion.py](backend/panenka/ingestion.py)
- API client stub: [backend/panenka/data_sources.py](backend/panenka/data_sources.py)

Environment variables for live API polling:

- `SPORTS_API_BASE_URL`
- `SPORTS_API_KEY`

## Sample payload and harness

- Payload: [backend/sample_payload.json](backend/sample_payload.json)
- Harness: [backend/scripts/run_sample.py](backend/scripts/run_sample.py)

Run the harness from backend/:

```bash
cd backend
PYTHONPATH=. python scripts/run_sample.py
```