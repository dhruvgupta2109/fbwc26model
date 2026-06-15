import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { AppBackground } from '@/components/visual/AppBackground';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBackground />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      <Footer />
    </>
  );
}
