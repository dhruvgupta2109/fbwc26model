'use client';

import { useMemo } from 'react';
import { GroupCard } from '@/components/cards/GroupCard';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useLiveScores, type LiveMatch } from '@/hooks/useLiveScores';
import { useSimulation } from '@/hooks/useSimulation';
import { teams } from '@/lib/data';

export interface ActualGroupRow {
  code: string;
  name: string;
  played: number;
  pts: number;
  gf: number;
  ga: number;
  wins: number;
}

export interface ActualGroupTable {
  group: string;
  teams: ActualGroupRow[];
  completedMatches: number;
  totalMatches: number;
  isFinal: boolean;
}

export function GroupsPage() {
  const { result } = useSimulation();
  const { matches } = useLiveScores();
  const actualStandings = useMemo(() => buildActualStandings(matches), [matches]);

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10">
          <p className="text-sm font-bold uppercase text-muted">Group Stage</p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
            <GradientText>Predicted Standings</GradientText>
          </h1>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(result?.groups ?? []).map((group) => <GroupCard key={group.group} group={group} actual={actualStandings[group.group]} />)}
      </section>
    </PageTransition>
  );
}

function buildActualStandings(matches: LiveMatch[]): Record<string, ActualGroupTable> {
  const teamNameByCode = new Map(teams.map((team) => [team.code, team.name]));
  const byGroup = new Map<string, { rows: Record<string, ActualGroupRow>; totalMatches: number; completedMatches: number }>();

  matches.forEach((match) => {
    const group = groupFromStage(match.stage);
    if (!group) return;

    const table = byGroup.get(group) ?? { rows: {}, totalMatches: 0, completedMatches: 0 };
    byGroup.set(group, table);
    table.totalMatches += 1;
    if (match.status === 'FT') table.completedMatches += 1;
    if (match.status === 'Upcoming') {
      ensureRow(table.rows, match.homeCode, match.home, teamNameByCode);
      ensureRow(table.rows, match.awayCode, match.away, teamNameByCode);
      return;
    }

    const home = ensureRow(table.rows, match.homeCode, match.home, teamNameByCode);
    const away = ensureRow(table.rows, match.awayCode, match.away, teamNameByCode);
    home.played += 1;
    away.played += 1;
    home.gf += match.homeScore;
    home.ga += match.awayScore;
    away.gf += match.awayScore;
    away.ga += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.pts += 3;
      home.wins += 1;
    } else if (match.awayScore > match.homeScore) {
      away.pts += 3;
      away.wins += 1;
    } else {
      home.pts += 1;
      away.pts += 1;
    }
  });

  return Object.fromEntries(
    Array.from(byGroup.entries()).map(([group, table]) => [
      group,
      {
        group,
        teams: Object.values(table.rows).sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || b.wins - a.wins || a.code.localeCompare(b.code)),
        completedMatches: table.completedMatches,
        totalMatches: table.totalMatches,
        isFinal: table.totalMatches > 0 && table.completedMatches === table.totalMatches
      }
    ])
  );
}

function groupFromStage(stage: string) {
  return stage.match(/\bGroup\s+([A-L])\b/)?.[1];
}

function ensureRow(rows: Record<string, ActualGroupRow>, code: string, fallbackName: string, teamNameByCode: Map<string, string>) {
  rows[code] = rows[code] ?? {
    code,
    name: teamNameByCode.get(code) ?? fallbackName,
    played: 0,
    pts: 0,
    gf: 0,
    ga: 0,
    wins: 0
  };

  return rows[code];
}
