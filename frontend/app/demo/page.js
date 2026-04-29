"use client";

import { useState } from "react";
import Link from "next/link";
import samplePayload from "../../lib/samplePayload";

const defaultResult = {
  score: "-",
  xg: "-",
  status: "Idle",
};

export default function DemoPage() {
  const [status, setStatus] = useState("Checking...");
  const [result, setResult] = useState(defaultResult);
  const [loading, setLoading] = useState(false);

  const apiUrl = "http://localhost:8000";

  const checkHealth = async () => {
    try {
      const response = await fetch(`${apiUrl}/`, { mode: "cors" });
      if (!response.ok) {
        throw new Error("bad status");
      }
      setStatus("Online");
    } catch (error) {
      setStatus("Offline");
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(samplePayload),
      });
      if (!response.ok) {
        throw new Error("bad status");
      }
      const data = await response.json();
      const score = `${data.home_score} - ${data.away_score}`;
      const xg = `${sum(data.xg_timeline_home).toFixed(2)} - ${sum(
        data.xg_timeline_away
      ).toFixed(2)}`;
      setResult({ score, xg, status: "Simulation complete" });
    } catch (error) {
      setResult({ score: "-", xg: "-", status: "Simulation failed" });
    } finally {
      setLoading(false);
    }
  };

  const sum = (values) => values.reduce((total, value) => total + value, 0);

  return (
    <section className="page">
      <div className="hero hero--compact">
        <p className="eyebrow">Live Demo</p>
        <h1>Run the simulation engine.</h1>
        <p className="hero__lead">
          Connect to the local FastAPI service to execute a baseline match and inspect
          the output in seconds.
        </p>
        <div className="hero__actions">
          <button className="btn" onClick={runSimulation} disabled={loading}>
            {loading ? "Running..." : "Run Sample Simulation"}
          </button>
          <Link className="btn btn--ghost" href="http://localhost:8000/docs" target="_blank">
            API Docs
          </Link>
        </div>
      </div>

      <div className="grid grid--two">
        <div className="card">
          <h3>API Status</h3>
          <p className={`status ${status === "Online" ? "status--ok" : "status--warn"}`}>
            {status}
          </p>
          <p className="muted">{apiUrl}</p>
          <button className="btn btn--ghost" onClick={checkHealth}>
            Refresh
          </button>
        </div>
        <div className="card">
          <h3>Simulation Output</h3>
          <p className="muted">{result.status}</p>
          <div className="stat-row">
            <span>Score</span>
            <strong>{result.score}</strong>
          </div>
          <div className="stat-row">
            <span>Total xG</span>
            <strong>{result.xg}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Need more context?</h2>
        <p className="muted">
          Update the payload in frontend/lib/samplePayload.js to test alternative
          formations, player form swings, and snapshot states.
        </p>
      </div>
    </section>
  );
}
