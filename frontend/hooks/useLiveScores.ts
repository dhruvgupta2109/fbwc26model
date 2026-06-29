'use client';

import useSWR from 'swr';
import { withBasePath } from '@/lib/basePath';

const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');
const LIVE_FEED_REFRESH_UNTIL = new Date('2026-07-20T23:59:59Z');
const LIVE_FEED_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

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
  const inLiveFeedRefreshWindow = now >= TOURNAMENT_START && now <= LIVE_FEED_REFRESH_UNTIL;
  const { data, error, isLoading, mutate } = useSWR(withBasePath('/data/live-scores.json'), fetcher, {
    refreshInterval: inLiveFeedRefreshWindow ? LIVE_FEED_REFRESH_INTERVAL_MS : 0,
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
