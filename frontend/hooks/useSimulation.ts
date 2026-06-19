'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { teams } from '@/lib/data';
import { runSimulation } from '@/simulation/engine';
import type { WorkerMessage } from '@/simulation/types';
import { useSimulationStore } from '@/store/simulationStore';

export function useSimulation(iterations = 10_000) {
  const { weights, result, setResult } = useSimulationStore();
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(iterations);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>();
  const workerRef = useRef<Worker>();

  const run = useCallback(() => {
    setIsRunning(true);
    setError(undefined);
    setCompleted(0);
    setTotal(iterations);

    if (typeof Worker === 'undefined') {
      try {
        const next = runSimulation(teams, weights, iterations, (done, count) => {
          setCompleted(done);
          setTotal(count);
        });
        setResult(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Simulation failed');
      } finally {
        setIsRunning(false);
      }
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../simulation/worker.ts', import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type === 'progress') {
        setCompleted(event.data.completed);
        setTotal(event.data.total);
      }
      if (event.data.type === 'complete') {
        setResult(event.data.result);
        setIsRunning(false);
        worker.terminate();
      }
      if (event.data.type === 'error') {
        setError(event.data.message);
        setIsRunning(false);
        worker.terminate();
      }
    };
    worker.postMessage({ teams, weights, iterations });
  }, [iterations, setResult, weights]);

  useEffect(() => {
    if (!result) run();
    return () => workerRef.current?.terminate();
  }, []);

  return {
    result,
    weights,
    run,
    isRunning,
    error,
    completed,
    total,
    progress: total ? Math.round((completed / total) * 100) : 0
  };
}
