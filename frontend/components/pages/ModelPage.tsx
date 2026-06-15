'use client';

import { WeightSliders } from '@/components/settings/WeightSliders';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSimulation } from '@/hooks/useSimulation';

export function ModelPage() {
  const { result, run, isRunning } = useSimulation();

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase text-muted">Model Lab</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
            <GradientText>Weights & Explainability</GradientText>
          </h1>
        </div>
      </section>
      <WeightSliders onRun={run} isRunning={isRunning} />
      {result ? (
        <div className="card p-5">
          <h2 className="section-title">Why this team?</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {result.explainability.map((reason) => (
              <p key={reason} className="rounded-lg border border-line bg-canvas/80 p-3 text-sm text-muted">{reason}</p>
            ))}
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
