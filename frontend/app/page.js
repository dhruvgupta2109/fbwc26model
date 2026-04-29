import Link from "next/link";

export default function HomePage() {
  return (
    <section className="page">
      <div className="hero">
        <p className="eyebrow">World Cup 2026 Simulation Stack</p>
        <h1>Project Panenka</h1>
        <p className="hero__lead">
          A tactical match intelligence engine that simulates the full 90-minute flow,
          from pressing to fatigue to momentum swings. Build scenarios, fork states, and
          understand why outcomes shift.
        </p>
        <div className="hero__actions">
          <Link className="btn" href="/demo">
            View Live Demo
          </Link>
          <Link className="btn btn--ghost" href="/product">
            Explore the System
          </Link>
        </div>
      </div>

      <div className="grid grid--three">
        <div className="card">
          <h3>Event-Driven Match Loop</h3>
          <p>
            Minute-by-minute Poisson goals and Markov possession, enriched with tactical
            modulation and fatigue decay.
          </p>
        </div>
        <div className="card">
          <h3>Scenario Sandbox</h3>
          <p>
            Save any match state, apply substitutions or tactical shifts, and launch 10k
            simulations from the same moment.
          </p>
        </div>
        <div className="card">
          <h3>Explainability Layer</h3>
          <p>
            Translate simulation outputs into human-readable insights that map the causes
            behind the result.
          </p>
        </div>
      </div>

      <div className="panel">
        <div>
          <p className="eyebrow">Architecture</p>
          <h2>Built for sub-second tactical iteration.</h2>
          <p className="muted">
            The simulation core is vectorized in Python, wrapped by FastAPI, and backed
            by Redis caching. Frontend tooling is designed for fast scenario exploration.
          </p>
        </div>
        <div className="stats">
          <div>
            <span>Single Match</span>
            <strong>&lt; 50ms</strong>
          </div>
          <div>
            <span>10k Monte Carlo</span>
            <strong>&lt; 1.5s</strong>
          </div>
          <div>
            <span>Timeline Depth</span>
            <strong>90+ Events</strong>
          </div>
        </div>
      </div>

      <div className="split">
        <div>
          <p className="eyebrow">Roadmap</p>
          <h2>What ships next</h2>
          <ul className="list">
            <li>Automated data polling for form, injuries, and momentum.</li>
            <li>Per-minute xG charts with tactical overlays.</li>
            <li>Scenario comparison and exportable reports.</li>
          </ul>
        </div>
        <div className="callout">
          <h3>Ready to explore?</h3>
          <p>
            Dive into the demo experience and check the live API health from the dashboard.
          </p>
          <Link className="btn" href="/demo">
            Go to Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
