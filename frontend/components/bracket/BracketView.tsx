'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { GitBranch, Route, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { teams } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import type { BracketSlot, GoldenBootProjection, Team } from '@/simulation/types';

const sideStages: BracketSlot['stage'][] = ['R32', 'R16', 'QF', 'SF'];
const stageLabels: Record<BracketSlot['stage'], string> = {
  R32: 'R32',
  R16: 'R16',
  QF: 'QF',
  SF: 'SF',
  Final: 'Final',
  Champion: 'Champion'
};

const stageColumn: Record<BracketSlot['stage'], number> = {
  R32: 1,
  R16: 2,
  QF: 3,
  SF: 4,
  Final: 1,
  Champion: 1
};

const stageSpan: Record<BracketSlot['stage'], number> = {
  R32: 1,
  R16: 2,
  QF: 4,
  SF: 8,
  Final: 1,
  Champion: 1
};

const emptyActualBracket: BracketSlot[] = [
  ...Array.from({ length: 16 }, (_, index) => ({ id: `actual-r32-${index + 1}`, stage: 'R32' as const })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `actual-r16-${index + 1}`, stage: 'R16' as const })),
  ...Array.from({ length: 4 }, (_, index) => ({ id: `actual-qf-${index + 1}`, stage: 'QF' as const })),
  ...Array.from({ length: 2 }, (_, index) => ({ id: `actual-sf-${index + 1}`, stage: 'SF' as const })),
  { id: 'actual-final', stage: 'Final' },
  { id: 'actual-champion', stage: 'Champion' }
];

