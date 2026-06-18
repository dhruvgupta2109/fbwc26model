'use client';

import useSWR from 'swr';

const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');

export interface GoalEvent {
  team: string;
  minute?: string;
  scorer: string;
  assist?: string;
  text?: string;
}

export interface LiveMatch {
  id: string;
  kickoff: string;
  stage: string;
  venue: string;
  sourceUrl?: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  score: string;
  status: 'Live' | 'FT' | 'Upcoming';
  minute?: string;
  goals: GoalEvent[];
  motm?: string;
}

interface LiveScoreCache {
  source: string;
  sourceUrl: string;
  cacheDate: string;
  generatedAt: string;
  matches: LiveMatch[];
}

async function fetcher(url: string): Promise<LiveScoreCache> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load live score cache: ${response.status}`);
  return response.json();
}

export function useLiveScores() {
  const now = new Date();
  const inTournamentWindow = now >= TOURNAMENT_START && now <= TOURNAMENT_END;
  const { data, error, isLoading, mutate } = useSWR('/data/live-scores.json', fetcher, {
    refreshInterval: 86_400_000,
    revalidateOnFocus: false
  });

  const countdownMs = Math.max(0, TOURNAMENT_START.getTime() - now.getTime());
  return {
    matches: data?.matches ?? [],
    source: data?.source,
    sourceUrl: data?.sourceUrl,
    generatedAt: data?.generatedAt,
    cacheDate: data?.cacheDate,
    error,
    isLoading,
    mutate,
    inTournamentWindow,
    countdownMs
  };
}
