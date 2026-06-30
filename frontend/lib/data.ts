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
  {
    title: 'Seven-Year Scientific Project to Replace NFL Turf',
    description:
      'FIFA strictly mandates that matches are played on living grass. Because eight of the 16 North American stadiums use artificial turf and five have roofs, scientists spent seven years engineering a unique hybrid grass (95% natural, 5% artificial) that can thrive indoors.'
  },
  {
    title: 'The Debut of the Smallest Nation in World Cup History',
    description:
      'The expanded 48-team format opened the doors for four debut nations: Cape Verde, Jordan, Uzbekistan, and Curaçao. With a population of roughly 156,000, Curaçao officially becomes the smallest nation by population ever to reach a men\'s World Cup.'
  },
  {
    title: 'Lionel Messi Broken All-Time Goal Records',
    description:
      'During Argentina\'s group stage match against Austria on June 22, 2026, Lionel Messi scored twice to claim the title of all-time top scorer in FIFA World Cup history with 18 total tournament goals, breaking his tie with Miroslav Klose and Kylian Mbappé.'
  },
  {
    title: 'Extreme Travel Involving 25 "Non-Host" Cities',
    description:
      'Because the two furthest venues are roughly 2,700 miles apart, teams are suffering heavy travel strain. To accommodate the massive footprint, FIFA finalized 48 separate Team Base Camps spread across 25 communities that aren\'t even hosting games, bringing the World Cup buzz to college towns like Wake Forest and Stockton University.'
  }
];
