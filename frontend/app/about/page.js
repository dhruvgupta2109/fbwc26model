export default function AboutPage() {
  return (
    <section className="page">
      <div className="hero hero--compact">
        <p className="eyebrow">About Panenka</p>
        <h1>Built for tactical curiosity.</h1>
        <p className="hero__lead">
          Panenka is a simulation lab for analysts, fans, and managers who want to test
          their instincts with a transparent, high-fidelity match engine.
        </p>
      </div>

      <div className="grid grid--three">
        <div className="card">
          <h3>Analyst Mode</h3>
          <p>
            Compare tactical shapes against each other and isolate how transitions drive
            chance creation.
          </p>
        </div>
        <div className="card">
          <h3>Managerial Mode</h3>
          <p>
            Explore substitution timing, defensive line shifts, and game-state responses
            across 10k simulations.
          </p>
        </div>
        <div className="card">
          <h3>Fan Mode</h3>
          <p>
            Translate data into narrative: who turned the tide, who faded late, and why.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Values</h2>
        <ul className="list">
          <li>Explain the why behind every probability curve.</li>
          <li>Move faster than match-day tactical cycles.</li>
          <li>Ground every insight in player-level mechanics.</li>
        </ul>
      </div>
    </section>
  );
}
