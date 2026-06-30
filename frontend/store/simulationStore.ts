'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS, normalizeWeights } from '@/simulation/factors';
import type { SimulationResult, Weights } from '@/simulation/types';

interface HistoryEntry {
  id: string;
  weights: Weights;
  champion: string;
  generatedAt: string;
}

interface SimulationState {
  weights: Weights;
  result?: SimulationResult;
  history: HistoryEntry[];
  setWeight: (key: keyof Weights, value: number) => void;
  setWeights: (weights: Weights) => void;
  resetWeights: () => void;
  setResult: (result: SimulationResult) => void;
}

function hasCompleteWeights(weights: Partial<Weights> | undefined): weights is Weights {
  return Boolean(weights && Object.keys(DEFAULT_WEIGHTS).every((key) => typeof weights[key as keyof Weights] === 'number'));
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      weights: DEFAULT_WEIGHTS,
      history: [],
      setWeight: (key, value) =>
        set((state) => {
          const next = { ...state.weights, [key]: value };
          return { weights: normalizeWeights(next) };
        }),
      setWeights: (weights) => set({ weights: normalizeWeights(weights) }),
      resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
      setResult: (result) =>
        set((state) => ({
          result,
          history: [
            { id: result.generatedAt, weights: state.weights, champion: result.champion, generatedAt: result.generatedAt },
            ...state.history
          ].slice(0, 3)
        }))
    }),
    {
      name: 'wc26-oracle-state',
      partialize: (state) => ({ weights: state.weights, history: state.history }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SimulationState> | undefined;
        const weights = hasCompleteWeights(persisted?.weights) ? persisted.weights : DEFAULT_WEIGHTS;
        return {
          ...currentState,
          ...persisted,
          weights: normalizeWeights(weights),
          history: persisted?.history ?? currentState.history
        };
      }
    }
  )
);
