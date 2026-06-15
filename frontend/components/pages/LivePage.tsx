'use client';

import { Activity, CalendarClock } from 'lucide-react';
import { useLiveScores } from '@/hooks/useLiveScores';
import { useSimulation } from '@/hooks/useSimulation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';

export function LivePage() {
  const { run, isRunning } = useSimulation();
  const { matches, inTournamentWindow, countdownMs } = useLiveScores();
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
          <Activity className="h-10 w-10 text-success" />
        </div>
      </section>
      <section className="card p-5">
        {!inTournamentWindow ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-8 w-8 text-primary" />
              <div>
                <p className="font-bold text-ink">Tournament window countdown</p>
                <p className="text-sm text-muted">{days > 0 ? `${days} days until June 11, 2026` : 'Tournament window has closed for live polling.'}</p>
              </div>
            </div>
            <Button onClick={run} disabled={isRunning}>Update Simulation</Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {matches.map((match) => (
              <div key={match.id} className="rounded-xl border border-line bg-canvas/80 p-4">
                <Badge tone={match.status === 'Live' ? 'success' : match.status === 'FT' ? 'muted' : 'primary'}>{match.status}{match.minute ? ` · ${match.minute}'` : ''}</Badge>
                <p className="mt-3 font-bold text-ink">{match.home} vs {match.away}</p>
                <p className="data-number mt-1 text-2xl font-bold text-primary">{match.score}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
