from __future__ import annotations

from .tactics import clamp


def team_fatigue_factor(
    press_intensity: float,
    avg_stamina: float,
    minute: int,
    duration: int,
) -> float:
    intensity_load = press_intensity * (minute / max(1, duration))
    stamina_buffer = 0.85 + 0.3 * avg_stamina
    factor = 1.0 - (0.35 * intensity_load) / stamina_buffer
    return clamp(factor, 0.65, 1.0)
