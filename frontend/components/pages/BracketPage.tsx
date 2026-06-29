'use client';

import { Play } from 'lucide-react';
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
  Final: 1,
  Champion: 1
};

const actualStageLabels: Record<string, BracketSlot['stage']> = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  Quarterfinals: 'QF',
  'Quarter-finals': 'QF',
  Semifinals: 'SF',
  'Semi-finals': 'SF',
  Final: 'Final'
};

export function BracketPage() {
  const { result, run, isRunning, progress, completed, total } = useSimulation();
  const { matches } = useLiveScores();
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
          <Button onClick={run} disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Resimulate'}
          </Button>
        </div>
        <div className="relative z-10 mt-5">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>{isRunning ? `Simulating ${completed.toLocaleString()} / ${total.toLocaleString()}` : 'Simulation ready'}</span>
            <span className="data-number">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
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
    slot.winner = match.status === 'Upcoming' ? undefined : winnerCode(match);
    filledByStage.set(stage, stageIndex + 1);
  }

  const finalWinner = slots.find((slot) => slot.stage === 'Final')?.winner;
  const championSlot = slots.find((slot) => slot.stage === 'Champion');
  if (championSlot && finalWinner) championSlot.winner = finalWinner;

  return slots;
}

function actualStageFromMatch(match: LiveMatch) {
  return Object.entries(actualStageLabels).find(([label]) => match.stage.includes(label))?.[1];
}

function winnerCode(match: LiveMatch) {
  if (match.homeScore > match.awayScore) return match.homeCode;
  if (match.awayScore > match.homeScore) return match.awayCode;
  return undefined;
}
