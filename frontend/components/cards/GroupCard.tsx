'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { teams } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';
import { Flag } from '@/components/ui/Flag';
import type { GroupProjection } from '@/simulation/types';

export function GroupCard({ group }: { group: GroupProjection }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="card cinematic-card overflow-hidden">
      <button className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left" onClick={() => setOpen((value) => !value)}>
        <h3 className="font-bold text-ink">Group {group.group}</h3>
        <ChevronDown className={`h-4 w-4 text-muted ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="divide-y divide-line">
        {group.teams.map((row, index) => {
          const team = teams.find((item) => item.code === row.code)!;
          const tone = row.qualificationProbability >= 70 ? 'success' : row.qualificationProbability >= 40 ? 'warning' : 'danger';
          return (
            <div key={row.code} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
              <span className="data-number text-sm font-bold text-muted">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-2">
                <Flag team={team} className="h-6 w-8" />
                <span className="truncate text-sm font-semibold text-ink">{team.name}</span>
              </div>
              <div className="text-right">
                <Badge tone={tone}>{row.qualificationProbability.toFixed(0)}%</Badge>
                <p className="mt-1 text-xs text-muted">{row.avgPoints} pts · {row.avgGf}/{row.avgGa}</p>
              </div>
            </div>
          );
        })}
      </div>
      {open ? (
        <div className="border-t border-line bg-canvas/70 p-4">
          <div className="grid gap-2">
            {group.matches.map((match) => {
              const teamA = teams.find((team) => team.code === match.teamA)!;
              const teamB = teams.find((team) => team.code === match.teamB)!;
              return (
                <div key={match.id} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink">{teamA.name}</span>
                    <span className="data-number font-bold">{match.goalsA}-{match.goalsB}</span>
                    <span className="font-semibold text-ink">{teamB.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{match.winA}% · projected win split · {match.winB}%</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
