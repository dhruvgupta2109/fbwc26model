'use client';

import { Moon, Sun, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';

const tabs = [
  ['Overview', '/overview/'],
  ['Bracket', '/bracket/'],
  ['Groups', '/groups/'],
  ['Teams', '/teams/'],
  ['Model', '/model/'],
  ['Live', '/live/']
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
        <Link href="/overview/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <Trophy className="h-5 w-5" />
          </span>
          <span>WC26 Oracle</span>
        </Link>
        <div className="ml-auto hidden items-center gap-1 md:flex">
          {tabs.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                pathname === href || pathname === href.slice(0, -1) ? 'bg-primary/[0.12] text-primary' : 'text-muted hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <Button variant="ghost" aria-label="Toggle theme" onClick={toggleTheme} className="ml-auto px-3 md:ml-2">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </nav>
      <div className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {tabs.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
              pathname === href || pathname === href.slice(0, -1) ? 'bg-primary/[0.12] text-primary' : 'text-muted hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
