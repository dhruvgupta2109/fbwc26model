'use client';

import useSWR from 'swr';
import { groups, playerSpotlights } from '@/lib/data';

const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');

export interface GoalEvent {
  team: string;
  minute: number;
  scorer: string;
  assist?: string;
}

export interface LiveMatch {
  id: string;
  kickoff: string;
  stage: string;
  venue: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  score: string;
  status: 'Live' | 'FT' | 'Upcoming';
  minute?: number;
  goals: GoalEvent[];
  motm?: string;
}

const venues = [
  'MetLife Stadium',
  'SoFi Stadium',
  'AT&T Stadium',
  'Mercedes-Benz Stadium',
  'Estadio Azteca',
  'BC Place',
  'Hard Rock Stadium',
  'Lumen Field',
  'Lincoln Financial Field',
  'BMO Field',
  'NRG Stadium',
  "Levi's Stadium"
];

function scoreFor(homeIndex: number, awayIndex: number, matchIndex: number, played: boolean): [number, number] {
  if (!played) return [0, 0];
  const homeScore = (homeIndex * 2 + matchIndex + 1) % 4;
  const awayScore = (awayIndex + matchIndex) % 3;
  return [homeScore, awayScore];
}

function goalEvents(homeCode: string, awayCode: string, homeScore: number, awayScore: number): GoalEvent[] {
  const homePlayers = playerSpotlights[homeCode] ?? [];
  const awayPlayers = playerSpotlights[awayCode] ?? [];
  const events: GoalEvent[] = [];

  for (let index = 0; index < homeScore; index += 1) {
    events.push({
      team: homeCode,
      minute: 12 + index * 23,
      scorer: homePlayers[index % homePlayers.length]?.name ?? 'Goal scorer',
      assist: homePlayers[(index + 1) % homePlayers.length]?.name
    });
  }

  for (let index = 0; index < awayScore; index += 1) {
    events.push({
      team: awayCode,
      minute: 19 + index * 21,
      scorer: awayPlayers[index % awayPlayers.length]?.name ?? 'Goal scorer',
      assist: awayPlayers[(index + 1) % awayPlayers.length]?.name
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

function buildFallbackScores(): LiveMatch[] {
  const now = new Date();
  let matchIndex = 0;

  return groups
    .flatMap((group) => {
      const [a, b, c, d] = group.teams;
      const pairings = [
        [a, b],
        [c, d],
        [a, c],
        [b, d],
        [a, d],
        [b, c]
      ];

      return pairings.map(([home, away], groupMatchIndex) => {
        const kickoff = new Date(Date.UTC(2026, 5, 11, 16 + matchIndex * 8));
        const isLive = now >= kickoff && now.getTime() - kickoff.getTime() < 7_200_000;
        const isPlayed = now > kickoff || isLive;
        const [homeScore, awayScore] = scoreFor(group.teams.indexOf(home), group.teams.indexOf(away), groupMatchIndex, isPlayed);
        const goals = goalEvents(home.code, away.code, homeScore, awayScore);
        const status: LiveMatch['status'] = isLive ? 'Live' : now > kickoff ? 'FT' : 'Upcoming';
        const leadingCode = homeScore >= awayScore ? home.code : away.code;
        const motm = status === 'Upcoming' ? undefined : playerSpotlights[leadingCode]?.[0]?.name;

        matchIndex += 1;

        return {
          id: `${group.group}-${groupMatchIndex + 1}`,
          kickoff: kickoff.toISOString(),
          stage: `Group ${group.group}`,
          venue: venues[matchIndex % venues.length],
          home: home.name,
          away: away.name,
          homeCode: home.code,
          awayCode: away.code,
          homeScore,
          awayScore,
          score: `${homeScore}-${awayScore}`,
          status,
          minute: isLive ? Math.min(90, Math.max(1, Math.floor((now.getTime() - kickoff.getTime()) / 60_000))) : undefined,
          goals,
          motm
        };
      });
    })
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
}

async function fallbackScores(): Promise<LiveMatch[]> {
  return buildFallbackScores();
}

export function useLiveScores() {
  const now = new Date();
  const inTournamentWindow = now >= TOURNAMENT_START && now <= TOURNAMENT_END;
  const { data, isLoading, mutate } = useSWR('live-scores', fallbackScores, {
    refreshInterval: inTournamentWindow ? 60_000 : 0
  });

  const countdownMs = Math.max(0, TOURNAMENT_START.getTime() - now.getTime());
  return { matches: data ?? [], isLoading, mutate, inTournamentWindow, countdownMs };
}
