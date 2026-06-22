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
      partialize: (state) => ({ weights: state.weights, history: state.history })
    }
  )
);
