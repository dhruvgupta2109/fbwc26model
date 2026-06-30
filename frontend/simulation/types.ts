export type Confederation = 'UEFA' | 'CONMEBOL' | 'CAF' | 'AFC' | 'CONCACAF' | 'OFC';

export interface Team {
  code: string;
  name: string;
  flag: string;
  confederation: Confederation;
  group: string;
  fifaRank: number;
  elo: number;
  titles: number;
  appearances: number;
  bestResult: string;
  captain: string;
  captainBirthday: string;
  manager: string;
  managerBirthday: string;
  form: number;
  xgFor: number;
  xgAgainst: number;
  squadQuality: number;
  lucky: number;
}

export type WeightKey =
  | 'fifaRank'
  | 'elo'
  | 'form'
  | 'xgFor'
  | 'xgAgainst'
  | 'squad'
  | 'titles'
  | 'appearances'
  | 'h2h'
  | 'home'
  | 'captainBirthday'
  | 'managerBirthday'
  | 'lucky'
  | 'moon';

export type Weights = Record<WeightKey, number>;

export interface MatchProjection {
  id: string;
  date: string;
  stage: string;
  teamA: string;
  teamB: string;
  goalsA: number;
  goalsB: number;
  winA: number;
  winB: number;
  upset: boolean;
}

export interface GroupTeamProjection {
  code: string;
  avgPoints: number;
  avgGf: number;
  avgGa: number;
  qualificationProbability: number;
  position: number;
}

export interface GroupProjection {
  group: string;
  teams: GroupTeamProjection[];
  matches: MatchProjection[];
}

export interface BracketSlot {
  id: string;
  stage: 'R32' | 'R16' | 'QF' | 'SF' | 'Final' | 'Champion';
  teamA?: string;
  teamB?: string;
  winner?: string;
  scoreA?: number;
  scoreB?: number;
  winA?: number;
  winB?: number;
  upset?: boolean;
}

export interface TeamProbability {
  code: string;
  win: number;
  finalist: number;
  semiFinal: number;
  quarterFinal: number;
  roundOf16: number;
  roundOf32: number;
}

export interface GoldenBootProjection {
  player: string;
  team: string;
  projectedGoals: number;
  probability: number;
}

export interface UpsetProjection {
  team: string;
  target: string;
  probability: number;
}

export interface SimulationResult {
  iterations: number;
  generatedAt: string;
  teams: TeamProbability[];
  groups: GroupProjection[];
  bracket: BracketSlot[];
  champion: string;
  finalists: string[];
  goldenBoot: GoldenBootProjection[];
  upsetWatch: UpsetProjection[];
  explainability: string[];
}

export interface WorkerProgress {
  type: 'progress';
  completed: number;
  total: number;
  partial?: SimulationResult;
}

export interface WorkerComplete {
  type: 'complete';
  result: SimulationResult;
}

export interface WorkerFailure {
  type: 'error';
  message: string;
}

export type WorkerMessage = WorkerProgress | WorkerComplete | WorkerFailure;
