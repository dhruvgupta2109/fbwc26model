from __future__ import annotations

from collections import Counter
from typing import Tuple

import numpy as np

from .fatigue import team_fatigue_factor
from .models import (
    MatchEvent,
    MatchSnapshot,
    MonteCarloResult,
    SimulationInput,
    SimulationResult,
    Substitution,
    TeamInput,
)
from .momentum import momentum_multiplier, update_momentum
from .tactics import build_possession_transition, tactic_modifiers


def _safe_avg(values: list[float], default: float = 0.5) -> float:
    if not values:
        return default
    return float(sum(values) / len(values))


def _aggregate_team_attributes(team) -> Tuple[float, float, float]:
    attack_vals = [p.attributes.attack * p.form for p in team.players]
    defense_vals = [p.attributes.defense * p.form for p in team.players]
    stamina_vals = [p.attributes.stamina for p in team.players]
    passing_vals = [p.attributes.passing * p.form for p in team.players]
    finishing_vals = [p.attributes.finishing * p.form for p in team.players]

    attack = (
        0.5 * _safe_avg(attack_vals)
        + 0.3 * _safe_avg(passing_vals)
        + 0.2 * _safe_avg(finishing_vals)
    )
    defense = _safe_avg(defense_vals)
    stamina = _safe_avg(stamina_vals)

    return attack, defense, stamina


def _apply_substitutions(
    team: TeamInput,
    substitutions: list[Substitution],
    team_side: str,
    snapshot_minute: int,
) -> tuple[TeamInput, list[MatchEvent]]:
    if not substitutions:
        return team, []

    updated_players = list(team.players)
    events: list[MatchEvent] = []

    for sub in substitutions:
        if sub.team_side != team_side:
            continue
        if sub.minute > snapshot_minute:
            continue

        out_index = next(
            (
                idx
                for idx, player in enumerate(updated_players)
                if player.player_id == sub.player_out_id
            ),
            None,
        )
        if out_index is None:
            continue

        out_name = updated_players[out_index].name
        updated_players[out_index] = sub.player_in
        minute = sub.minute if sub.minute > 0 else snapshot_minute

        events.append(
            MatchEvent(
                minute=minute,
                team_id=team.team_id,
                event_type="substitution",
                description=f"Substitution: {out_name} -> {sub.player_in.name}",
            )
        )

    if events:
        team = team.model_copy(update={"players": updated_players})

    return team, events


def _apply_snapshot_overrides(
    home: TeamInput,
    away: TeamInput,
    snapshot: MatchSnapshot,
) -> tuple[TeamInput, TeamInput, list[MatchEvent]]:
    if snapshot.home_tactics_override:
        home = home.model_copy(update={"tactics": snapshot.home_tactics_override})
    if snapshot.away_tactics_override:
        away = away.model_copy(update={"tactics": snapshot.away_tactics_override})

    home, home_events = _apply_substitutions(
        home, snapshot.substitutions, "home", snapshot.minute
    )
    away, away_events = _apply_substitutions(
        away, snapshot.substitutions, "away", snapshot.minute
    )

    return home, away, home_events + away_events


def _lambda_for_team(
    base_per_minute: float,
    attack_strength: float,
    defense_strength: float,
    attack_mod: float,
    defense_mod: float,
    fatigue_factor: float,
    momentum_factor: float,
) -> float:
    strength_ratio = attack_strength * attack_mod / max(0.2, defense_strength * defense_mod)
    lam = base_per_minute * strength_ratio * fatigue_factor * momentum_factor
    return float(min(max(lam, 0.0), 0.15))


