'use client';

import { Activity, CalendarClock, MapPin, RefreshCw, Star, Timer, Trophy } from 'lucide-react';
import { getTeam } from '@/lib/data';
import { useLiveScores } from '@/hooks/useLiveScores';
import { useSimulation } from '@/hooks/useSimulation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import type { GoalEvent, LiveMatch } from '@/hooks/useLiveScores';

export function LivePage() {
  const { run, isRunning } = useSimulation();
  const { matches, inTournamentWindow, countdownMs, mutate, isLoading } = useLiveScores();
  const days = Math.ceil(countdownMs / 86_400_000);

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
              <p className="font-bold text-ink">All matches, latest to oldest</p>
              <p className="text-sm text-muted">
                {inTournamentWindow ? `${matches.length} matches in the tournament feed` : days > 0 ? `${days} days until June 11, 2026` : 'Tournament window has closed.'}
              </p>
            </div>
          </div>
          <Button onClick={run} disabled={isRunning}>Update Simulation</Button>
        </div>

        <div className="mt-5 grid gap-4">
          {matches.map((match) => (
            <MatchFeedCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </PageTransition>
  );
}

function MatchFeedCard({ match }: { match: LiveMatch }) {
  const home = getTeam(match.homeCode);
  const away = getTeam(match.awayCode);
  const kickoff = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(match.kickoff));

  return (
    <article className="rounded-xl border border-line bg-canvas/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={match.status === 'Live' ? 'success' : match.status === 'FT' ? 'muted' : 'primary'}>
            {match.status}{match.minute ? ` / ${match.minute}'` : ''}
          </Badge>
          <span className="text-sm font-semibold text-muted">{match.stage}</span>
          <span className="flex items-center gap-1 text-sm text-muted">
            <Timer className="h-4 w-4" />
            {kickoff}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-4 w-4" />
            {match.venue}
          </span>
        </div>
        {match.motm ? (
          <span className="flex items-center gap-1 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Star className="h-3.5 w-3.5" />
            MOTM: {match.motm}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <TeamScoreLine name={match.home} team={home} score={match.homeScore} align="left" />
        <div className="data-number rounded-lg border border-line bg-surface px-5 py-3 text-center text-3xl font-extrabold text-primary">
          {match.score}
        </div>
        <TeamScoreLine name={match.away} team={away} score={match.awayScore} align="right" />
      </div>

      <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-2">
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
        </div>
      </div>
    </article>
  );
}

function TeamScoreLine({ name, team, score, align }: { name: string; team?: NonNullable<ReturnType<typeof getTeam>>; score: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'justify-start lg:flex-row-reverse lg:text-right' : ''}`}>
      {team ? <Flag team={team} className="h-8 w-11" /> : null}
      <div className="min-w-0">
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
              <span className="data-number font-bold text-primary">{goal.minute}&apos;</span>{' '}
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
