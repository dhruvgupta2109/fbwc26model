import teamsJson from '@/public/data/teams.json';
import type { Team } from '@/simulation/types';

export const teams = teamsJson as Team[];

export const groups = Array.from(new Set(teams.map((team) => team.group))).map((group) => ({
  group,
  teams: teams.filter((team) => team.group === group)
}));

export function getTeam(code: string): Team | undefined {
  return teams.find((team) => team.code.toLowerCase() === code.toLowerCase());
}

export function flagUrl(team: Pick<Team, 'flag'>): string {
  return `https://flagcdn.com/w80/${team.flag}.png`;
}

export const playerSpotlights: Record<string, Array<{ name: string; position: string; club: string; caps: number; goals: number; xg: number }>> =
  Object.fromEntries(
    teams.map((team) => [
      team.code,
      [
        { name: team.captain, position: team.code === 'CAN' ? 'LB' : 'FW', club: 'National team pool', caps: 88, goals: Math.max(4, Math.round(team.xgFor * 12)), xg: Number((team.xgFor / 1.4).toFixed(2)) },
        { name: `${team.name} creator`, position: 'MF', club: 'Top flight club', caps: 54, goals: Math.max(2, Math.round(team.form / 8)), xg: Number((team.xgFor / 2).toFixed(2)) },
        { name: `${team.name} anchor`, position: 'DF', club: 'Top flight club', caps: 61, goals: Math.max(1, Math.round((100 - team.xgAgainst * 35) / 20)), xg: 0.08 }
      ]
    ])
  );

export const funFacts = [
  'CONCACAF sides receive a home-continent boost in the default model.',
  'Full moon matchdays add a small chaos modifier to both teams.',
  'Captain and manager birthdays are deliberately labelled as fun factors.',
  'The top two teams in every group advance, plus the eight best third-place teams.'
];
