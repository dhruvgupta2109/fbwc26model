import { expectedGoals } from './factors';
import { poisson } from './poisson';
import type {
  BracketSlot,
  GoldenBootProjection,
  GroupProjection,
  GroupTeamProjection,
  MatchProjection,
  SimulationResult,
  Team,
  TeamProbability,
  UpsetProjection,
  Weights
} from './types';

interface TableRow {
  code: string;
  pts: number;
  gf: number;
  ga: number;
  wins: number;
}

interface MatchResult {
  teamA: Team;
  teamB: Team;
  goalsA: number;
  goalsB: number;
  winner: Team;
  winA: number;
  winB: number;
  upset: boolean;
}

interface Counters {
  win: number;
  finalist: number;
  semiFinal: number;
  quarterFinal: number;
  roundOf16: number;
  roundOf32: number;
}

interface AggregateState {
  counters: Record<string, Counters>;
  group: Record<string, Record<string, { pts: number; gf: number; ga: number; qualified: number; position: number }>>;
  sampleGroupMatches: Record<string, MatchProjection[]>;
  sampleBracket: BracketSlot[];
  golden: Record<string, { player: string; team: string; goals: number; hits: number }>;
  upsets: Record<string, UpsetProjection & { hits: number }>;
}

const STAGE_ORDER: BracketSlot['stage'][] = ['R32', 'R16', 'QF', 'SF', 'Final'];
const START_DATE = new Date('2026-06-11T16:00:00Z');
const ACTUAL_R32_PAIRS: Array<[string, string]> = [
  ['RSA', 'CAN'],
  ['GER', 'PAR'],
  ['NED', 'MAR'],
  ['BRA', 'JPN'],
  ['CIV', 'NOR'],
  ['FRA', 'SWE'],
  ['MEX', 'ECU'],
  ['ENG', 'COD'],
  ['BEL', 'SEN'],
  ['USA', 'BIH'],
  ['ESP', 'AUT'],
  ['POR', 'CRO'],
  ['SUI', 'ALG'],
  ['AUS', 'EGY'],
  ['ARG', 'CPV'],
  ['COL', 'GHA']
];

function matchDate(offset: number): string {
  const date = new Date(START_DATE);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function pct(value: number, iterations: number): number {
  return Number(((value / iterations) * 100).toFixed(1));
}

function makeCounters(): Counters {
  return { win: 0, finalist: 0, semiFinal: 0, quarterFinal: 0, roundOf16: 0, roundOf32: 0 };
}

function winProbability(teamA: Team, teamB: Team, date: string, weights: Weights): [number, number] {
  const xgA = expectedGoals(teamA, teamB, date, weights);
  const xgB = expectedGoals(teamB, teamA, date, weights);
  const diff = xgA - xgB + (teamA.elo - teamB.elo) / 950;
  const winA = 1 / (1 + Math.exp(-diff));
  return [winA, 1 - winA];
}

function playMatch(teamA: Team, teamB: Team, date: string, weights: Weights, knockout = false): MatchResult {
  const xgA = expectedGoals(teamA, teamB, date, weights);
  const xgB = expectedGoals(teamB, teamA, date, weights);
  let goalsA = poisson(xgA);
  let goalsB = poisson(xgB);
  const [winA, winB] = winProbability(teamA, teamB, date, weights);

  if (knockout && goalsA === goalsB) {
    goalsA += poisson(Math.max(0.05, xgA * 0.28));
    goalsB += poisson(Math.max(0.05, xgB * 0.28));
    if (goalsA === goalsB) {
      const penaltyTilt = 0.48 + (teamA.elo - teamB.elo) / 4200 + (teamA.form - teamB.form) / 900;
      if (Math.random() < Math.max(0.35, Math.min(0.65, penaltyTilt))) goalsA += 1;
      else goalsB += 1;
    }
  }

  const winner = goalsA > goalsB ? teamA : goalsB > goalsA ? teamB : Math.random() < winA ? teamA : teamB;
  const underdog = teamA.elo < teamB.elo ? teamA : teamB;
  const underdogChance = underdog.code === teamA.code ? winA : winB;

  return {
    teamA,
    teamB,
    goalsA,
    goalsB,
    winner,
    winA,
    winB,
    upset: underdog.fifaRank > 16 && underdogChance > 0.3
  };
}

function rankRows<T extends TableRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || b.wins - a.wins || a.code.localeCompare(b.code));
}

