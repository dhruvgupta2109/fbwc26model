import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'WC26 Oracle',
  description: 'A client-side Monte Carlo prediction dashboard for the FIFA World Cup 2026.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('wc26-theme') || 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.colorScheme = theme;
              } catch (_) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              }
            `
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
