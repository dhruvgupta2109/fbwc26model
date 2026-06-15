'use client';

import { GroupCard } from '@/components/cards/GroupCard';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSimulation } from '@/hooks/useSimulation';

export function GroupsPage() {
  const { result } = useSimulation();

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
        {(result?.groups ?? []).map((group) => <GroupCard key={group.group} group={group} />)}
      </section>
    </PageTransition>
  );
}