def simulate_match(payload: SimulationInput, seed_override: int | None = None) -> SimulationResult:
    config = payload.config
    duration = config.duration_minutes
    base_per_minute = config.base_xg_per_team / max(1, duration)
    rng = np.random.default_rng(seed_override if seed_override is not None else config.seed)

    snapshot = payload.snapshot
    home = payload.home
    away = payload.away
    pre_events: list[MatchEvent] = []

    if snapshot:
        home, away, pre_events = _apply_snapshot_overrides(home, away, snapshot)

    home_attack, home_defense, home_stamina = _aggregate_team_attributes(home)
    away_attack, away_defense, away_stamina = _aggregate_team_attributes(away)

    home_mods = tactic_modifiers(home.tactics)
    away_mods = tactic_modifiers(away.tactics)

    home_keep, away_keep = build_possession_transition(home.tactics, away.tactics)
    start_minute = 1
    home_score = 0
    away_score = 0
    possession = "home" if rng.random() < home_keep else "away"
    home_momentum = 0.0
    away_momentum = 0.0
    home_fatigue_seed = 1.0
    away_fatigue_seed = 1.0

    if snapshot:
        start_minute = min(max(1, snapshot.minute + 1), duration)
        home_score = snapshot.home_score
        away_score = snapshot.away_score
        possession = snapshot.possession if snapshot.possession != "unknown" else possession
        home_momentum = snapshot.home_momentum
        away_momentum = snapshot.away_momentum
        home_fatigue_seed = snapshot.home_fatigue
        away_fatigue_seed = snapshot.away_fatigue

    xg_home = [0.0 for _ in range(duration)]
    xg_away = [0.0 for _ in range(duration)]
    possession_timeline = ["unknown" for _ in range(duration)]
    momentum_home = [0.0 for _ in range(duration)]
    momentum_away = [0.0 for _ in range(duration)]
    events: list[MatchEvent] = list(pre_events)

    for minute in range(start_minute, duration + 1):
        idx = minute - 1
        minute_possession = possession

        home_fatigue = min(
            team_fatigue_factor(
                payload.home.tactics.press_intensity, home_stamina, minute, duration
            ),
            home_fatigue_seed,
        )
        away_fatigue = min(
            team_fatigue_factor(
                payload.away.tactics.press_intensity, away_stamina, minute, duration
            ),
            away_fatigue_seed,
        )

        home_lambda = _lambda_for_team(
            base_per_minute,
            home_attack,
            away_defense,
            home_mods.attack * home_mods.transition,
            away_mods.defense,
            home_fatigue,
            momentum_multiplier(home_momentum, away_momentum, "home"),
        )
        away_lambda = _lambda_for_team(
            base_per_minute,
            away_attack,
            home_defense,
            away_mods.attack * away_mods.transition,
            home_mods.defense,
            away_fatigue,
            momentum_multiplier(home_momentum, away_momentum, "away"),
        )

        if minute_possession == "home":
            effective_home = home_lambda
            effective_away = away_lambda * 0.3
        else:
            effective_home = home_lambda * 0.3
            effective_away = away_lambda

        home_goals = int(rng.poisson(effective_home))
        away_goals = int(rng.poisson(effective_away))

        if home_goals > 0:
            for _ in range(home_goals):
                events.append(
                    MatchEvent(
                        minute=minute,
                        team_id=home.team_id,
                        event_type="goal",
                        xg=min(0.9, max(0.05, effective_home * 2.5)),
                        description="Open play goal",
                    )
                )
            home_score += home_goals
            home_momentum = min(1.0, home_momentum + 0.05 * home_goals)
            away_momentum = max(0.0, away_momentum - 0.03 * home_goals)

        if away_goals > 0:
            for _ in range(away_goals):
                events.append(
                    MatchEvent(
                        minute=minute,
                        team_id=away.team_id,
                        event_type="goal",
                        xg=min(0.9, max(0.05, effective_away * 2.5)),
                        description="Open play goal",
                    )
                )
            away_score += away_goals
            away_momentum = min(1.0, away_momentum + 0.05 * away_goals)
            home_momentum = max(0.0, home_momentum - 0.03 * away_goals)

        xg_home[idx] = effective_home
        xg_away[idx] = effective_away
        possession_timeline[idx] = minute_possession

        if minute_possession == "home":
            new_possession = "home" if rng.random() < home_keep else "away"
        else:
            new_possession = "away" if rng.random() < away_keep else "home"

        turnover = new_possession != minute_possession
        if turnover:
            events.append(
                MatchEvent(
                    minute=minute,
                    team_id=home.team_id
                    if new_possession == "home"
                    else away.team_id,
                    event_type="turnover",
                    description="Forced turnover",
                )
            )

        home_momentum, away_momentum = update_momentum(
            home_momentum, away_momentum, minute_possession, turnover
        )
        momentum_home[idx] = home_momentum
        momentum_away[idx] = away_momentum

        possession = new_possession

    return SimulationResult(
        home_score=home_score,
        away_score=away_score,
        events=events,
        xg_timeline_home=xg_home,
        xg_timeline_away=xg_away,
        possession_timeline=possession_timeline,
        momentum_timeline_home=momentum_home,
        momentum_timeline_away=momentum_away,
    )


def run_monte_carlo(payload: SimulationInput, num_runs: int) -> MonteCarloResult:
    home_win = 0
    away_win = 0
    draws = 0
    xg_home_sum = 0.0
    xg_away_sum = 0.0
    scorelines: Counter[str] = Counter()

    base_seed = payload.config.seed

    for idx in range(num_runs):
        seed = None if base_seed is None else base_seed + idx
        result = simulate_match(payload, seed_override=seed)
        xg_home_sum += sum(result.xg_timeline_home)
        xg_away_sum += sum(result.xg_timeline_away)

        scoreline = f"{result.home_score}-{result.away_score}"
        scorelines[scoreline] += 1

        if result.home_score > result.away_score:
            home_win += 1
        elif result.away_score > result.home_score:
            away_win += 1
        else:
            draws += 1

    total = max(1, num_runs)
    return MonteCarloResult(
        num_runs=num_runs,
        home_win=home_win,
        away_win=away_win,
        draws=draws,
        home_win_pct=home_win / total,
        away_win_pct=away_win / total,
        draw_pct=draws / total,
        avg_home_xg=xg_home_sum / total,
        avg_away_xg=xg_away_sum / total,
        scoreline_counts=dict(scorelines.most_common(10)),
    )
