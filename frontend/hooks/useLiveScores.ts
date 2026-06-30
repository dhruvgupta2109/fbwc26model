'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { withBasePath } from '@/lib/basePath';
import {
  fetchLiveScores,
  isInLiveFeedRefreshWindow,
  isInTournamentWindow,
  tournamentCountdownMs,
  type LiveScoreCache
} from '@/lib/liveScores';

const LIVE_FEED_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const LIVE_SCORE_CACHE_KEY = 'wc26-live-score-feed';

export type { GoalEvent, LiveMatch, LiveScoreCache } from '@/lib/liveScores';

export function useLiveScores() {
  const now = new Date();
  const staticCacheUrl = withBasePath('/data/live-scores.json');
  const inTournamentWindow = isInTournamentWindow(now);
  const inLiveFeedRefreshWindow = isInLiveFeedRefreshWindow(now);
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveScoreCache>(
    LIVE_SCORE_CACHE_KEY,
    () => fetchLiveScores(staticCacheUrl),
    {
      refreshInterval: inLiveFeedRefreshWindow ? LIVE_FEED_REFRESH_INTERVAL_MS : 0,
      revalidateOnFocus: false,
      dedupingInterval: 5_000
    }
  );

  const refresh = useCallback(
    () => mutate(fetchLiveScores(staticCacheUrl, { forceLive: true }), { revalidate: false }),
    [mutate, staticCacheUrl]
  );

  const countdownMs = tournamentCountdownMs(now);
  return {
    matches: data?.matches ?? [],
    source: data?.source,
    sourceUrl: data?.sourceUrl,
    generatedAt: data?.generatedAt,
    cacheDate: data?.cacheDate,
    warning: data?.warning,
    error,
    isLoading,
    isRefreshing: isValidating,
    mutate,
    refresh,
    inTournamentWindow,
    countdownMs
  };
}
