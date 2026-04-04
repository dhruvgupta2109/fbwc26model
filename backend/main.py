from __future__ import annotations

from fastapi import FastAPI

from panenka.engine import run_monte_carlo, simulate_match
from panenka.models import MonteCarloRequest, MonteCarloResult, SimulationInput, SimulationResult

app = FastAPI(title="Panenka Simulation API")


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "panenka"}


@app.post("/simulate", response_model=SimulationResult)
def simulate(payload: SimulationInput) -> SimulationResult:
    return simulate_match(payload)


@app.post("/simulate/monte-carlo", response_model=MonteCarloResult)
def simulate_monte_carlo(payload: MonteCarloRequest) -> MonteCarloResult:
    return run_monte_carlo(payload.simulation, payload.num_runs)
