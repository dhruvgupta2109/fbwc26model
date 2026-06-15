'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { teams } from '@/lib/data';
import { TeamCard } from '@/components/cards/TeamCard';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSimulation } from '@/hooks/useSimulation';

const confederations = ['All', 'UEFA', 'CONMEBOL', 'CAF', 'AFC', 'CONCACAF', 'OFC'];

export function TeamsPage() {
  const { result } = useSimulation();
  const [query, setQuery] = useState('');
  const [confederation, setConfederation] = useState('All');
  const [sort, setSort] = useState('Win Probability');
  const probabilityByCode = useMemo(() => Object.fromEntries((result?.teams ?? []).map((team) => [team.code, team])), [result]);
  const filteredTeams = useMemo(() => {
    return teams
      .filter((team) => confederation === 'All' || team.confederation === confederation)
      .filter((team) => `${team.name} ${team.code}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        if (sort === 'FIFA Ranking') return a.fifaRank - b.fifaRank;
        if (sort === 'Historical Titles') return b.titles - a.titles || a.fifaRank - b.fifaRank;
        return (probabilityByCode[b.code]?.win ?? 0) - (probabilityByCode[a.code]?.win ?? 0);
      });
  }, [confederation, probabilityByCode, query, sort]);

  return (
    <PageTransition>
      <section className="hero-panel p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-muted">Team Grid</p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              <GradientText>All 48 Teams</GradientText>
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams" className="h-10 rounded-lg border-line bg-surface/[0.85] pl-9 text-sm text-ink" />
            </label>
            <select value={confederation} onChange={(event) => setConfederation(event.target.value)} className="h-10 rounded-lg border-line bg-surface/[0.85] text-sm text-ink">
              {confederations.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-lg border-line bg-surface/[0.85] text-sm text-ink">
              <option>Win Probability</option>
              <option>FIFA Ranking</option>
              <option>Historical Titles</option>
            </select>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTeams.map((team) => <TeamCard key={team.code} team={team} probability={probabilityByCode[team.code]} />)}
      </section>
    </PageTransition>
  );
}
