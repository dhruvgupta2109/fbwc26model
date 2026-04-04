from __future__ import annotations

from .tactics import clamp


def update_momentum(
    home_momentum: float,
    away_momentum: float,
    possession_team: str,
    turnover: bool,
) -> tuple[float, float]:
    decay = 0.88
    home_momentum *= decay
    away_momentum *= decay

    if possession_team == "home":
        home_momentum += 0.08
        away_momentum -= 0.03
    elif possession_team == "away":
        away_momentum += 0.08
        home_momentum -= 0.03

    if turnover:
        home_momentum -= 0.02
        away_momentum -= 0.02

    return clamp(home_momentum, 0.0, 1.0), clamp(away_momentum, 0.0, 1.0)


def momentum_multiplier(home_momentum: float, away_momentum: float, team: str) -> float:
    if team == "home":
        base = 1.0 + (0.18 * home_momentum) - (0.12 * away_momentum)
    else:
        base = 1.0 + (0.18 * away_momentum) - (0.12 * home_momentum)

    return clamp(base, 0.8, 1.25)
