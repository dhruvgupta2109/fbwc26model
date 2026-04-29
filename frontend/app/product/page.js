import Link from "next/link";

export default function ProductPage() {
  return (
    <section className="page">
      <div className="hero hero--compact">
        <p className="eyebrow">Product Overview</p>
        <h1>Tactical Match Intelligence, End to End.</h1>
        <p className="hero__lead">
          Panenka models the flow of a match, not just the result. The engine blends
          tactical structures, player form, and momentum into a living simulation.
        </p>
      </div>

      <div className="grid grid--two">
        <div className="card">
          <h3>Dynamic Tactical Matrix</h3>
          <p>
            Configure formations, defensive lines, transition speeds, and pressing
            intensity. The engine adapts as scorelines and fatigue change.
          </p>
        </div>
        <div className="card">
          <h3>Player Form and Fatigue</h3>
          <p>
            High-intensity tactics erode output by minute 70. Substitutions and tactical
            tweaks recover momentum.
          </p>
        </div>
        <div className="card">
          <h3>Momentum Tracking</h3>
          <p>
            Rolling dominance metrics based on turnovers, attacking third possession, and
            consecutive pressure sequences.
          </p>
        </div>
        <div className="card">
          <h3>Explainable Results</h3>
          <p>
            Every result is accompanied by narrative summaries of the tactical cause and
            effect behind the score.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Simulation Stack</h2>
        <div className="stack">
          <div>
            <span>Core Engine</span>
            <strong>Python + NumPy</strong>
          </div>
          <div>
            <span>API Layer</span>
            <strong>FastAPI + Redis</strong>
          </div>
          <div>
            <span>Visualization</span>
            <strong>Next.js + Charts</strong>
          </div>
        </div>
        <Link className="btn btn--ghost" href="/demo">
          See the Demo View
        </Link>
      </div>
    </section>
  );
}
