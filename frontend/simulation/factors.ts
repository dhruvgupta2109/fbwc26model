import { getMoonPhase } from '@/lib/moonPhase';
import type { Team, Weights } from './types';

export const DEFAULT_WEIGHTS: Weights = {
  elo: 0.25,
  form: 0.2,
  xg: 0.15,
  squad: 0.15,
  h2h: 0.1,
  home: 0.08,
  captainBirthday: 0.02,
  managerBirthday: 0.02,
  lucky: 0.01,
  moon: 0.02
};

export const FACTOR_LABELS: Record<keyof Weights, { label: string; detail: string; fun?: boolean }> = {
  elo: { label: 'FIFA / Elo Rating', detail: 'Current team strength baseline from rating-style inputs.' },
  form: { label: 'Recent Form', detail: 'Recent wins, scoring pace, and defensive trend proxy.' },
  xg: { label: 'xG Stats', detail: 'Expected goals for and against per 90 minutes.' },
  squad: { label: 'Squad Quality', detail: 'Player quality proxy from squad depth and club level.' },
  h2h: { label: 'Head-to-Head History', detail: 'Small matchup modifier from historical strength profile.' },
  home: { label: 'Home Continent Advantage', detail: 'CONCACAF gets a host-region boost; CONMEBOL gets a smaller nearby-region boost.' },
  captainBirthday: { label: "Captain's Birthday", detail: 'Fun boost if the captain birthday is within three days of matchday.', fun: true },
  managerBirthday: { label: "Manager's Birthday", detail: 'Fun boost if the manager birthday is within three days of matchday.', fun: true },
  lucky: { label: 'Lucky Number', detail: 'Chaos factor based on squad number folklore.', fun: true },
  moon: { label: 'Moon Phase', detail: 'Waxing and full moon phases add small underdog chaos.', fun: true }
};

export function normalizeWeights(weights: Weights): Weights {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.max(0, value) / total])
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
  const tournamentPedigree = normalize(team.titles * 6 + team.appearances - opponent.titles * 6 - opponent.appearances, -50, 50);
  return ratingGap * 0.7 + tournamentPedigree * 0.3;
}

export function teamStrength(team: Team, opponent: Team, matchDate: string, weightsInput: Weights): number {
  const weights = normalizeWeights(weightsInput);
  const xgScore = normalize(team.xgFor - team.xgAgainst, -0.7, 1.7);
  const luckyScore = team.lucky / 6;
  const moon = getMoonPhase(matchDate);
  const underdog = team.elo < opponent.elo;
  const moonScore = moon === 'full' ? 0.55 + Math.random() * 0.35 : moon === 'waxing' && underdog ? 0.8 : moon === 'new' ? 0.35 : 0.5;

  return (
    weights.elo * normalize(team.elo, 1420, 2120) +
    weights.form * (team.form / 100) +
    weights.xg * xgScore +
    weights.squad * (team.squadQuality / 100) +
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
