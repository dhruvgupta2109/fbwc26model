'use client';

import { Play } from 'lucide-react';
import { BracketView } from '@/components/bracket/BracketView';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSimulation } from '@/hooks/useSimulation';

export function BracketPage() {
  const { result, run, isRunning, progress, completed, total } = useSimulation();

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-muted">Knockout Route</p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              <GradientText>Animated Knockout Bracket</GradientText>
            </h1>
          </div>
          <Button onClick={run} disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Resimulate'}
          </Button>
        </div>
        <div className="relative z-10 mt-5">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>{isRunning ? `Simulating ${completed.toLocaleString()} / ${total.toLocaleString()}` : 'Simulation ready'}</span>
            <span className="data-number">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </section>

      {result ? (
        <BracketView bracket={result.bracket} goldenBoot={result.goldenBoot} champion={result.champion} />
      ) : (
        <div className="card p-8 text-muted">Building tournament bracket...</div>
      )}
    </PageTransition>
  );
}
