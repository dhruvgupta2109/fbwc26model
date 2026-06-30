'use client';

import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { GitBranch, Route, Trophy } from 'lucide-react';
import { flagUrl, teams } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { Flag } from '@/components/ui/Flag';
import type { BracketSlot, GoldenBootProjection, Team } from '@/simulation/types';

type MatchStage = Exclude<BracketSlot['stage'], 'Champion'>;
type MarkerStatus = 'correct' | 'wrong' | 'pending';
type BracketMarkerMode = 'prediction' | 'actual';

const CENTER = 500;
const LEAF_COUNT = 32;
const START_ANGLE = -90 + 180 / LEAF_COUNT;
const TEAM_RADIUS = 438;
const SVG_SIZE = 1000;
const TEAM_MARKER_SIZE = 46;
const WINNER_MARKER_SIZE = 28;

const stageLabels: Record<BracketSlot['stage'], string> = {
  R32: 'R32',
  R16: 'R16',
  QF: 'QF',
  SF: 'SF',
  Final: 'Final',
  Champion: 'Champion'
};

const stageRadii: Record<MatchStage, number> = {
  R32: 360,
  R16: 286,
  QF: 214,
  SF: 146,
  Final: 78
};

const stageCounts: Record<BracketSlot['stage'], number> = {
  R32: 16,
  R16: 8,
  QF: 4,
  SF: 2,
  Final: 1,
  Champion: 1
};

const nextStageByStage: Record<MatchStage, BracketSlot['stage']> = {
  R32: 'R16',
  R16: 'QF',
  QF: 'SF',
  SF: 'Final',
  Final: 'Champion'
};

interface DraftEntrant {
  kind: 'entrant';
  id: string;
  parentSlot?: BracketSlot;
  teamCode?: string;
}

interface DraftMatch {
  kind: 'match';
  id: string;
  stage: MatchStage;
  index: number;
  slot?: BracketSlot;
  children: DraftNode[];
}

type DraftNode = DraftEntrant | DraftMatch;

interface RadialBase {
  id: string;
  angle: number;
  position: number;
  radius: number;
  x: number;
  y: number;
  active: boolean;
  title: string;
}

interface RadialEntrant extends RadialBase {
  kind: 'entrant';
  parentSlot?: BracketSlot;
  team?: Team;
}

interface RadialMatch extends RadialBase {
  kind: 'match';
  stage: MatchStage;
  index: number;
  slot?: BracketSlot;
  winnerTeam?: Team;
  children: RadialNode[];
}

type RadialNode = RadialEntrant | RadialMatch;

interface RadialLayout {
  entrants: RadialEntrant[];
  matches: RadialMatch[];
  finalSlot?: BracketSlot;
  centerTeam?: Team;
  centerLabel: string;
}

interface RadialConnectorSegment {
  id: string;
  d: string;
  active: boolean;
}

interface ActualProgress {
  teamsByStage: Record<BracketSlot['stage'], Set<string>>;
  winnersByStage: Record<MatchStage, Set<string>>;
  matchByStageTeam: Record<MatchStage, Map<string, BracketSlot>>;
  teamsCompleteByStage: Record<BracketSlot['stage'], boolean>;
  winnersCompleteByStage: Record<MatchStage, boolean>;
}

const teamByCode = new Map(teams.map((team) => [team.code, team]));

function teamForCode(code?: string) {
  return code ? teamByCode.get(code) : undefined;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function pointOnCircle(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(radians) * radius,
    y: CENTER + Math.sin(radians) * radius
  };
}

function angleForPosition(position: number) {
  return START_ANGLE + (360 / LEAF_COUNT) * position;
}