export function BracketView({ bracket, goldenBoot, champion }: { bracket: BracketSlot[]; goldenBoot: GoldenBootProjection[]; champion: string }) {
  const [pathOnly, setPathOnly] = useState(false);
  const championTeam = teams.find((team) => team.code === champion);

  return (
    <div className="grid gap-5">
      <StructuredBracket
        bracket={bracket}
        champion={champion}
        pathOnly={pathOnly}
        title="Prediction Bracket"
        eyebrow="Model projection"
        action={
          <Button variant={pathOnly ? 'primary' : 'ghost'} onClick={() => setPathOnly((value) => !value)}>
            <Route className="h-4 w-4" />
            Most Likely Path
          </Button>
        }
      />

      <StructuredBracket bracket={emptyActualBracket} title="Actual Bracket" eyebrow="Official results" emptyLabel="TBD" />

      <aside className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-ink">Golden Boot Prediction</h3>
          {championTeam ? (
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
              <Flag team={championTeam} className="h-6 w-8" />
              <span className="text-sm font-bold text-ink">{championTeam.name}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {goldenBoot.map((item, index) => {
            const team = teams.find((candidate) => candidate.code === item.team)!;
            return (
              <div key={`${item.team}-${item.player}`} className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
                <span className="data-number text-sm font-bold text-muted">{index + 1}</span>
                <Flag team={team} className="h-6 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.player}</p>
                  <p className="text-xs text-muted">{team.name}</p>
                </div>
                <div className="text-right">
                  <p className="data-number text-sm font-bold text-primary">{item.projectedGoals}</p>
                  <p className="text-xs text-muted">{item.probability}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function StructuredBracket({
  bracket,
  champion,
  pathOnly = false,
  title,
  eyebrow,
  emptyLabel = 'TBD',
  action
}: {
  bracket: BracketSlot[];
  champion?: string;
  pathOnly?: boolean;
  title: string;
  eyebrow: string;
  emptyLabel?: string;
  action?: ReactNode;
}) {
  const finalSlot = bracket.find((slot) => slot.stage === 'Final');
  const championSlot = bracket.find((slot) => slot.stage === 'Champion');

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-bold uppercase text-muted">{eyebrow}</p>
            <h2 className="section-title">{title}</h2>
          </div>
        </div>
        {action}
      </div>

      <div className="overflow-x-auto px-4 pb-5 pt-4">
        <div className="structured-bracket">
          <BracketSide side="left" bracket={bracket} champion={champion} pathOnly={pathOnly} emptyLabel={emptyLabel} />

          <div className="structured-bracket-center">
            <p className="structured-round-label">Final</p>
            <BracketSlotCard slot={finalSlot} index={0} champion={champion} emptyLabel={emptyLabel} compact />
            <div className="grid justify-items-center gap-2 rounded-lg border border-accent/35 bg-accent/10 p-3 text-center">
              <Trophy className="h-7 w-7 text-accent" />
              <BracketSlotCard slot={championSlot} index={1} champion={champion} emptyLabel={emptyLabel} compact championCard />
            </div>
          </div>

          <BracketSide side="right" bracket={bracket} champion={champion} pathOnly={pathOnly} emptyLabel={emptyLabel} />
        </div>
      </div>
    </section>
  );
}

function BracketSide({
  side,
  bracket,
  champion,
  pathOnly,
  emptyLabel
}: {
  side: 'left' | 'right';
  bracket: BracketSlot[];
  champion?: string;
  pathOnly: boolean;
  emptyLabel: string;
}) {
  return (
    <div className={`structured-bracket-side structured-bracket-${side}`}>
      <div className="structured-bracket-labels">
        {(side === 'left' ? sideStages : [...sideStages].reverse()).map((stage) => (
          <p key={stage} className="structured-round-label">
            {stageLabels[stage]}
          </p>
        ))}
      </div>
      <div className="structured-bracket-grid">
        {sideStages.flatMap((stage) => {
          const slots = bracket.filter((slot) => slot.stage === stage);
          const midpoint = Math.ceil(slots.length / 2);
          const sideSlots = side === 'left' ? slots.slice(0, midpoint) : slots.slice(midpoint);
          const filtered = sideSlots
            .map((slot, index) => ({ slot, index }))
            .filter(({ slot }) => !pathOnly || !champion || slot.winner === champion);

          return filtered.map(({ slot, index }) => {
            const column = side === 'left' ? stageColumn[stage] : 5 - stageColumn[stage];
            const rowSpan = stageSpan[stage];
            const rowStart = index * rowSpan + 1;

            return (
              <div
                key={slot.id}
                className={`structured-slot structured-slot-${side}`}
                style={{
                  gridColumn: column,
                  gridRow: `${rowStart} / span ${rowSpan}`
                }}
              >
                <BracketSlotCard slot={slot} index={index} champion={champion} emptyLabel={emptyLabel} compact={stage !== 'R32'} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

function BracketSlotCard({
  slot,
  index,
  champion,
  emptyLabel,
  compact = false,
  championCard = false
}: {
  slot?: BracketSlot;
  index: number;
  champion?: string;
  emptyLabel: string;
  compact?: boolean;
  championCard?: boolean;
}) {
  const teamA = slot?.teamA ? teams.find((team) => team.code === slot.teamA) : undefined;
  const teamB = slot?.teamB ? teams.find((team) => team.code === slot.teamB) : undefined;
  const winner = slot?.winner ? teams.find((team) => team.code === slot.winner) : undefined;
  const isChampionPath = Boolean(champion && slot?.winner === champion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={{ y: -2 }}
      className={`structured-match-card ${isChampionPath ? 'structured-match-card-active' : ''} ${championCard ? 'w-full' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{slot?.stage ?? 'Match'}</span>
        {slot?.upset ? <Badge tone="danger" className="px-2 py-0.5 text-[10px]">Upset</Badge> : null}
      </div>

      {slot?.stage === 'Champion' ? (
        <TeamLine team={winner} emptyLabel={emptyLabel} isWinner compact={compact} />
      ) : (
        <div className="grid gap-1.5">
          <TeamLine team={teamA} emptyLabel={emptyLabel} isWinner={slot?.winner === teamA?.code} probability={slot?.winA} compact={compact} />
          <TeamLine team={teamB} emptyLabel={emptyLabel} isWinner={slot?.winner === teamB?.code} probability={slot?.winB} compact={compact} />
        </div>
      )}
    </motion.div>
  );
}

function TeamLine({
  team,
  emptyLabel,
  isWinner,
  probability,
  compact
}: {
  team?: Team;
  emptyLabel: string;
  isWinner?: boolean;
  probability?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {team ? <Flag team={team} className={compact ? 'h-4 w-6' : 'h-5 w-7'} /> : <span className={`${compact ? 'h-4 w-6' : 'h-5 w-7'} rounded bg-canvas ring-1 ring-line`} />}
      <span className={`min-w-0 flex-1 truncate text-xs ${isWinner ? 'font-bold text-ink' : 'font-semibold text-muted'}`}>{team?.name ?? emptyLabel}</span>
      {typeof probability === 'number' ? <span className="data-number text-[11px] font-bold text-primary">{probability}%</span> : null}
    </div>
  );
}