function simulateGroups(teams: Team[], weights: Weights, aggregate: AggregateState, iteration: number): Team[] {
  const qualifiers: Team[] = [];
  const thirds: Array<TableRow & { group: string }> = [];
  const byGroup = new Map<string, Team[]>();

  teams.forEach((team) => byGroup.set(team.group, [...(byGroup.get(team.group) ?? []), team]));

  Array.from(byGroup.entries()).forEach(([group, groupTeams], groupIndex) => {
    const rows: Record<string, TableRow> = Object.fromEntries(groupTeams.map((team) => [team.code, { code: team.code, pts: 0, gf: 0, ga: 0, wins: 0 }]));
    const sampleMatches: MatchProjection[] = [];
    let matchCounter = 0;

    for (let i = 0; i < groupTeams.length; i += 1) {
      for (let j = i + 1; j < groupTeams.length; j += 1) {
        const date = matchDate(groupIndex * 3 + matchCounter);
        const result = playMatch(groupTeams[i], groupTeams[j], date, weights, false);
        const rowA = rows[result.teamA.code];
        const rowB = rows[result.teamB.code];
        rowA.gf += result.goalsA;
        rowA.ga += result.goalsB;
        rowB.gf += result.goalsB;
        rowB.ga += result.goalsA;

        if (result.goalsA > result.goalsB) {
          rowA.pts += 3;
          rowA.wins += 1;
        } else if (result.goalsB > result.goalsA) {
          rowB.pts += 3;
          rowB.wins += 1;
        } else {
          rowA.pts += 1;
          rowB.pts += 1;
        }

        if (iteration === 1) {
          sampleMatches.push({
            id: `${group}-${matchCounter}`,
            date,
            stage: `Group ${group}`,
            teamA: result.teamA.code,
            teamB: result.teamB.code,
            goalsA: result.goalsA,
            goalsB: result.goalsB,
            winA: Number((result.winA * 100).toFixed(1)),
            winB: Number((result.winB * 100).toFixed(1)),
            upset: result.upset
          });
        }
        matchCounter += 1;
      }
    }

    const ranked = rankRows(Object.values(rows));
    ranked.forEach((row, index) => {
      const groupAgg = aggregate.group[group][row.code];
      groupAgg.pts += row.pts;
      groupAgg.gf += row.gf;
      groupAgg.ga += row.ga;
      groupAgg.position += index + 1;
    });

    qualifiers.push(...ranked.slice(0, 2).map((row) => groupTeams.find((team) => team.code === row.code)!));
    ranked.slice(0, 2).forEach((row) => {
      aggregate.group[group][row.code].qualified += 1;
    });
    thirds.push({ ...ranked[2], group });
    if (iteration === 1) aggregate.sampleGroupMatches[group] = sampleMatches;
  });

  rankRows(thirds).slice(0, 8).forEach((row) => {
    const team = teams.find((candidate) => candidate.code === row.code)!;
    qualifiers.push(team);
    aggregate.group[row.group][row.code].qualified += 1;
  });

  return qualifiers;
}

function playRound(teams: Team[], stage: BracketSlot['stage'], weights: Weights, aggregate: AggregateState, iteration: number): Team[] {
  const winners: Team[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    const date = matchDate(20 + STAGE_ORDER.indexOf(stage) * 4 + i / 2);
    const result = playMatch(teams[i], teams[i + 1], date, weights, true);
    winners.push(result.winner);

    if (iteration === 1) {
      aggregate.sampleBracket.push({
        id: `${stage}-${i / 2}`,
        stage,
        teamA: result.teamA.code,
        teamB: result.teamB.code,
        winner: result.winner.code,
        winA: Number((result.winA * 100).toFixed(1)),
        winB: Number((result.winB * 100).toFixed(1)),
        upset: result.upset
      });
    }

    if (result.upset) {
      const underdog = result.teamA.elo < result.teamB.elo ? result.teamA : result.teamB;
      const target = result.teamA.elo < result.teamB.elo ? result.teamB : result.teamA;
      const key = `${underdog.code}-${target.code}`;
      aggregate.upsets[key] = aggregate.upsets[key] ?? { team: underdog.code, target: target.code, probability: 0, hits: 0 };
      aggregate.upsets[key].hits += 1;
    }
  }
  return winners;
}

