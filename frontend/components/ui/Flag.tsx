/* eslint-disable @next/next/no-img-element */
import { flagUrl } from '@/lib/data';
import type { Team } from '@/simulation/types';

export function Flag({ team, className = 'h-8 w-10' }: { team: Pick<Team, 'flag' | 'name'>; className?: string }) {
  return (
    <img
      src={flagUrl(team)}
      alt={`${team.name} flag`}
      className={`${className} rounded object-cover ring-1 ring-line`}
      loading="lazy"
      width={80}
      height={60}
    />
  );
}
