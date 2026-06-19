'use client';

import { MagicRings } from './MagicRings';

export function AppBackground() {
  return (
    <div className="app-background" aria-hidden="true">
      <div className="app-background-grid" />
      <div className="app-background-rings app-background-rings-primary">
        <MagicRings color="#38bdf8" colorTwo="#f59e0b" speed={0.52} opacity={0.7} ringCount={8} baseRadius={0.16} scaleRate={0.28} />
      </div>
      <div className="app-background-rings app-background-rings-secondary">
        <MagicRings color="#22c55e" colorTwo="#f472b6" speed={0.38} opacity={0.38} ringCount={5} baseRadius={0.2} scaleRate={0.2} rotation={32} />
      </div>
    </div>
  );
}