function addStage(counters: Record<string, Counters>, teams: Team[], stage: keyof Counters): void {
  teams.forEach((team) => {
    counters[team.code][stage] += 1;
  });
}

function recordGoldenBoot(aggregate: AggregateState, teams: Team[]): void {
  const weighted = [...teams].sort((a, b) => b.xgFor * b.squadQuality * Math.random() - a.xgFor * a.squadQuality * Math.random());
  const scorer = weighted[0];
  const goals = Math.max(3, Math.round(scorer.xgFor * 2 + Math.random() * 4));
  const key = `${scorer.code}-${scorer.captain}`;
  aggregate.golden[key] = aggregate.golden[key] ?? { player: scorer.captain, team: scorer.code, goals: 0, hits: 0 };
  aggregate.golden[key].goals += goals;
  aggregate.golden[key].hits += 1;
}

function emptyAggregate(teams: Team[]): AggregateState {
  const group: AggregateState['group'] = {};
  teams.forEach((team) => {
    group[team.group] = group[team.group] ?? {};
    group[team.group][team.code] = { pts: 0, gf: 0, ga: 0, qualified: 0, position: 0 };
  });

  return {
    counters: Object.fromEntries(teams.map((team) => [team.code, makeCounters()])),
    group,
    sampleGroupMatches: {},
    sampleBracket: [],
    golden: {},
    upsets: {}
  };
}

function pairCodes(codes: string[]): Array<[string | undefined, string | undefined]> {
  const ordered = [...codes];
  const pairs: Array<[string | undefined, string | undefined]> = [];

  while (ordered.length > 0) {
    pairs.push([ordered.shift(), ordered.pop()]);
  }

  return pairs;
}

function probabilityWinner(teamA: string | undefined, teamB: string | undefined, winProbabilityByCode: Record<string, number>) {
  if (!teamA) return teamB;
  if (!teamB) return teamA;
  return (winProbabilityByCode[teamB] ?? 0) > (winProbabilityByCode[teamA] ?? 0) ? teamB : teamA;
}

function buildProbabilityBracket(sampleBracket: BracketSlot[], teamResults: TeamProbability[]): BracketSlot[] {
  const winProbabilityByCode = Object.fromEntries(teamResults.map((team) => [team.code, team.win]));
  const slotsByStage = new Map<BracketSlot['stage'], BracketSlot[]>();
  sampleBracket.forEach((slot) => {
    const current = slotsByStage.get(slot.stage) ?? [];
    current.push(slot);
    slotsByStage.set(slot.stage, current);
  });

  const bracket: BracketSlot[] = [];
  let previousWinners: string[] = [];

  STAGE_ORDER.forEach((stage) => {
    const sourceSlots = slotsByStage.get(stage) ?? [];
    const pairs =
      stage === 'R32'
        ? ACTUAL_R32_PAIRS
        : pairCodes(previousWinners);
    const winners: string[] = [];

    pairs.forEach(([teamA, teamB], index) => {
      const sourceSlot = sourceSlots[index];
      const winner = probabilityWinner(teamA, teamB, winProbabilityByCode);
      if (winner) winners.push(winner);

      bracket.push({
        ...sourceSlot,
        id: sourceSlot?.id ?? `${stage}-${index}`,
        stage,
        teamA,
        teamB,
        winner,
        winA: teamA ? winProbabilityByCode[teamA] ?? 0 : undefined,
        winB: teamB ? winProbabilityByCode[teamB] ?? 0 : undefined,
        upset: false
      });
    });

    previousWinners = winners;
  });

  const champion = previousWinners[0] ?? teamResults[0]?.code;
  return [...bracket, { id: 'champion', stage: 'Champion', winner: champion }];
}

