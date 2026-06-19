'use client';

import useSWR from 'swr';

const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');

export interface LiveMatch {
  id: string;
  home: string;
  away: string;
  score: string;
  status: 'Live' | 'FT' | 'Upcoming';
  minute?: number;
}

async function fallbackScores(): Promise<LiveMatch[]> {
  return [
    { id: '1', home: 'Mexico', away: 'South Africa', score: '2-1', status: 'FT' },
    { id: '2', home: 'United States', away: 'Australia', score: '0-0', status: 'Upcoming' },
    { id: '3', home: 'France', away: 'Norway', score: '1-1', status: 'Live', minute: 63 }
  ];
}

export function useLiveScores() {
  const now = new Date();
  const inTournamentWindow = now >= TOURNAMENT_START && now <= TOURNAMENT_END;
  const { data, isLoading, mutate } = useSWR(inTournamentWindow ? 'live-scores' : null, fallbackScores, {
    refreshInterval: 60_000
  });

  const countdownMs = Math.max(0, TOURNAMENT_START.getTime() - now.getTime());
  return { matches: data ?? [], isLoading, mutate, inTournamentWindow, countdownMs };
}
