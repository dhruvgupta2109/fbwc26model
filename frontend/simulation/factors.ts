import { getMoonPhase } from '@/lib/moonPhase';
import type { Team, Weights } from './types';

export const DEFAULT_WEIGHTS: Weights = {
  elo: 0.2,
  fifaRank: 0.14,
  form: 0.14,
  xgFor: 0.105,
  xgAgainst: 0.105,
  squad: 0.14,
  titles: 0.035,
  appearances: 0.035,
  h2h: 0.04,
  home: 0.04,
  captainBirthday: 0.005,
  managerBirthday: 0.005,
  lucky: 0.005,
  moon: 0.005
};

export const FACTOR_LABELS: Record<keyof Weights, { label: string; detail: string; fun?: boolean }> = {
  elo: { label: 'Elo Rating', detail: 'Current team strength baseline from Elo-style inputs.' },
  fifaRank: { label: 'FIFA Ranking', detail: 'Official ranking signal, inverted so lower ranks score higher.' },
  form: { label: 'Recent Form', detail: 'Recent wins, scoring pace, and defensive trend proxy.' },
  xgFor: { label: 'Attacking xG', detail: 'Expected goals created per 90 minutes.' },
  xgAgainst: { label: 'Defensive xG', detail: 'Expected goals allowed per 90 minutes, inverted so lower is better.' },
  squad: { label: 'Squad Quality', detail: 'Player quality proxy from squad depth and club level.' },
  titles: { label: 'World Cup Titles', detail: 'Tournament-winning pedigree, capped so history does not dominate.' },
  appearances: { label: 'World Cup Appearances', detail: 'Big-tournament experience across previous finals.' },
  h2h: { label: 'Matchup Profile', detail: 'Small opponent-specific modifier from rating, form, and tournament profile gaps.' },
  home: { label: 'Home Continent Advantage', detail: 'CONCACAF gets a host-region boost; CONMEBOL gets a smaller nearby-region boost.' },
  captainBirthday: { label: "Captain's Birthday", detail: 'Fun boost if the captain birthday is within three days of matchday.', fun: true },
  managerBirthday: { label: "Manager's Birthday", detail: 'Fun boost if the manager birthday is within three days of matchday.', fun: true },
  lucky: { label: 'Lucky Number', detail: 'Chaos factor based on squad number folklore.', fun: true },
  moon: { label: 'Moon Phase', detail: 'Waxing and full moon phases add small underdog chaos.', fun: true }
};

export function normalizeWeights(weights: Weights): Weights {
  const entries = Object.keys(DEFAULT_WEIGHTS).map((key) => {
    const weightKey = key as keyof Weights;
    const value = weights[weightKey];
    return [weightKey, Number.isFinite(value) ? Math.max(0, value) : DEFAULT_WEIGHTS[weightKey]] as const;
  });
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return Object.fromEntries(
    entries.map(([key, value]) => [key, value / total])
  ) as Weights;
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function dayOfYear(dateInput: string): number {
  const date = new Date(dateInput);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function birthdayWindow(birthday: string, matchDate: string): number {
  const birthdayDay = dayOfYear(`2026-${birthday.slice(5)}`);
  const matchDay = dayOfYear(matchDate);
  const diff = Math.min(Math.abs(birthdayDay - matchDay), 365 - Math.abs(birthdayDay - matchDay));
  return diff <= 3 ? 1 : 0;
}

function homeScore(team: Team): number {
  if (team.confederation === 'CONCACAF') return 1;
  if (team.confederation === 'CONMEBOL') return 0.45;
  return 0.1;
}

function h2hProxy(team: Team, opponent: Team): number {
  const ratingGap = normalize(team.elo - opponent.elo, -650, 650);
  const formGap = normalize(team.form - opponent.form, -40, 40);
  const tournamentPedigree = normalize(team.titles * 4 + team.appearances - opponent.titles * 4 - opponent.appearances, -42, 42);
  return ratingGap * 0.45 + formGap * 0.35 + tournamentPedigree * 0.2;
}

export function teamStrength(team: Team, opponent: Team, matchDate: string, weightsInput: Weights): number {
  const weights = normalizeWeights(weightsInput);
  const fifaRankScore = normalize(96 - team.fifaRank, 1, 95);
  const attackScore = normalize(team.xgFor, 0.9, 2.25);
  const defenseScore = normalize(1.45 - team.xgAgainst, 0.2, 0.75);
  const titlesScore = normalize(Math.min(team.titles, 5), 0, 5);
  const appearancesScore = normalize(Math.min(team.appearances, 20), 1, 20);
  const luckyScore = team.lucky / 6;
  const moon = getMoonPhase(matchDate);
  const underdog = team.elo < opponent.elo;
  const moonScore = moon === 'full' ? 0.55 + Math.random() * 0.35 : moon === 'waxing' && underdog ? 0.8 : moon === 'new' ? 0.35 : 0.5;

  return (
    weights.elo * normalize(team.elo, 1420, 2120) +
    weights.fifaRank * fifaRankScore +
    weights.form * (team.form / 100) +
    weights.xgFor * attackScore +
    weights.xgAgainst * defenseScore +
    weights.squad * (team.squadQuality / 100) +
    weights.titles * titlesScore +
    weights.appearances * appearancesScore +
    weights.h2h * h2hProxy(team, opponent) +
    weights.home * homeScore(team) +
    weights.captainBirthday * birthdayWindow(team.captainBirthday, matchDate) +
    weights.managerBirthday * birthdayWindow(team.managerBirthday, matchDate) +
    weights.lucky * luckyScore +
    weights.moon * moonScore
  );
}

export function expectedGoals(team: Team, opponent: Team, matchDate: string, weights: Weights): number {
  const own = teamStrength(team, opponent, matchDate, weights);
  const opp = teamStrength(opponent, team, matchDate, weights);
  const base = 0.72 + team.xgFor * 0.35 + Math.max(0, team.xgFor - opponent.xgAgainst) * 0.15;
  const differential = (own - opp) * 1.45;
  return Math.max(0.15, Math.min(3.4, base + differential));
}
