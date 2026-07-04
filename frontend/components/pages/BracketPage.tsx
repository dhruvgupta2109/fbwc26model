'use client';

import { Play, RefreshCw } from 'lucide-react';
import { BracketView } from '@/components/bracket/BracketView';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useLiveScores } from '@/hooks/useLiveScores';
import { useSimulation } from '@/hooks/useSimulation';
import type { LiveMatch } from '@/hooks/useLiveScores';
import type { BracketSlot } from '@/simulation/types';

const actualStageCounts: Record<BracketSlot['stage'], number> = {
  R32: 16,
  R16: 8,
  QF: 4,
  SF: 2,
  ThirdPlace: 1,
  Final: 1,
  Champion: 1
};

export function BracketPage() {
  const { result, run, isRunning, progress, completed, total } = useSimulation();
  const { matches, refresh, isRefreshing, source, generatedAt, warning } = useLiveScores();
  const actualBracket = buildActualBracket(matches);

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-muted">Knockout Route</p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              <GradientText>Animated Knockout Bracket</GradientText>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Actuals
            </Button>
            <Button onClick={run} disabled={isRunning}>
              <Play className="h-4 w-4" />
              {isRunning ? 'Running...' : 'Resimulate'}
            </Button>
          </div>
        </div>
        <div className="relative z-10 mt-5">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>{isRunning ? `Simulating ${completed.toLocaleString()} / ${total.toLocaleString()}` : 'Simulation ready'}</span>
            <span className="data-number">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
          <p className="mt-2 text-xs text-muted">
            {source ? `Actual bracket feed: ${source}${generatedAt ? ` / updated ${formatCacheTime(generatedAt)}` : ''}` : 'Actual bracket feed loading...'}
          </p>
          {warning ? (
            <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm font-semibold text-accent">
              {warning}
            </div>
          ) : null}
        </div>
      </section>

      {result ? (
        <BracketView bracket={result.bracket} actualBracket={actualBracket} goldenBoot={result.goldenBoot} champion={result.champion} />
      ) : (
        <div className="card p-8 text-muted">Building tournament bracket...</div>
      )}
    </PageTransition>
  );
}

function buildActualBracket(matches: LiveMatch[]): BracketSlot[] {
  const slots: BracketSlot[] = [
    ...Array.from({ length: actualStageCounts.R32 }, (_, index) => ({ id: `actual-r32-${index + 1}`, stage: 'R32' as const })),
    ...Array.from({ length: actualStageCounts.R16 }, (_, index) => ({ id: `actual-r16-${index + 1}`, stage: 'R16' as const })),
    ...Array.from({ length: actualStageCounts.QF }, (_, index) => ({ id: `actual-qf-${index + 1}`, stage: 'QF' as const })),
    ...Array.from({ length: actualStageCounts.SF }, (_, index) => ({ id: `actual-sf-${index + 1}`, stage: 'SF' as const })),
    { id: 'actual-third-place', stage: 'ThirdPlace' },
    { id: 'actual-final', stage: 'Final' },
    { id: 'actual-champion', stage: 'Champion' }
  ];

  const filledByStage = new Map<BracketSlot['stage'], number>();
  const knockoutMatches = matches
    .map((match) => ({ match, stage: actualStageFromMatch(match) }))
    .filter((entry): entry is { match: LiveMatch; stage: BracketSlot['stage'] } => Boolean(entry.stage && entry.stage !== 'Champion'))
    .sort((a, b) => new Date(a.match.kickoff).getTime() - new Date(b.match.kickoff).getTime());

  for (const { match, stage } of knockoutMatches) {
    const stageIndex = filledByStage.get(stage) ?? 0;
    const slot = slots.filter((candidate) => candidate.stage === stage)[stageIndex];
    if (!slot) continue;

    slot.id = `actual-${stage.toLowerCase()}-${match.id}`;
    slot.teamA = match.homeCode;
    slot.teamB = match.awayCode;
    slot.scoreA = match.status === 'Upcoming' ? undefined : match.homeScore;
    slot.scoreB = match.status === 'Upcoming' ? undefined : match.awayScore;
    slot.winner = match.status === 'FT' ? winnerCode(match) : undefined;
    filledByStage.set(stage, stageIndex + 1);
  }

  const finalWinner = slots.find((slot) => slot.stage === 'Final')?.winner;
  const championSlot = slots.find((slot) => slot.stage === 'Champion');
  if (championSlot && finalWinner) championSlot.winner = finalWinner;

  return slots;
}

function actualStageFromMatch(match: LiveMatch) {
  const stage = match.stage.toLowerCase();
  if (stage.includes('round of 32')) return 'R32';
  if (stage.includes('round of 16')) return 'R16';
  if (stage.includes('quarterfinal') || stage.includes('quarter-final')) return 'QF';
  if (stage.includes('semifinal') || stage.includes('semi-final')) return 'SF';
  if (stage.includes('3rd-place') || stage.includes('third place') || stage.includes('third-place')) return 'ThirdPlace';
  if (stage.includes('final')) return 'Final';
  return undefined;
}

function winnerCode(match: LiveMatch) {
  if (match.winnerCode) return match.winnerCode;
  if (match.homeScore > match.awayScore) return match.homeCode;
  if (match.awayScore > match.homeScore) return match.awayCode;
  return undefined;
}

function formatCacheTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}
