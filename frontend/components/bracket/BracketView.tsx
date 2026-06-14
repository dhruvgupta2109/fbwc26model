'use client';

import { useState } from 'react';
import { GitBranch, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { teams } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import type { BracketSlot, GoldenBootProjection } from '@/simulation/types';

const stages: BracketSlot['stage'][] = ['R32', 'R16', 'QF', 'SF', 'Final', 'Champion'];

export function BracketView({ bracket, goldenBoot, champion }: { bracket: BracketSlot[]; goldenBoot: GoldenBootProjection[]; champion: string }) {
  const [pathOnly, setPathOnly] = useState(false);
  const championTeam = teams.find((team) => team.code === champion);

  return (
    <div className="grid gap-4">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="section-title">Most Likely Tournament Path</h2>
          </div>
          <Button variant={pathOnly ? 'primary' : 'ghost'} onClick={() => setPathOnly((value) => !value)}>
            <Route className="h-4 w-4" />
            Most Likely Path
          </Button>
        </div>
        <div className="overflow-x-auto px-4 pb-5 pt-4">
          <div className="bracket-track">
            {stages.map((stage) => (
              <div key={stage}>
                <p className="mb-3 text-sm font-bold text-muted">{stage}</p>
                <div className="grid gap-3">
                  {bracket
                    .filter((slot) => slot.stage === stage)
                    .filter((slot) => !pathOnly || slot.winner === champion || slot.stage === 'Champion')
                    .map((slot, index) => (
                      <BracketSlotCard key={slot.id} slot={slot} index={index} champion={champion} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

function BracketSlotCard({ slot, index, champion }: { slot: BracketSlot; index: number; champion: string }) {
  const teamA = teams.find((team) => team.code === slot.teamA);
  const teamB = teams.find((team) => team.code === slot.teamB);
  const winner = teams.find((team) => team.code === slot.winner);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      whileHover={{ y: -3, scale: 1.015 }}
      className={`rounded-xl border p-3 shadow-sm ${slot.winner === champion ? 'border-primary bg-primary/[0.12] shadow-primary/10' : 'border-line bg-surface/[0.78]'}`}
    >
      {slot.stage === 'Champion' && winner ? (
        <div className="flex items-center gap-3">
          <Flag team={winner} />
          <div>
            <p className="text-xs font-semibold text-muted">Champion</p>
            <p className="font-bold text-ink">{winner.name}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {[teamA, teamB].map((team, idx) =>
            team ? (
              <div key={team.code} className="flex items-center gap-2">
                <Flag team={team} className="h-5 w-7" />
                <span className={`truncate text-sm ${slot.winner === team.code ? 'font-bold text-ink' : 'text-muted'}`}>{team.name}</span>
                <span className="data-number ml-auto text-xs text-muted">{idx === 0 ? slot.winA : slot.winB}%</span>
              </div>
            ) : null
          )}
          {slot.upset ? <Badge tone="danger">Upset Alert</Badge> : null}
        </div>
      )}
    </motion.div>
  );
}
