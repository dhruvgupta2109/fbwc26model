import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Flag } from '@/components/ui/Flag';
import type { Team, TeamProbability } from '@/simulation/types';

export function TeamCard({ team, probability }: { team: Team; probability?: TeamProbability }) {
  return (
    <Link href={`/team/${team.code.toLowerCase()}/`} className="card cinematic-card block p-4 hover:border-primary/50 hover:bg-primary/5">
      <div className="flex items-center justify-between gap-3">
        <Flag team={team} />
        <Badge tone="muted">#{team.fifaRank}</Badge>
      </div>
      <h3 className="mt-4 font-bold text-ink">{team.name}</h3>
      <p className="mt-1 text-sm text-muted">{team.confederation} · {team.bestResult}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted">Win</span>
        <span className="data-number rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
          {(probability?.win ?? 0).toFixed(1)}%
        </span>
      </div>
    </Link>
  );
}
