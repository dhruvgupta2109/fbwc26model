export const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const SOURCE = 'ESPN FIFA World Cup scoreboard';
const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');
const LIVE_FEED_REFRESH_UNTIL = new Date('2026-07-20T23:59:59Z');
const CACHE_TIME_ZONE = 'Asia/Kolkata';
const SUMMARY_CONCURRENCY = 8;

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
  winnerCode?: string;
  goals: GoalEvent[];
  motm?: string;
}

export interface LiveScoreCache {
  source: string;
  sourceUrl: string;
  cacheDate: string;
  generatedAt: string;
  matches: LiveMatch[];
  warning?: string;
}

interface EspnTeam {
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
  logos?: Array<{ href?: string }>;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string | number;
  winner?: boolean;
  team?: EspnTeam;
}

interface EspnCompetition {
  date?: string;
  status?: {
    displayClock?: string;
    type?: {
      state?: string;
      completed?: boolean;
    };
  };
  venue?: {
    fullName?: string;
  };
  altGameNote?: string;
  competitors?: EspnCompetitor[];
}

interface EspnEvent {
  id?: string;
  date?: string;
  season?: {
    slug?: string;
  };
  competitions?: EspnCompetition[];
}

interface EspnScoreboard {
  events?: EspnEvent[];
}

interface EspnSummaryEvent {
  scoringPlay?: boolean;
  type?: {
    type?: string;
  };
  team?: EspnTeam;
  clock?: {
    displayValue?: string;
  };
  participants?: Array<{
    athlete?: {
      displayName?: string;
    };
  }>;
  shortText?: string;
  text?: string;
}

interface EspnLeader {
  athlete?: {
    displayName?: string;
  };
  statistics?: Array<{
    name?: string;
    value?: string | number;
  }>;
}

interface EspnSummary {
  keyEvents?: EspnSummaryEvent[];
  leaders?: Array<{
    team?: EspnTeam;
    leaders?: Array<{
      leaders?: EspnLeader[];
    }>;
  }>;
}

export function isInTournamentWindow(now = new Date()) {
  return now >= TOURNAMENT_START && now <= TOURNAMENT_END;
}

export function isInLiveFeedRefreshWindow(now = new Date()) {
  return now >= TOURNAMENT_START && now <= LIVE_FEED_REFRESH_UNTIL;
}

export function tournamentCountdownMs(now = new Date()) {
  return Math.max(0, TOURNAMENT_START.getTime() - now.getTime());
}

export async function fetchLiveScores(staticCacheUrl: string, options: { forceLive?: boolean; now?: Date } = {}): Promise<LiveScoreCache> {
  const now = options.now ?? new Date();

  if (options.forceLive || isInLiveFeedRefreshWindow(now)) {
    try {
      return await fetchEspnLiveScores(now);
    } catch (error) {
      const fallback = await fetchStaticLiveScores(staticCacheUrl);
      return {
        ...fallback,
        warning: `Using bundled score cache because the live ESPN fetch failed: ${errorMessage(error)}`
      };
    }
  }

  return fetchStaticLiveScores(staticCacheUrl);
}

