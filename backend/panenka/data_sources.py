from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable, Optional


@dataclass(frozen=True)
class ApiConfig:
    base_url: str
    api_key: str
    timeout_seconds: int = 10


@dataclass(frozen=True)
class PlayerUpdate:
    player_id: str
    form: Optional[float] = None
    injury_risk: Optional[float] = None


class SportsApiClient:
    def __init__(self, config: ApiConfig) -> None:
        self._config = config

    def fetch_player_updates(self, team_ids: Iterable[str]) -> list[PlayerUpdate]:
        _ = team_ids
        return []


def build_client_from_env() -> SportsApiClient | None:
    base_url = os.getenv("SPORTS_API_BASE_URL")
    api_key = os.getenv("SPORTS_API_KEY")
    if not base_url or not api_key:
        return None
    return SportsApiClient(ApiConfig(base_url=base_url, api_key=api_key))
