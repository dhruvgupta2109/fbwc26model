'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Play, Share2, Sparkles, Trophy, Zap } from 'lucide-react';
import { teams, funFacts } from '@/lib/data';
import { downloadPredictionCard, encodedWeights } from '@/lib/shareCard';
import { useSimulation } from '@/hooks/useSimulation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChampionCard } from '@/components/cards/ChampionCard';
import { GradientText } from '@/components/visual/GradientText';
import { PageTransition } from '@/components/layout/PageTransition';

export function OverviewPage() {
  const { result, weights, run, isRunning, completed, total, progress, error } = useSimulation();
  const shareRef = useRef<HTMLDivElement>(null);
  const championTeam = teams.find((team) => team.code === result?.champion) ?? teams[0];
  const championProbability = result?.teams.find((team) => team.code === championTeam.code)?.win ?? 0;
  const topEight = result?.teams.slice(0, 8) ?? [];
  const probabilityByCode = useMemo(() => Object.fromEntries((result?.teams ?? []).map((team) => [team.code, team])), [result]);

  async function handleShareDownload() {
    if (shareRef.current) await downloadPredictionCard(shareRef.current);
  }

  return (
    <PageTransition>
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="hero-panel p-6 lg:p-8">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">10,000-run Monte Carlo</Badge>
              <Badge tone="warning">World Cup 2026</Badge>
            </div>
            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
                <GradientText>Who Will Lift the Trophy?</GradientText>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                A polished tournament simulator with adjustable football signals, playful chaos factors, and a full 48-team route from group stage to final.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={run} disabled={isRunning}>
                <Play className="h-4 w-4" />
                {isRunning ? 'Simulating...' : 'Run Simulation'}
              </Button>
              <Button variant="ghost" onClick={handleShareDownload}>
                <Download className="h-4 w-4" />
                Share My Prediction
              </Button>
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface/[0.65] px-4 py-2 text-sm font-semibold text-ink hover:bg-primary/10"
                href={encodedWeights(weights)}
              >
                <Share2 className="h-4 w-4" />
                Reproducible URL
              </a>
            </div>
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-sm text-muted">
                <span>{isRunning ? `Simulating ${completed.toLocaleString()} / ${total.toLocaleString()} tournaments...` : `Last run: ${result?.iterations.toLocaleString() ?? 0} tournaments`}</span>
                <span className="data-number">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            </div>
            <Ticker topEight={topEight} />
          </div>
        </div>
        <div ref={shareRef} className="grid gap-5">
          <ChampionCard team={championTeam} probability={championProbability} />
          <div className="card cinematic-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              <h2 className="section-title">Upset Watch</h2>
            </div>
            <div className="grid gap-3">
              {(result?.upsetWatch ?? []).map((upset) => {
                const team = teams.find((item) => item.code === upset.team)!;
                const target = teams.find((item) => item.code === upset.target)!;
                return (
                  <motion.div
                    key={`${upset.team}-${upset.target}`}
                    whileHover={{ x: 4 }}
                    className="rounded-lg border border-line bg-canvas/80 p-3"
                  >
                    <p className="text-sm font-semibold text-ink">{team.name} over {target.name}</p>
                    <p className="data-number mt-1 text-sm text-primary">{upset.probability}% upset signal</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="section-title">Top 8 Predictions</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topEight.map((item, index) => {
            const team = teams.find((candidate) => candidate.code === item.code)!;
            return (
              <motion.div
                key={item.code}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -4 }}
                className="card cinematic-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Flag team={team} />
                  <div>
                    <p className="font-bold text-ink">{team.name}</p>
                    <p className="text-xs text-muted">QF {item.quarterFinal}% · Final {item.finalist}%</p>
                  </div>
                </div>
                <ProgressBar value={item.win} className="mt-4" />
                <p className="data-number mt-2 text-sm font-bold text-primary">{item.win}% champion</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="section-title">Fun Stats</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {funFacts.map((fact, index) => (
            <motion.div
              key={fact.title}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="card cinematic-card p-4"
            >
              <h3 className="text-sm font-semibold leading-5 text-ink">{fact.title}</h3>
              <p className="mt-3 text-xs leading-5 text-muted">{fact.description}</p>
              <p className="mt-3 text-xs text-muted">Fun Stats - not all are statistically significant.</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}

function Ticker({ topEight }: { topEight: Array<{ code: string; win: number }> }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-line bg-canvas/80 p-3">
      <motion.div
        animate={{ x: ['0%', '-18%', '0%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="flex w-max gap-3"
      >
        {[...topEight.slice(0, 5), ...topEight.slice(0, 5)].map((item, index) => {
          const team = teams.find((candidate) => candidate.code === item.code)!;
          return (
            <div key={`${item.code}-${index}`} className="flex shrink-0 items-center gap-2 rounded-lg bg-surface/[0.85] px-3 py-2">
              <Flag team={team} className="h-5 w-7" />
              <span className="text-sm font-semibold text-ink">{team.name}</span>
              <span className="data-number text-sm font-bold text-primary">{item.win}%</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
