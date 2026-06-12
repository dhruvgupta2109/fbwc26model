import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getTeam, playerSpotlights, teams } from '@/lib/data';
import { FACTOR_LABELS } from '@/simulation/factors';
import { Badge } from '@/components/ui/Badge';
import { Flag } from '@/components/ui/Flag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';

export function generateStaticParams() {
  return teams.map((team) => ({ code: team.code.toLowerCase() }));
}

export default function TeamPage({ params }: { params: { code: string } }) {
  const team = getTeam(params.code) ?? teams[0];
  const inputs = [
    ['elo', Math.round(((team.elo - 1450) / 670) * 100)],
    ['form', team.form],
    ['xg', Math.round(((team.xgFor - team.xgAgainst + 0.6) / 2.3) * 100)],
    ['squad', team.squadQuality],
    ['home', team.confederation === 'CONCACAF' ? 100 : team.confederation === 'CONMEBOL' ? 45 : 10],
    ['lucky', Math.round((team.lucky / 6) * 100)]
  ] as const;

  return (
    <PageTransition className="mx-auto max-w-6xl">
        <Link href="/teams/" className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-surface/80 px-3 py-2 text-sm font-semibold text-ink hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4" />
          Back to teams
        </Link>

        <section className="hero-panel p-6">
          <div className="relative z-10 flex flex-wrap items-center gap-5">
            <Flag team={team} className="h-20 w-[108px]" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">{team.confederation}</Badge>
                <Badge tone="muted">FIFA rank #{team.fifaRank}</Badge>
              </div>
              <h1 className="mt-3 text-4xl font-extrabold">
                <GradientText>{team.name}</GradientText>
              </h1>
              <p className="mt-2 text-muted">Manager: {team.manager} · Captain: {team.captain}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Win profile" value={`${Math.max(1, Math.round((2200 - team.fifaRank * 18) / 120))}%`} />
          <Metric label="Finalist profile" value={`${Math.max(2, Math.round((team.elo - 1450) / 18))}%`} />
          <Metric label="Titles" value={String(team.titles)} />
          <Metric label="Appearances" value={String(team.appearances)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="card p-5">
            <h2 className="section-title">Model Inputs</h2>
            <div className="mt-5 grid gap-4">
              {inputs.map(([key, value]) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{FACTOR_LABELS[key]?.label ?? key}</span>
                    <span className="data-number text-sm font-bold text-primary">{Math.max(0, Math.min(100, value))}%</span>
                  </div>
                  <ProgressBar value={Math.max(0, Math.min(100, value))} />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="section-title">Historical WC Performance</h2>
            <div className="mt-5 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-accent" />
              <div>
                <p className="font-bold text-ink">{team.bestResult}</p>
                <p className="text-sm text-muted">{team.appearances} appearances · {team.titles} titles</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {Array.from({ length: Math.min(team.appearances, 18) }).map((_, index) => (
                <span key={index} className={`h-9 rounded-lg border border-line ${index < team.titles ? 'bg-accent' : 'bg-primary/15'}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {(playerSpotlights[team.code] ?? []).map((player) => (
            <article key={player.name} className="card p-5">
              <div className="mb-4 h-24 rounded-xl border border-line bg-canvas" />
              <h3 className="font-bold text-ink">{player.name}</h3>
              <p className="text-sm text-muted">{player.position} · {player.club}</p>
              <p className="mt-3 text-sm text-muted">{player.caps} caps · {player.goals} goals · {player.xg} xG/90</p>
            </article>
          ))}
        </section>

        <section className="card p-5">
          <h2 className="section-title">Fun Facts</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted">{`${team.captain}'s birthday factor is included only when it falls within the match window.`}</p>
            <p className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted">{`${team.name}'s lucky number score is ${team.lucky}/6 in the default data pack.`}</p>
            <p className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted">{`Home-continent weighting gives ${team.confederation} a ${team.confederation === 'CONCACAF' ? 'large' : team.confederation === 'CONMEBOL' ? 'small' : 'minimal'} regional adjustment.`}</p>
          </div>
        </section>
    </PageTransition>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="data-number mt-2 text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}
