import { Badge } from '@/components/ui/Badge';
import { Flag } from '@/components/ui/Flag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Team } from '@/simulation/types';

export function ChampionCard({ team, probability }: { team: Team; probability: number }) {
  return (
    <div className="card cinematic-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Flag team={team} className="h-14 w-[74px]" />
          <div>
            <p className="text-sm font-semibold text-muted">Predicted champion</p>
            <h2 className="text-2xl font-bold text-ink">{team.name}</h2>
          </div>
        </div>
        {probability < 15 ? <Badge tone="warning">Upset Alert</Badge> : <Badge tone="success">Model favorite</Badge>}
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-semibold text-muted">Win probability</span>
          <span className="data-number text-3xl font-bold text-primary">{probability.toFixed(1)}%</span>
        </div>
        <ProgressBar value={probability} />
      </div>
    </div>
  );
}
