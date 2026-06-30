'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { teams } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';
import { Flag } from '@/components/ui/Flag';
import type { GroupProjection } from '@/simulation/types';
import type { ActualGroupTable } from '@/components/pages/GroupsPage';

export function GroupCard({ group, actual }: { group: GroupProjection; actual?: ActualGroupTable }) {
  const [open, setOpen] = useState(false);
  const finalOrder = actual?.teams.map((row) => row.code) ?? [];
  const predictedOrder = group.teams.map((row) => row.code);
  const hasFinalTable = Boolean(actual?.isFinal && finalOrder.length);
  const exactFinalMatch = hasFinalTable && predictedOrder.every((code, index) => code === finalOrder[index]);
  const topTwoQualifiedMatch = hasFinalTable && sameCodeSet(predictedOrder.slice(0, 2), finalOrder.slice(0, 2));
  const groupTone = !hasFinalTable ? undefined : exactFinalMatch ? 'success' : topTwoQualifiedMatch ? 'warning' : 'danger';

  return (
    <article
      className={clsx(
        'card cinematic-card overflow-hidden',
        groupTone === 'success' && 'border-success/60 shadow-[0_0_28px_rgb(var(--color-success)/0.24)]',
        groupTone === 'warning' && 'border-accent/70 shadow-[0_0_28px_rgb(var(--color-accent)/0.22)]',
        groupTone === 'danger' && 'border-danger/60 shadow-[0_0_28px_rgb(var(--color-danger)/0.18)]'
      )}
    >
      <button className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left" onClick={() => setOpen((value) => !value)}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">Group {group.group}</h3>
            {hasFinalTable ? (
              <Badge tone={groupTone}>{exactFinalMatch ? 'Pred = Final' : topTwoQualifiedMatch ? 'Top 2 qualified' : 'Pred != Final'}</Badge>
            ) : actual?.teams.length ? (
              <Badge tone="warning">Actual live</Badge>
            ) : (
              <Badge tone="muted">No actual table</Badge>
            )}
          </div>
          {actual ? (
            <p className="mt-1 text-xs text-muted">
              {actual.completedMatches}/{actual.totalMatches} actual matches final
            </p>
          ) : null}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="border-b border-line px-4 py-2">
        <p className="text-xs font-bold uppercase text-muted">Predicted standings</p>
      </div>
      <div className="divide-y divide-line">
        {group.teams.map((row, index) => {
          const team = teams.find((item) => item.code === row.code)!;
          const tone = row.qualificationProbability >= 70 ? 'success' : row.qualificationProbability >= 40 ? 'warning' : 'danger';
          const actualAtPosition = finalOrder[index];
          const rowMatchesFinal = hasFinalTable ? row.code === actualAtPosition : undefined;
          return (
            <div
              key={row.code}
              className={clsx(
                'grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3',
                rowMatchesFinal === true && 'bg-success/10 shadow-[inset_3px_0_0_rgb(var(--color-success))]',
                rowMatchesFinal === false && topTwoQualifiedMatch && index < 2 && 'bg-accent/10 shadow-[inset_3px_0_0_rgb(var(--color-accent))]',
                rowMatchesFinal === false && !(topTwoQualifiedMatch && index < 2) && 'bg-danger/10 shadow-[inset_3px_0_0_rgb(var(--color-danger))]'
              )}
            >
              <span className="data-number text-sm font-bold text-muted">{index + 1}</span>
              <div className="flex min-w-0 items-center gap-2">
                <Flag team={team} className="h-6 w-8" />
                <span className="truncate text-sm font-semibold text-ink">{team.name}</span>
              </div>
              <div className="text-right">
                <Badge tone={tone}>{row.qualificationProbability.toFixed(0)}%</Badge>
                <p className="mt-1 text-xs text-muted">{row.avgPoints} pts · {row.avgGf}/{row.avgGa}</p>
                {rowMatchesFinal !== undefined ? (
                  <p className={`mt-1 text-xs font-bold ${rowMatchesFinal ? 'text-success' : topTwoQualifiedMatch && index < 2 ? 'text-accent' : 'text-danger'}`}>
                    {rowMatchesFinal ? 'matches final' : topTwoQualifiedMatch && index < 2 ? 'qualified, order off' : `final: ${actualAtPosition ?? 'none'}`}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line bg-canvas/45">
        <div className="border-b border-line px-4 py-2">
          <p className="text-xs font-bold uppercase text-muted">{actual?.isFinal ? 'Final actual standings' : 'Actual standings'}</p>
        </div>
        {actual?.teams.length ? (
          <div className="divide-y divide-line">
            {actual.teams.map((row, index) => (
              <ActualStandingRow
                key={row.code}
                row={row}
                position={index + 1}
                predictedCode={predictedOrder[index]}
                predictedTopTwo={predictedOrder.slice(0, 2)}
                topTwoQualifiedMatch={topTwoQualifiedMatch}
                hasFinalTable={hasFinalTable}
              />
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-muted">Actual group results are not available in the score feed yet.</p>
        )}
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

function ActualStandingRow({
  row,
  position,
  predictedCode,
  predictedTopTwo,
  topTwoQualifiedMatch,
  hasFinalTable
}: {
  row: ActualGroupTable['teams'][number];
  position: number;
  predictedCode?: string;
  predictedTopTwo: string[];
  topTwoQualifiedMatch: boolean;
  hasFinalTable: boolean;
}) {
  const team = teams.find((item) => item.code === row.code);
  const matchesPrediction = hasFinalTable ? row.code === predictedCode : undefined;
  const qualifiedOrderOff = hasFinalTable && !matchesPrediction && topTwoQualifiedMatch && position <= 2 && predictedTopTwo.includes(row.code);

  return (
    <div
      className={clsx(
        'grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3',
        matchesPrediction === true && 'bg-success/10 shadow-[inset_3px_0_0_rgb(var(--color-success))]',
        qualifiedOrderOff && 'bg-accent/10 shadow-[inset_3px_0_0_rgb(var(--color-accent))]',
        matchesPrediction === false && !qualifiedOrderOff && 'bg-danger/10 shadow-[inset_3px_0_0_rgb(var(--color-danger))]'
      )}
    >
      <span className="data-number text-sm font-bold text-muted">{position}</span>
      <div className="flex min-w-0 items-center gap-2">
        {team ? <Flag team={team} className="h-6 w-8" /> : <span className="grid h-6 w-8 shrink-0 place-items-center rounded bg-surface text-[10px] font-extrabold text-muted ring-1 ring-line">{row.code}</span>}
        <span className="truncate text-sm font-semibold text-ink">{row.name}</span>
      </div>
      <div className="text-right">
        <Badge tone={matchesPrediction === true ? 'success' : qualifiedOrderOff ? 'warning' : matchesPrediction === false ? 'danger' : 'muted'}>{row.pts} pts</Badge>
        <p className="mt-1 text-xs text-muted">{row.played}P · {row.gf}-{row.ga} · GD {row.gf - row.ga}</p>
      </div>
    </div>
  );
}

function sameCodeSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((code) => b.includes(code));
}
