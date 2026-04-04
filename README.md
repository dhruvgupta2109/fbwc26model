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