function childMatchIndexes(stage: MatchStage, index: number): Array<[MatchStage, number]> {
  switch (stage) {
    case 'Final':
      return [
        ['SF', 0],
        ['SF', 1]
      ];
    case 'SF':
      return [
        ['QF', index],
        ['QF', 3 - index]
      ];
    case 'QF':
      return [
        ['R16', index],
        ['R16', 7 - index]
      ];
    case 'R16':
      return [
        ['R32', index],
        ['R32', 15 - index]
      ];
    case 'R32':
      return [];
  }
}

function describeMatch(slot?: BracketSlot) {
  if (!slot) return 'Match not set';

  const teamA = teamForCode(slot.teamA)?.name ?? slot.teamA ?? 'TBD';
  const teamB = teamForCode(slot.teamB)?.name ?? slot.teamB ?? 'TBD';
  const winner = teamForCode(slot.winner)?.name ?? slot.winner;

  return `${stageLabels[slot.stage]}: ${teamA} vs ${teamB}${winner ? `, winner ${winner}` : ''}`;
}

function buildRadialLayout(bracket: BracketSlot[], champion?: string): RadialLayout {
  const slotsByStage = new Map<BracketSlot['stage'], BracketSlot[]>();
  bracket.forEach((slot) => {
    const current = slotsByStage.get(slot.stage) ?? [];
    current.push(slot);
    slotsByStage.set(slot.stage, current);
  });

  const slotAt = (stage: BracketSlot['stage'], index = 0) => slotsByStage.get(stage)?.[index];

  const makeDraftMatch = (stage: MatchStage, index: number): DraftMatch => {
    const slot = slotAt(stage, index);

    if (stage === 'R32') {
      return {
        kind: 'match',
        id: slot?.id ?? `${stage}-${index}`,
        stage,
        index,
        slot,
        children: [
          { kind: 'entrant', id: `${slot?.id ?? `${stage}-${index}`}-team-a`, parentSlot: slot, teamCode: slot?.teamA },
          { kind: 'entrant', id: `${slot?.id ?? `${stage}-${index}`}-team-b`, parentSlot: slot, teamCode: slot?.teamB }
        ]
      };
    }

    return {
      kind: 'match',
      id: slot?.id ?? `${stage}-${index}`,
      stage,
      index,
      slot,
      children: childMatchIndexes(stage, index).map(([childStage, childIndex]) => makeDraftMatch(childStage, childIndex))
    };
  };

  const draftRoot = makeDraftMatch('Final', 0);
  let nextPosition = 0;

  const layoutNode = (node: DraftNode): RadialNode => {
    if (node.kind === 'entrant') {
      const position = nextPosition;
      nextPosition += 1;
      const angle = angleForPosition(position);
      const { x, y } = pointOnCircle(angle, TEAM_RADIUS);
      const team = teamForCode(node.teamCode);
      const active = Boolean(champion && node.teamCode === champion);

      return {
        kind: 'entrant',
        id: node.id,
        parentSlot: node.parentSlot,
        team,
        position,
        angle,
        radius: TEAM_RADIUS,
        x,
        y,
        active,
        title: team ? `${team.name} (${team.code})` : 'TBD'
      };
    }

    const children = node.children.map(layoutNode);
    const position = children.reduce((total, child) => total + child.position, 0) / children.length;
    const angle = angleForPosition(position);
    const radius = stageRadii[node.stage];
    const { x, y } = pointOnCircle(angle, radius);
    const winnerTeam = teamForCode(node.slot?.winner);
    const active = Boolean(champion && node.slot?.winner === champion);

    return {
      kind: 'match',
      id: node.id,
      stage: node.stage,
      index: node.index,
      slot: node.slot,
      winnerTeam,
      children,
      position,
      angle,
      radius,
      x,
      y,
      active,
      title: describeMatch(node.slot)
    };
  };

  const root = layoutNode(draftRoot) as RadialMatch;
  const entrants: RadialEntrant[] = [];
  const matches: RadialMatch[] = [];

  const collect = (node: RadialNode) => {
    if (node.kind === 'entrant') {
      entrants.push(node);
      return;
    }

    matches.push(node);
    node.children.forEach(collect);
  };

  collect(root);

  const championSlot = slotAt('Champion');
  const finalSlot = slotAt('Final');
  const centerTeam = teamForCode(championSlot?.winner ?? champion);

  return {
    entrants,
    matches,
    finalSlot,
    centerTeam,
    centerLabel: centerTeam?.name ?? 'TBD'
  };
}

