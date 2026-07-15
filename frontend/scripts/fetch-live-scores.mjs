import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'ESPN FIFA World Cup scoreboard';
const SOURCE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const FIFA_POTM_PAGE_URL = 'https://cxm-api.fifa.com/fifaplusweb/api/pages/en/tournaments/mens/worldcup/canadamexicousa2026/articles/michelob-ultra-superior-player-of-match-winner';
const FIFA_API_BASE_URL = 'https://cxm-api.fifa.com/fifaplusweb/api';
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/live-scores.json');
const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z');
const TOURNAMENT_END = new Date('2026-07-19T23:59:59Z');
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const CACHE_TIME_ZONE = 'Asia/Kolkata';
const force = process.argv.includes('--force');

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function cacheDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CACHE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function espnDate(date) {
  return dateKey(date).replaceAll('-', '');
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function latestFetchDate(now) {
  const twoDaysOut = addDays(now, 2);
  if (twoDaysOut < TOURNAMENT_START) return addDays(TOURNAMENT_START, 1);
  return twoDaysOut > TOURNAMENT_END ? TOURNAMENT_END : twoDaysOut;
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    return undefined;
  }
}

function isFresh(existing, now) {
  if (!Array.isArray(existing?.matches)) return false;
  const generatedAt = new Date(existing.generatedAt).getTime();
  if (!Number.isFinite(generatedAt)) return false;
  return now.getTime() - generatedAt < REFRESH_INTERVAL_MS;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'WC26 Oracle static cache refresh'
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return response.json();
}

function statusFromCompetition(competition) {
  const type = competition?.status?.type;
  if (type?.state === 'in') return 'Live';
  if (type?.completed || type?.state === 'post') return 'FT';
  return 'Upcoming';
}

function minuteFromCompetition(competition) {
  const clock = competition?.status?.displayClock;
  if (typeof clock === 'string' && clock.trim()) return clock.replace("'", '');
  return undefined;
}

function teamFromCompetitor(competitor) {
  return {
    name: competitor?.team?.displayName ?? competitor?.team?.shortDisplayName ?? 'TBD',
    code: competitor?.team?.abbreviation ?? 'TBD',
    logo: competitor?.team?.logo ?? competitor?.team?.logos?.[0]?.href
  };
}

function parseMinute(value) {
  if (!value) return undefined;
  return String(value).replaceAll("'", '').trim() || undefined;
}

function goalEvents(summary) {
  return (summary?.keyEvents ?? [])
    .filter((event) => event?.scoringPlay || event?.type?.type === 'goal')
    .map((event) => ({
      team: event?.team?.displayName ?? event?.team?.abbreviation ?? '',
      minute: parseMinute(event?.clock?.displayValue),
      scorer: event?.participants?.[0]?.athlete?.displayName ?? event?.shortText?.replace(/ Goal$/, '') ?? 'Goal',
      assist: event?.participants?.[1]?.athlete?.displayName,
      text: event?.text
    }))
    .filter((event) => event.scorer)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
}

async function fetchOfficialPotm() {
  const page = await fetchJson(FIFA_POTM_PAGE_URL);
  const articleEndpoint = page.sections?.find((section) => section.entryType === 'article')?.entryEndpoint;
  if (!articleEndpoint) throw new Error('FIFA Player of the Match article endpoint is missing');

  const articleUrl = `${FIFA_API_BASE_URL}${articleEndpoint.startsWith('/') ? '' : '/'}${articleEndpoint}`;
  const article = await fetchJson(articleUrl);
  return parseOfficialPotm(article);
}

