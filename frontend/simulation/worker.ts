import { runSimulation } from './engine';
import type { Team, Weights, WorkerMessage } from './types';

self.onmessage = (event: MessageEvent<{ teams: Team[]; weights: Weights; iterations: number }>) => {
  try {
    const { teams, weights, iterations } = event.data;
    const result = runSimulation(teams, weights, iterations, (completed, total) => {
      self.postMessage({ type: 'progress', completed, total } satisfies WorkerMessage);
    });
    self.postMessage({ type: 'complete', result } satisfies WorkerMessage);
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Simulation failed'
    } satisfies WorkerMessage);
  }
};

export {};
