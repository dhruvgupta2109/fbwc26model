from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


Position = Literal["GK", "CB", "FB", "WB", "DM", "CM", "AM", "W", "ST"]
DefensiveLine = Literal["high", "mid", "low"]
Mentality = Literal["attack", "balanced", "defend"]
EventType = Literal["goal", "shot", "turnover"]
PossessionSide = Literal["home", "away", "unknown"]


class PlayerAttributes(BaseModel):
    attack: float = Field(0.5, ge=0.0, le=1.0)
    defense: float = Field(0.5, ge=0.0, le=1.0)
    stamina: float = Field(0.5, ge=0.0, le=1.0)
    passing: float = Field(0.5, ge=0.0, le=1.0)
    finishing: float = Field(0.5, ge=0.0, le=1.0)


class PlayerInput(BaseModel):
    player_id: str
    name: str
    position: Position
    attributes: PlayerAttributes
    form: float = Field(1.0, ge=0.5, le=1.5)
    injury_risk: float = Field(0.0, ge=0.0, le=1.0)


class TeamTactics(BaseModel):
    formation: str = "4-3-3"
    defensive_line: DefensiveLine = "mid"
    press_intensity: float = Field(0.5, ge=0.0, le=1.0)
    transition_speed: float = Field(0.5, ge=0.0, le=1.0)
    mentality: Mentality = "balanced"


class TeamInput(BaseModel):
    team_id: str
    name: str
    tactics: TeamTactics
    players: List[PlayerInput]


class SimulationConfig(BaseModel):
    duration_minutes: int = Field(90, ge=1, le=120)
    base_xg_per_team: float = Field(1.4, ge=0.1, le=5.0)
    seed: Optional[int] = None


class MatchSnapshot(BaseModel):
    minute: int = Field(0, ge=0, le=120)
    home_score: int = Field(0, ge=0)
    away_score: int = Field(0, ge=0)
    possession: PossessionSide = "unknown"
    home_momentum: float = Field(0.0, ge=0.0, le=1.0)
    away_momentum: float = Field(0.0, ge=0.0, le=1.0)
    home_fatigue: float = Field(1.0, ge=0.0, le=1.0)
    away_fatigue: float = Field(1.0, ge=0.0, le=1.0)


class SimulationInput(BaseModel):
    home: TeamInput
    away: TeamInput
    config: SimulationConfig = Field(default_factory=SimulationConfig)
    snapshot: Optional[MatchSnapshot] = None


class MatchEvent(BaseModel):
    minute: int = Field(..., ge=1, le=120)
    team_id: str
    event_type: EventType
    xg: float = Field(0.0, ge=0.0, le=5.0)
    description: Optional[str] = None


class SimulationResult(BaseModel):
    home_score: int
    away_score: int
    events: List[MatchEvent]
    xg_timeline_home: List[float]
    xg_timeline_away: List[float]
    possession_timeline: List[PossessionSide]
    momentum_timeline_home: List[float]
    momentum_timeline_away: List[float]


class MonteCarloRequest(BaseModel):
    simulation: SimulationInput
    num_runs: int = Field(1000, ge=1, le=100000)


class MonteCarloResult(BaseModel):
    num_runs: int
    home_win: int
    away_win: int
    draws: int
    home_win_pct: float
    away_win_pct: float
    draw_pct: float
    avg_home_xg: float
    avg_away_xg: float
    scoreline_counts: Dict[str, int]