function parseOfficialPotm(article) {
  const awards = new Map();

  for (const block of article.richtext?.content ?? []) {
    if (block.nodeType !== 'paragraph') continue;
    let pendingMatchKey;

    for (const node of block.content ?? []) {
      if (node.nodeType === 'hyperlink' && node.data?.uri?.includes('/match-centre/match/17/285023/')) {
        pendingMatchKey = matchKeyFromFifaLabel(textContent(node));
        continue;
      }

      if (pendingMatchKey && node.nodeType === 'text' && node.marks?.some((mark) => mark.type === 'bold')) {
        const player = node.value?.trim();
        if (player && /\([^)]+\)$/.test(player)) {
          awards.set(pendingMatchKey, player);
          pendingMatchKey = undefined;
        }
      }
    }
  }

  return awards;
}

function textContent(node) {
  return node.value ?? (node.content ?? []).map(textContent).join('');
}

function matchKeyFromFifaLabel(label) {
  const scoreline = label
    .trim()
    .replace(/\s+\((?:AET|PSO\b[^)]*)\)\s*$/i, '')
    .match(/^(.+?)\s+(\d+)\s*[-–]\s*(\d+)\s+(.+)$/);

  if (!scoreline) return undefined;
  return matchKey(scoreline[1], scoreline[4], Number(scoreline[2]), Number(scoreline[3]));
}

function matchKey(home, away, homeScore, awayScore) {
  return `${teamKey(home)}:${homeScore}-${awayScore}:${teamKey(away)}`;
}

function teamKey(team) {
  const normalized = team
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');

  return TEAM_KEY_ALIASES[normalized] ?? normalized;
}

const TEAM_KEY_ALIASES = {
  unitedstates: 'usa',
  bosniaherzegovina: 'bosniaandherzegovina',
  capeverde: 'caboverde',
  iran: 'iriran',
  southkorea: 'korearepublic',
  congodr: 'drcongo',
  democraticrepublicofthecongo: 'drcongo',
  ivorycoast: 'cotedivoire'
};

async function eventToMatch(event, officialPotm) {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeCompetitor = competitors.find((competitor) => competitor.homeAway === 'home') ?? competitors[0];
  const awayCompetitor = competitors.find((competitor) => competitor.homeAway === 'away') ?? competitors[1];
  const home = teamFromCompetitor(homeCompetitor);
  const away = teamFromCompetitor(awayCompetitor);
  const status = statusFromCompetition(competition);
  const shouldFetchSummary = status !== 'Upcoming';
  const summary = shouldFetchSummary ? await fetchJson(`${SUMMARY_URL}?event=${event.id}`).catch(() => undefined) : undefined;
  const homeScore = Number(homeCompetitor?.score ?? 0);
  const awayScore = Number(awayCompetitor?.score ?? 0);

  return {
    id: event.id,
    kickoff: competition?.date ?? event.date,
    stage: competition?.altGameNote ?? event.season?.slug ?? 'FIFA World Cup',
    venue: competition?.venue?.fullName ?? 'TBD',
    sourceUrl: `https://www.espn.com/soccer/match/_/gameId/${event.id}`,
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
    goals: goalEvents(summary),
    motm: officialPotm.get(matchKey(home.name, away.name, homeScore, awayScore))
  };
}

async function collectMatches(now) {
  const endDate = latestFetchDate(now);
  const matches = [];
  const [scoreboard, officialPotm] = await Promise.all([
    fetchJson(`${SOURCE_URL}?dates=${espnDate(TOURNAMENT_START)}-${espnDate(endDate)}&limit=1000`),
    fetchOfficialPotm()
  ]);

  for (const event of scoreboard.events ?? []) {
    matches.push(await eventToMatch(event, officialPotm));
  }

  return matches.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
}

async function main() {
  const now = new Date();
  const today = cacheDateKey(now);
  const existing = await readExisting();

  if (!force && existing?.cacheDate === today && isFresh(existing, now)) {
    console.log(`Live score cache is less than one hour old for ${today}; skipped ESPN fetch.`);
    return;
  }

  const matches = await collectMatches(now);
  const payload = {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cacheDate: today,
    generatedAt: now.toISOString(),
    matches
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${matches.length} matches to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
