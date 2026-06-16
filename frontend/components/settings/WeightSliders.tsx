'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { FACTOR_LABELS } from '@/simulation/factors';
import type { Weights } from '@/simulation/types';
import { Button } from '@/components/ui/Button';
import { useSimulationStore } from '@/store/simulationStore';

export function WeightSliders({ onRun, isRunning }: { onRun: () => void; isRunning: boolean }) {
  const { weights, setWeight, resetWeights, history } = useSimulationStore();
  const regular = Object.entries(FACTOR_LABELS).filter(([, value]) => !value.fun);
  const fun = Object.entries(FACTOR_LABELS).filter(([, value]) => value.fun);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="card cinematic-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className="section-title">Model Settings</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetWeights}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={onRun} disabled={isRunning}>{isRunning ? 'Running...' : 'Run Simulation'}</Button>
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <SliderGroup entries={regular} weights={weights} setWeight={setWeight} />
          <div>
            <h3 className="mb-3 text-sm font-bold text-accent">Fun Chaos Factors</h3>
            <SliderGroup entries={fun} weights={weights} setWeight={setWeight} />
          </div>
        </div>
      </div>
      <aside className="card cinematic-card p-5">
        <h3 className="font-bold text-ink">Simulation History</h3>
        <div className="mt-4 grid gap-3">
          {history.length === 0 ? <p className="text-sm text-muted">Runs will appear here after simulation completes.</p> : null}
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border border-line bg-canvas p-3">
              <p className="text-sm font-semibold text-ink">Winner: {item.champion}</p>
              <p className="mt-1 text-xs text-muted">{new Date(item.generatedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function SliderGroup({
  entries,
  weights,
  setWeight
}: {
  entries: Array<[string, { label: string; detail: string }]>;
  weights: Weights;
  setWeight: (key: keyof Weights, value: number) => void;
}) {
  return (
    <div className="grid gap-4">
      {entries.map(([key, meta]) => (
        <label key={key} className="block">
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="text-sm font-semibold text-ink" title={meta.detail}>{meta.label}</span>
            <span className="data-number text-sm font-bold text-primary">{Math.round(weights[key as keyof Weights] * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(weights[key as keyof Weights] * 100)}
            onChange={(event) => setWeight(key as keyof Weights, Number(event.target.value) / 100)}
            className="w-full accent-primary"
          />
          <p className="mt-1 text-xs text-muted">{meta.detail}</p>
        </label>
      ))}
    </div>
  );
}
