/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Activity, CalendarClock, ChevronDown, ExternalLink, MapPin, RefreshCw, Star, Timer, Trophy } from 'lucide-react';
import { useLiveScores } from '@/hooks/useLiveScores';
import { useSimulation } from '@/hooks/useSimulation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import type { GoalEvent, LiveMatch } from '@/hooks/useLiveScores';

const flagCodes: Record<string, string> = {
  ALG: 'dz',
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba',
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci',
  COD: 'cd',
  COL: 'co',
  CPV: 'cv',
  CRO: 'hr',
  CUW: 'cw',
  CZE: 'cz',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  ESP: 'es',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  JOR: 'jo',
  JPN: 'jp',
  KOR: 'kr',
  KSA: 'sa',
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  RSA: 'za',
  SCO: 'gb-sct',
  SEN: 'sn',
  SUI: 'ch',
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  URU: 'uy',
  USA: 'us',
  UZB: 'uz'
};

export function LivePage() {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const { run, isRunning } = useSimulation();
  const { matches, inTournamentWindow, countdownMs, mutate, isLoading, error, source, generatedAt } = useLiveScores();
  const days = Math.ceil(countdownMs / 86_400_000);
  const now = new Date();
  const completedAndLive = matches.filter((match) => match.status !== 'Upcoming');
  const upcomingSoon = matches.filter((match) => match.status === 'Upcoming' && isTodayOrTomorrow(new Date(match.kickoff), now));

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-muted">Live Scores</p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              <GradientText>Match Feed</GradientText>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => mutate()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Activity className="h-10 w-10 text-success" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <div>
              <p className="font-bold text-ink">Live and completed, latest to oldest</p>
              <p className="text-sm text-muted">
                {inTournamentWindow
                  ? `${completedAndLive.length} live/completed matches, ${upcomingSoon.length} upcoming today or tomorrow`
                  : days > 0
                    ? `${days} days until June 11, 2026`
                    : 'Tournament window has closed.'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {source ? `${source}${generatedAt ? ` / cached ${formatCacheTime(generatedAt)}` : ''}` : 'Loading score cache...'}
              </p>
            </div>
          </div>
          <Button onClick={run} disabled={isRunning}>Update Simulation</Button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
            Could not load the hourly ESPN score cache.
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {completedAndLive.map((match) => (
            <MatchFeedCard key={match.id} match={match} />
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-line bg-canvas/70">
          <button
            type="button"
            onClick={() => setShowUpcoming((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={showUpcoming}
          >
            <div>
              <p className="font-bold text-ink">Upcoming matches</p>
              <p className="text-sm text-muted">Today and tomorrow only, closed by default</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="primary">{upcomingSoon.length}</Badge>
              <ChevronDown className={`h-5 w-5 text-muted transition-transform ${showUpcoming ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {showUpcoming ? (
            <div className="grid gap-4 border-t border-line p-4 md:grid-cols-2 xl:grid-cols-3">
              {upcomingSoon.length ? upcomingSoon.map((match) => <MatchFeedCard key={match.id} match={match} />) : <p className="text-sm text-muted">No upcoming matches today or tomorrow.</p>}
            </div>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}

function isTodayOrTomorrow(matchDate: Date, now: Date) {
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startAfterTomorrow = new Date(startToday);
  startAfterTomorrow.setDate(startAfterTomorrow.getDate() + 2);
  return matchDate >= startToday && matchDate < startAfterTomorrow;
}

function formatCacheTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function MatchFeedCard({ match }: { match: LiveMatch }) {
  const kickoff = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(match.kickoff));

  return (
    <article className="flex min-h-[360px] flex-col rounded-xl border border-line bg-canvas/80 p-4">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={match.status === 'Live' ? 'success' : match.status === 'FT' ? 'muted' : 'primary'}>
            {match.status}{match.minute ? ` / ${match.minute}'` : ''}
          </Badge>
          <span className="text-sm font-semibold text-muted">{match.stage}</span>
        </div>
        <div className="grid gap-1 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Timer className="h-4 w-4" />
            {kickoff}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {match.venue}
          </span>
        </div>
        {match.motm ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Star className="h-3.5 w-3.5" />
            ESPN top performer: {match.motm}
          </span>
        ) : match.status === 'FT' ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-muted">
            <Star className="h-3.5 w-3.5" />
            MOTM not published
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <TeamScoreLine name={match.home} code={match.homeCode} score={match.homeScore} />
        <div className="data-number rounded-lg border border-line bg-surface px-4 py-2 text-center text-3xl font-extrabold text-primary">
          {match.score}
        </div>
        <TeamScoreLine name={match.away} code={match.awayCode} score={match.awayScore} />
      </div>

      <div className="mt-4 grid flex-1 gap-3 border-t border-line pt-4">
        <EventList title="Goals & assists" goals={match.goals} />
        <div className="rounded-lg border border-line bg-surface/70 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Trophy className="h-4 w-4 text-accent" />
            Match notes
          </p>
          <p className="mt-2 text-sm text-muted">
            {match.status === 'Upcoming'
              ? 'Lineups, scorers, assists, and player of the match will appear after kickoff.'
              : `${match.goals.length} recorded goal event${match.goals.length === 1 ? '' : 's'} in this match feed.`}
          </p>
          {match.sourceUrl ? (
            <a href={match.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
              ESPN match page
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TeamScoreLine({ name, code, score }: { name: string; code: string; score: number }) {
  const flagCode = flagCodes[code];

  return (
    <div className="flex min-w-0 items-center gap-3">
      {flagCode ? (
        <img src={`https://flagcdn.com/w80/${flagCode}.png`} alt={`${name} flag`} className="h-8 w-11 shrink-0 rounded object-cover ring-1 ring-line" loading="lazy" width={80} height={60} />
      ) : (
        <span className="grid h-8 w-11 shrink-0 place-items-center rounded bg-surface text-[11px] font-extrabold text-muted ring-1 ring-line">{code}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-ink">{name}</p>
        <p className="data-number text-sm font-bold text-muted">{score} goals</p>
      </div>
    </div>
  );
}

function EventList({ title, goals }: { title: string; goals: GoalEvent[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface/70 p-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      {goals.length ? (
        <div className="mt-2 grid gap-2">
          {goals.map((goal, index) => (
            <div key={`${goal.team}-${goal.minute}-${index}`} className="text-sm text-muted">
              {goal.minute ? <span className="data-number font-bold text-primary">{goal.minute}&apos; </span> : null}
              <span className="font-semibold text-ink">{goal.scorer}</span>
              <span> ({goal.team})</span>
              {goal.assist ? <span> / Assist: {goal.assist}</span> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">No goals recorded yet.</p>
      )}
    </div>
  );
}
