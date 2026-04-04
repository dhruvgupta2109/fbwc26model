from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from .data_sources import PlayerUpdate, SportsApiClient
from .models import TeamInput


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _normalize_attribute(value: float) -> float:
    if value > 1.5:
        value = value / 100.0
    return _clamp(float(value), 0.0, 1.0)


def _normalize_form(value: float) -> float:
    if value > 1.5:
        value = value / 100.0
    return _clamp(float(value), 0.5, 1.5)


def _normalize_player(player: dict) -> dict:
    attrs = dict(player.get("attributes", {}))
    for key in ["attack", "defense", "stamina", "passing", "finishing"]:
        if key in attrs:
            attrs[key] = _normalize_attribute(attrs[key])
    player["attributes"] = attrs

    if "form" in player:
        player["form"] = _normalize_form(player["form"])

    if "injury_risk" in player:
        player["injury_risk"] = _clamp(float(player["injury_risk"]), 0.0, 1.0)

    return player


def load_seed_json(path: str | Path) -> list[TeamInput]:
    raw = json.loads(Path(path).read_text())
    teams = []

    for team in raw.get("teams", []):
        players = [_normalize_player(player) for player in team.get("players", [])]
        team["players"] = players
        teams.append(TeamInput.model_validate(team))

    return teams


def apply_player_updates(
    teams: Iterable[TeamInput], updates: Iterable[PlayerUpdate]
) -> list[TeamInput]:
    update_map = {update.player_id: update for update in updates}
    updated_teams: list[TeamInput] = []

    for team in teams:
        updated_players = []
        for player in team.players:
            update = update_map.get(player.player_id)
            if update is None:
                updated_players.append(player)
                continue

            new_form = player.form
            if update.form is not None:
                new_form = _normalize_form(update.form)

            new_injury = player.injury_risk
            if update.injury_risk is not None:
                new_injury = _clamp(float(update.injury_risk), 0.0, 1.0)

            updated_players.append(
                player.model_copy(update={"form": new_form, "injury_risk": new_injury})
            )

        updated_teams.append(team.model_copy(update={"players": updated_players}))

    return updated_teams


def poll_player_updates(
    teams: Iterable[TeamInput], client: SportsApiClient | None
) -> list[TeamInput]:
    if client is None:
        return list(teams)

    team_ids = [team.team_id for team in teams]
    updates = client.fetch_player_updates(team_ids)
    return apply_player_updates(teams, updates)
