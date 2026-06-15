export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-surface/[0.78] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted lg:px-6">
        <p>Data attribution: football-data.org, API-Football, public rating references, and bundled static fallback data.</p>
        <p>Built with Next.js · Deployed as a static GitHub Pages export.</p>
        <p>Predictions are probabilistic simulations for entertainment purposes.</p>
      </div>
    </footer>
  );
}