function buildResult(teams: Team[], iterations: number, aggregate: AggregateState): SimulationResult {
  const teamResults: TeamProbability[] = teams
    .map((team) => ({
      code: team.code,
      win: pct(aggregate.counters[team.code].win, iterations),
      finalist: pct(aggregate.counters[team.code].finalist, iterations),
      semiFinal: pct(aggregate.counters[team.code].semiFinal, iterations),
      quarterFinal: pct(aggregate.counters[team.code].quarterFinal, iterations),
      roundOf16: pct(aggregate.counters[team.code].roundOf16, iterations),
      roundOf32: pct(aggregate.counters[team.code].roundOf32, iterations)
    }))
    .sort((a, b) => b.win - a.win);

  const groups: GroupProjection[] = Object.entries(aggregate.group)
    .map(([group, rows]) => ({
      group,
      teams: Object.entries(rows)
        .map(([code, row]): GroupTeamProjection => ({
          code,
          avgPoints: Number((row.pts / iterations).toFixed(1)),
          avgGf: Number((row.gf / iterations).toFixed(1)),
          avgGa: Number((row.ga / iterations).toFixed(1)),
          qualificationProbability: pct(row.qualified, iterations),
          position: Number((row.position / iterations).toFixed(1))
        }))
        .sort((a, b) => a.position - b.position),
      matches: aggregate.sampleGroupMatches[group] ?? []
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  const goldenBoot: GoldenBootProjection[] = Object.values(aggregate.golden)
    .map((row) => ({
      player: row.player,
      team: row.team,
      projectedGoals: Number((row.goals / row.hits).toFixed(1)),
      probability: pct(row.hits, iterations)
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  const upsetWatch = Object.values(aggregate.upsets)
    .map((row) => ({ team: row.team, target: row.target, probability: pct(row.hits, iterations) }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  const champion = teamResults[0].code;
  const championTeam = teams.find((team) => team.code === champion)!;
  const explainability = [
    `${championTeam.name} combines a ${championTeam.elo} Elo baseline with ${championTeam.squadQuality}/100 squad quality.`,
    `${championTeam.name} projects ${championTeam.xgFor.toFixed(2)} xG for and ${championTeam.xgAgainst.toFixed(2)} xG against per match.`,
    `${championTeam.captain} gives the model a high-impact captain profile, while fun factors stay below 5% combined by default.`
  ];

  return {
    iterations,
    generatedAt: new Date().toISOString(),
    teams: teamResults,
    groups,
    bracket: buildProbabilityBracket(aggregate.sampleBracket, teamResults),
    champion,
    finalists: teamResults.slice(0, 2).map((team) => team.code),
    goldenBoot,
    upsetWatch,
    explainability
  };
}

export function runSimulation(
  teams: Team[],
  weights: Weights,
  iterations = 10_000,
  onProgress?: (completed: number, total: number) => void
): SimulationResult {
  const aggregate = emptyAggregate(teams);

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const qualified = simulateGroups(teams, weights, aggregate, iteration);
    addStage(aggregate.counters, qualified, 'roundOf32');

    let round = [...qualified].sort((a, b) => b.elo - a.elo || a.code.localeCompare(b.code));
    const r16 = playRound(pairSeeds(round), 'R32', weights, aggregate, iteration);
    addStage(aggregate.counters, r16, 'roundOf16');
    const qf = playRound(pairSeeds(r16), 'R16', weights, aggregate, iteration);
    addStage(aggregate.counters, qf, 'quarterFinal');
    const sf = playRound(pairSeeds(qf), 'QF', weights, aggregate, iteration);
    addStage(aggregate.counters, sf, 'semiFinal');
    const finalists = playRound(pairSeeds(sf), 'SF', weights, aggregate, iteration);
    addStage(aggregate.counters, finalists, 'finalist');
    const champion = playRound(finalists, 'Final', weights, aggregate, iteration)[0];
    aggregate.counters[champion.code].win += 1;
    recordGoldenBoot(aggregate, [...qualified, ...finalists, champion]);

    if (iteration % 1000 === 0 || iteration === iterations) onProgress?.(iteration, iterations);
  }

  return buildResult(teams, iterations, aggregate);
}

function pairSeeds(teams: Team[]): Team[] {
  const ordered = [...teams];
  const paired: Team[] = [];
  while (ordered.length > 0) {
    paired.push(ordered.shift()!);
    paired.push(ordered.pop()!);
  }
  return paired;
}