export async function fetchStaticLiveScores(staticCacheUrl: string): Promise<LiveScoreCache> {
  const response = await fetch(staticCacheUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load live score cache: ${response.status}`);
  return response.json();
}

async function fetchEspnLiveScores(now: Date): Promise<LiveScoreCache> {
  const endDate = latestFetchDate(now);
  const scoreboard = await fetchJson<EspnScoreboard>(
    `${ESPN_SCOREBOARD_URL}?dates=${espnDate(TOURNAMENT_START)}-${espnDate(endDate)}&limit=1000`
  );
  const events = scoreboard.events ?? [];
  const matches = await mapWithConcurrency(events, SUMMARY_CONCURRENCY, eventToMatch);

  return {
    source: SOURCE,
    sourceUrl: ESPN_SCOREBOARD_URL,
    cacheDate: cacheDateKey(now),
    generatedAt: now.toISOString(),
    matches: matches.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
  };
}

async function eventToMatch(event: EspnEvent): Promise<LiveMatch> {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeCompetitor = competitors.find((competitor) => competitor.homeAway === 'home') ?? competitors[0];
  const awayCompetitor = competitors.find((competitor) => competitor.homeAway === 'away') ?? competitors[1];
  const home = teamFromCompetitor(homeCompetitor);
  const away = teamFromCompetitor(awayCompetitor);
  const status = statusFromCompetition(competition);
  const summary = status !== 'Upcoming' && event.id ? await fetchJson<EspnSummary>(`${ESPN_SUMMARY_URL}?event=${event.id}`).catch(() => undefined) : undefined;
  const homeScore = scoreFromCompetitor(homeCompetitor);
  const awayScore = scoreFromCompetitor(awayCompetitor);
  const winnerCode = status === 'FT' ? competitors.find((competitor) => competitor.winner)?.team?.abbreviation : undefined;
  const kickoff = competition?.date ?? event.date ?? new Date().toISOString();

  return {
    id: event.id ?? `${home.code}-${away.code}-${kickoff}`,
    kickoff,
    stage: competition?.altGameNote ?? event.season?.slug ?? 'FIFA World Cup',
    venue: competition?.venue?.fullName ?? 'TBD',
    sourceUrl: event.id ? `https://www.espn.com/soccer/match/_/gameId/${event.id}` : undefined,
    home: home.name,
    away: away.name,
    homeCode: home.code,
    awayCode: away.code,
    homeLogo: home.logo,
    awayLogo: away.logo,
    homeScore,
    awayScore,
    score: `${homeScore}-${awayScore}`,
    status,
    minute: status === 'Live' ? minuteFromCompetition(competition) : undefined,
    winnerCode,
    goals: goalEvents(summary),
    motm: topPerformer(summary)
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function statusFromCompetition(competition?: EspnCompetition): LiveMatch['status'] {
  const type = competition?.status?.type;
  if (type?.state === 'in') return 'Live';
  if (type?.completed || type?.state === 'post') return 'FT';
  return 'Upcoming';
}

function minuteFromCompetition(competition?: EspnCompetition) {
  const clock = competition?.status?.displayClock;
  if (typeof clock === 'string' && clock.trim()) return clock.replace("'", '');
  return undefined;
}

function teamFromCompetitor(competitor?: EspnCompetitor) {
  return {
    name: competitor?.team?.displayName ?? competitor?.team?.shortDisplayName ?? 'TBD',
    code: competitor?.team?.abbreviation ?? 'TBD',
    logo: competitor?.team?.logo ?? competitor?.team?.logos?.[0]?.href
  };
}

function scoreFromCompetitor(competitor?: EspnCompetitor) {
  const score = Number(competitor?.score ?? 0);
  return Number.isFinite(score) ? score : 0;
}

function parseMinute(value?: string) {
  if (!value) return undefined;
  return value.replaceAll("'", '').trim() || undefined;
}

function minuteSortValue(value?: string) {
  const minute = Number.parseInt(value ?? '', 10);
  return Number.isFinite(minute) ? minute : 0;
}

function goalEvents(summary?: EspnSummary): GoalEvent[] {
  return (summary?.keyEvents ?? [])
    .filter((event) => event.scoringPlay || event.type?.type === 'goal')
    .map((event) => ({
      team: event.team?.displayName ?? event.team?.abbreviation ?? '',
      minute: parseMinute(event.clock?.displayValue),
      scorer: event.participants?.[0]?.athlete?.displayName ?? event.shortText?.replace(/ Goal$/, '') ?? 'Goal',
      assist: event.participants?.[1]?.athlete?.displayName,
      text: event.text
    }))
    .filter((event) => event.scorer)
    .sort((a, b) => minuteSortValue(a.minute) - minuteSortValue(b.minute));
}

function topPerformer(summary?: EspnSummary) {
  const candidates: Array<{ name: string; score: number; team?: string }> = [];

  for (const team of summary?.leaders ?? []) {
    for (const category of team.leaders ?? []) {
      for (const leader of category.leaders ?? []) {
        const name = leader.athlete?.displayName;
        if (!name) continue;
        const stats = Object.fromEntries((leader.statistics ?? []).map((stat) => [stat.name, Number(stat.value ?? 0)]));
        const score =
          (stats.goals ?? 0) * 10 +
          (stats.goalAssists ?? stats.assists ?? 0) * 6 +
          (stats.shotsOnTarget ?? 0) * 2 +
          (stats.totalShots ?? 0) +
          (stats.expectedGoals ?? 0);
        candidates.push({ name, score, team: team.team?.abbreviation });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return candidates[0]?.score > 0 ? `${candidates[0].name}${candidates[0].team ? ` (${candidates[0].team})` : ''}` : undefined;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

function latestFetchDate(now: Date) {
  const twoDaysOut = addDays(now, 2);
  if (twoDaysOut < TOURNAMENT_START) return addDays(TOURNAMENT_START, 1);
  return twoDaysOut > TOURNAMENT_END ? TOURNAMENT_END : twoDaysOut;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function espnDate(date: Date) {
  return dateKey(date).replaceAll('-', '');
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function cacheDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CACHE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown error';
}