function arcDelta(fromAngle: number, toAngle: number, sweepFlag: 0 | 1) {
  let delta = sweepFlag === 1 ? toAngle - fromAngle : fromAngle - toAngle;
  while (delta < 0) delta += 360;
  return delta;
}

function radialConnectorSegments(parent: RadialMatch): RadialConnectorSegment[] {
  const [first, second] = parent.children;
  if (!first || !second) return [];

  const childRadius = Math.min(first.radius, second.radius);
  const bridgeRadius = parent.radius + (childRadius - parent.radius) * 0.48;
  const bridgeMid = pointOnCircle(parent.angle, bridgeRadius);
  const target = parent.stage === 'Final' ? { x: CENTER, y: CENTER } : parent;

  const childPath = (child: RadialNode, sweepFlag: 0 | 1) => {
    const childBridge = pointOnCircle(child.angle, bridgeRadius);
    const largeArcFlag = arcDelta(child.angle, parent.angle, sweepFlag) > 180 ? 1 : 0;

    return [
      `M ${child.x.toFixed(2)} ${child.y.toFixed(2)}`,
      `L ${childBridge.x.toFixed(2)} ${childBridge.y.toFixed(2)}`,
      `A ${bridgeRadius.toFixed(2)} ${bridgeRadius.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${bridgeMid.x.toFixed(2)} ${bridgeMid.y.toFixed(2)}`
    ].join(' ');
  };

  return [
    {
      id: `${parent.id}-first`,
      d: childPath(first, 1),
      active: parent.active && first.active
    },
    {
      id: `${parent.id}-second`,
      d: childPath(second, 0),
      active: parent.active && second.active
    },
    {
      id: `${parent.id}-stem`,
      d: [
        `M ${bridgeMid.x.toFixed(2)} ${bridgeMid.y.toFixed(2)}`,
        `L ${target.x.toFixed(2)} ${target.y.toFixed(2)}`
      ].join(' '),
      active: parent.active
    }
  ];
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isDimmed(pathOnly: boolean, champion: string | undefined, active: boolean) {
  return Boolean(pathOnly && champion && !active);
}

function emptyStageSets(): Record<BracketSlot['stage'], Set<string>> {
  return {
    R32: new Set<string>(),
    R16: new Set<string>(),
    QF: new Set<string>(),
    SF: new Set<string>(),
    Final: new Set<string>(),
    Champion: new Set<string>()
  };
}

function emptyMatchStageSets(): Record<MatchStage, Set<string>> {
  return {
    R32: new Set<string>(),
    R16: new Set<string>(),
    QF: new Set<string>(),
    SF: new Set<string>(),
    Final: new Set<string>()
  };
}

function emptyMatchStageMaps(): Record<MatchStage, Map<string, BracketSlot>> {
  return {
    R32: new Map<string, BracketSlot>(),
    R16: new Map<string, BracketSlot>(),
    QF: new Map<string, BracketSlot>(),
    SF: new Map<string, BracketSlot>(),
    Final: new Map<string, BracketSlot>()
  };
}

function buildActualProgress(actualBracket?: BracketSlot[]): ActualProgress | undefined {
  if (!actualBracket) return undefined;

  const teamsByStage = emptyStageSets();
  const winnersByStage = emptyMatchStageSets();
  const matchByStageTeam = emptyMatchStageMaps();
  const teamsCompleteByStage = {} as Record<BracketSlot['stage'], boolean>;
  const winnersCompleteByStage = {} as Record<MatchStage, boolean>;

  (Object.keys(stageCounts) as BracketSlot['stage'][]).forEach((stage) => {
    const slots = actualBracket.filter((slot) => slot.stage === stage);
    slots.forEach((slot) => {
      if (slot.teamA) teamsByStage[stage].add(slot.teamA);
      if (slot.teamB) teamsByStage[stage].add(slot.teamB);

      if (stage !== 'Champion') {
        const matchStage = stage as MatchStage;
        if (slot.teamA) matchByStageTeam[matchStage].set(slot.teamA, slot);
        if (slot.teamB) matchByStageTeam[matchStage].set(slot.teamB, slot);
        if (slot.winner) {
          winnersByStage[matchStage].add(slot.winner);
          teamsByStage[nextStageByStage[matchStage]].add(slot.winner);
        }
      }
    });

    teamsCompleteByStage[stage] =
      slots.length >= stageCounts[stage] && slots.every((slot) => stage === 'Champion' || Boolean(slot.teamA && slot.teamB));

    if (stage !== 'Champion') {
      winnersCompleteByStage[stage] = slots.length >= stageCounts[stage] && slots.every((slot) => Boolean(slot.winner));
    }
  });

  actualBracket
    .filter((slot) => slot.stage === 'Champion' && slot.winner)
    .forEach((slot) => teamsByStage.Champion.add(slot.winner!));

  return {
    teamsByStage,
    winnersByStage,
    matchByStageTeam,
    teamsCompleteByStage,
    winnersCompleteByStage
  };
}

function roundTeamStatus(teamCode: string | undefined, stage: BracketSlot['stage'], actual?: ActualProgress): MarkerStatus | undefined {
  if (!teamCode || !actual) return undefined;
  if (actual.teamsByStage[stage].has(teamCode)) return 'correct';
  if (actual.teamsCompleteByStage[stage]) return 'wrong';
  return 'pending';
}

function advancingTeamStatus(match: RadialMatch, actual?: ActualProgress): MarkerStatus | undefined {
  const winner = match.slot?.winner;
  if (!winner || !actual) return undefined;

  const nextStage = nextStageByStage[match.stage];
  if (actual.teamsByStage[nextStage].has(winner) || actual.winnersByStage[match.stage].has(winner)) return 'correct';

  const actualMatch = actual.matchByStageTeam[match.stage].get(winner);
  if (actualMatch?.winner) return 'wrong';
  if (actual.winnersCompleteByStage[match.stage] || actual.teamsCompleteByStage[match.stage]) return 'wrong';
  return 'pending';
}

function statusClass(status: MarkerStatus | undefined, mode: BracketMarkerMode) {
  if (mode === 'actual') return 'radial-status-actual';
  if (!status) return undefined;
  return `radial-status-${status}`;
}

function matchDetail(slot?: BracketSlot) {
  if (!slot || slot.stage === 'Champion') return null;
  const teamA = teamForCode(slot.teamA);
  const teamB = teamForCode(slot.teamB);
  if (!teamA && !teamB) return null;

  return `${teamA?.code ?? 'TBD'} vs ${teamB?.code ?? 'TBD'}`;
}

function scoreDetail(slot?: BracketSlot) {
  if (typeof slot?.scoreA !== 'number' || typeof slot.scoreB !== 'number') return null;
  return `${slot.scoreA}-${slot.scoreB}`;
}

export function BracketView({
  bracket,
  actualBracket,
  goldenBoot,
  champion
}: {
  bracket: BracketSlot[];
  actualBracket: BracketSlot[];
  goldenBoot: GoldenBootProjection[];
  champion: string;
}) {
  const [pathOnly, setPathOnly] = useState(false);
  const championTeam = teams.find((team) => team.code === champion);

  return (
    <div className="grid gap-5">
      <RadialBracketSection
        bracket={bracket}
        comparisonBracket={actualBracket}
        champion={champion}
        pathOnly={pathOnly}
        markerMode="prediction"
        title="Prediction Bracket"
        eyebrow="Model projection"
        action={
          <Button variant={pathOnly ? 'primary' : 'ghost'} onClick={() => setPathOnly((value) => !value)}>
            <Route className="h-4 w-4" />
            Most Likely Path
          </Button>
        }
      />

      <RadialBracketSection bracket={actualBracket} markerMode="actual" title="Actual Bracket" eyebrow="Official results" emptyLabel="TBD" />

      <aside className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-ink">Golden Boot Prediction</h3>
          {championTeam ? (
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
              <Flag team={championTeam} className="h-6 w-8" />
              <span className="text-sm font-bold text-ink">{championTeam.name}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {goldenBoot.map((item, index) => {
            const team = teams.find((candidate) => candidate.code === item.team)!;
            return (
              <div key={`${item.team}-${item.player}`} className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
                <span className="data-number text-sm font-bold text-muted">{index + 1}</span>
                <Flag team={team} className="h-6 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.player}</p>
                  <p className="text-xs text-muted">{team.name}</p>
                </div>
                <div className="text-right">
                  <p className="data-number text-sm font-bold text-primary">{item.projectedGoals}</p>
                  <p className="text-xs text-muted">{item.probability}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function RadialBracketSection({
  bracket,
  comparisonBracket,
  champion,
  pathOnly = false,
  markerMode = 'prediction',
  title,
  eyebrow,
  emptyLabel = 'TBD',
  action
}: {
  bracket: BracketSlot[];
  comparisonBracket?: BracketSlot[];
  champion?: string;
  pathOnly?: boolean;
  markerMode?: BracketMarkerMode;
  title: string;
  eyebrow: string;
  emptyLabel?: string;
  action?: ReactNode;
}) {
  const bracketChampion = useMemo(() => bracket.find((slot) => slot.stage === 'Champion')?.winner ?? champion, [bracket, champion]);
  const layout = useMemo(() => buildRadialLayout(bracket, bracketChampion), [bracket, bracketChampion]);
  const actualProgress = useMemo(() => buildActualProgress(comparisonBracket), [comparisonBracket]);
  const visibleMatches = layout.matches.filter((match) => match.stage !== 'Final');
  const idPrefix = sanitizeId(useId());
  const finalDetail = matchDetail(layout.finalSlot);
  const finalScore = scoreDetail(layout.finalSlot);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-bold uppercase text-muted">{eyebrow}</p>
            <h2 className="section-title">{title}</h2>
          </div>
        </div>
        {action}
      </div>

      <div className="radial-bracket-scroll">
        <div className="radial-bracket-frame">
          <svg className="radial-bracket-svg" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} role="img" aria-label={`${title} circular knockout bracket`}>
            <defs>
              {layout.entrants.map((entrant) => (
                <clipPath key={entrant.id} id={`${idPrefix}-${sanitizeId(entrant.id)}`}>
                  <circle cx={entrant.x} cy={entrant.y} r={TEAM_MARKER_SIZE / 2} />
                </clipPath>
              ))}
              {visibleMatches.map((match) => (
                <clipPath key={`winner-${match.id}`} id={`${idPrefix}-${sanitizeId(match.id)}-winner`}>
                  <circle cx={match.x} cy={match.y} r={WINNER_MARKER_SIZE / 2} />
                </clipPath>
              ))}
            </defs>

            <circle className="radial-guide radial-guide-outer" cx={CENTER} cy={CENTER} r={TEAM_RADIUS} />
            <circle className="radial-guide" cx={CENTER} cy={CENTER} r={stageRadii.R16} />
            <circle className="radial-guide" cx={CENTER} cy={CENTER} r={stageRadii.SF} />

            <g>
              {layout.matches.flatMap((match) =>
                radialConnectorSegments(match).map((segment) => (
                  <path
                    key={`path-${segment.id}`}
                    d={segment.d}
                    className={classNames('radial-connector', segment.active && 'radial-connector-active', isDimmed(pathOnly, bracketChampion, segment.active) && 'radial-muted')}
                  />
                ))
              )}
            </g>

            <g>
              {visibleMatches.map((match) => (
                <g
                  key={`node-${match.id}`}
                  className={classNames(
                    'radial-node',
                    match.active && 'radial-node-active',
                    statusClass(advancingTeamStatus(match, actualProgress), markerMode),
                    isDimmed(pathOnly, bracketChampion, match.active) && 'radial-muted'
                  )}
                >
                  <title>{match.title}</title>
                  {match.winnerTeam ? (
                    <>
                      <circle className="radial-winner-bg" cx={match.x} cy={match.y} r={WINNER_MARKER_SIZE / 2 + 2.5} />
                      <image
                        href={flagUrl(match.winnerTeam)}
                        x={match.x - WINNER_MARKER_SIZE / 2}
                        y={match.y - WINNER_MARKER_SIZE / 2}
                        width={WINNER_MARKER_SIZE}
                        height={WINNER_MARKER_SIZE}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#${idPrefix}-${sanitizeId(match.id)}-winner)`}
                      />
                      <circle className="radial-winner-ring" cx={match.x} cy={match.y} r={WINNER_MARKER_SIZE / 2} />
                    </>
                  ) : (
                    <circle className="radial-match-placeholder" cx={match.x} cy={match.y} r={match.stage === 'Final' ? 7 : 5.5} />
                  )}
                </g>
              ))}
            </g>

            <g>
              {layout.entrants.map((entrant) => {
                const clipId = `${idPrefix}-${sanitizeId(entrant.id)}`;
                const muted = isDimmed(pathOnly, bracketChampion, entrant.active);
                const markerStatus = markerMode === 'prediction' ? 'correct' : roundTeamStatus(entrant.team?.code, 'R32', actualProgress);

                return (
                  <g
                    key={entrant.id}
                    className={classNames('radial-team-marker', entrant.active && 'radial-team-marker-active', statusClass(markerStatus, markerMode), muted && 'radial-muted')}
                  >
                    <title>{entrant.title}</title>
                    <circle className="radial-team-bg" cx={entrant.x} cy={entrant.y} r={TEAM_MARKER_SIZE / 2 + 3} />
                    {entrant.team ? (
                      <image
                        href={flagUrl(entrant.team)}
                        x={entrant.x - TEAM_MARKER_SIZE / 2}
                        y={entrant.y - TEAM_MARKER_SIZE / 2}
                        width={TEAM_MARKER_SIZE}
                        height={TEAM_MARKER_SIZE}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#${clipId})`}
                      />
                    ) : (
                      <>
                        <circle className="radial-placeholder" cx={entrant.x} cy={entrant.y} r={TEAM_MARKER_SIZE / 2} />
                        <text className="radial-placeholder-text" x={entrant.x} y={entrant.y}>
                          ?
                        </text>
                      </>
                    )}
                    <circle className="radial-team-ring" cx={entrant.x} cy={entrant.y} r={TEAM_MARKER_SIZE / 2} />
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="radial-center-token" aria-label={`Champion ${layout.centerLabel}`}>
            <Trophy className="h-7 w-7 text-accent" />
            <p className="text-[10px] font-extrabold uppercase text-muted">Champion</p>
            {layout.centerTeam ? (
              <div className="grid justify-items-center gap-1">
                <Flag team={layout.centerTeam} className="h-5 w-7" />
                <span className="max-w-[118px] truncate text-center text-xs font-extrabold text-ink">{layout.centerTeam.name}</span>
              </div>
            ) : (
              <span className="text-xs font-extrabold text-muted">{emptyLabel}</span>
            )}
            {finalDetail ? <p className="max-w-[124px] truncate text-[10px] font-bold text-muted">{finalDetail}</p> : null}
            {finalScore ? <p className="data-number text-xs font-extrabold text-primary">{finalScore}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
