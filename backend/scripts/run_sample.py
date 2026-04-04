from __future__ import annotations

import json
from pathlib import Path

from panenka.engine import run_monte_carlo, simulate_match
from panenka.models import MatchSnapshot, PlayerAttributes, PlayerInput, SimulationInput, Substitution, TeamTactics


def load_payload(path: Path) -> SimulationInput:
    payload = json.loads(path.read_text())
    return SimulationInput.model_validate(payload)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    payload_path = root / "sample_payload.json"

    sim_input = load_payload(payload_path)
    result = simulate_match(sim_input)

    print("Baseline simulation")
    print(f"Final score: {result.home_score}-{result.away_score}")
    print(f"Total xG: {sum(result.xg_timeline_home):.2f}-{sum(result.xg_timeline_away):.2f}")

    mc_result = run_monte_carlo(sim_input, num_runs=200)
    print("Monte Carlo (200 runs)")
    print(
        "Home win %: {:.1f}, Away win %: {:.1f}, Draw %: {:.1f}".format(
            mc_result.home_win_pct * 100,
            mc_result.away_win_pct * 100,
            mc_result.draw_pct * 100,
        )
    )

    sub_player = PlayerInput(
        player_id="ARG-W2",
        name="Lautaro Martinez",
        position="ST",
        attributes=PlayerAttributes(
            attack=0.84,
            defense=0.4,
            stamina=0.74,
            passing=0.6,
            finishing=0.86,
        ),
        form=1.03,
        injury_risk=0.08,
    )

    snapshot = MatchSnapshot(
        minute=60,
        home_score=1,
        away_score=0,
        possession="home",
        home_momentum=0.55,
        away_momentum=0.35,
        home_fatigue=0.9,
        away_fatigue=0.88,
        home_tactics_override=TeamTactics(
            formation="4-4-2",
            defensive_line="mid",
            press_intensity=0.5,
            transition_speed=0.55,
            mentality="balanced",
        ),
        substitutions=[
            Substitution(
                minute=60,
                team_side="home",
                player_out_id="ARG-W1",
                player_in=sub_player,
            )
        ],
    )

    scenario_input = SimulationInput(
        home=sim_input.home,
        away=sim_input.away,
        config=sim_input.config,
        snapshot=snapshot,
    )
    scenario_result = simulate_match(scenario_input)

    print("Scenario from 60' snapshot")
    print(f"Final score: {scenario_result.home_score}-{scenario_result.away_score}")
    print(
        f"Total xG: {sum(scenario_result.xg_timeline_home):.2f}-"
        f"{sum(scenario_result.xg_timeline_away):.2f}"
    )


if __name__ == "__main__":
    main()
