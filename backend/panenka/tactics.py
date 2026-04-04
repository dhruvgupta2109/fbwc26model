from __future__ import annotations

from dataclasses import dataclass

from .models import TeamTactics


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


@dataclass(frozen=True)
class TacticalModifiers:
    attack: float
    defense: float
    press: float
    transition: float
    fatigue_rate: float


def _defensive_line_score(line: str) -> int:
    if line == "high":
        return 1
    if line == "low":
        return -1
    return 0


def _mentality_score(mentality: str) -> int:
    if mentality == "attack":
        return 1
    if mentality == "defend":
        return -1
    return 0


def tactic_modifiers(tactics: TeamTactics) -> TacticalModifiers:
    line_score = _defensive_line_score(tactics.defensive_line)
    mentality_score = _mentality_score(tactics.mentality)
    transition_boost = (tactics.transition_speed - 0.5) * 0.2

    attack = 1.0 + (0.05 * line_score) + (0.08 * mentality_score) + transition_boost
    defense = 1.0 - (0.05 * line_score) - (0.06 * mentality_score)
    press = 0.9 + 0.2 * tactics.press_intensity
    transition = 0.9 + 0.2 * tactics.transition_speed
    fatigue_rate = 0.7 + 0.6 * tactics.press_intensity

    return TacticalModifiers(
        attack=clamp(attack, 0.75, 1.25),
        defense=clamp(defense, 0.75, 1.25),
        press=clamp(press, 0.85, 1.15),
        transition=clamp(transition, 0.85, 1.15),
        fatigue_rate=clamp(fatigue_rate, 0.7, 1.35),
    )


def build_possession_transition(home: TeamTactics, away: TeamTactics) -> tuple[float, float]:
    line_delta = _defensive_line_score(home.defensive_line) - _defensive_line_score(
        away.defensive_line
    )
    press_delta = home.press_intensity - away.press_intensity

    home_keep = 0.52 + 0.12 * press_delta + 0.05 * line_delta
    away_keep = 0.52 - 0.12 * press_delta - 0.05 * line_delta

    return clamp(home_keep, 0.35, 0.75), clamp(away_keep, 0.35, 0.75)
