import { clsx } from 'clsx';

export function ProgressBar({ value, className, tone = 'primary' }: { value: number; className?: string; tone?: 'primary' | 'success' }) {
  return (
    <div className={clsx('h-2 overflow-hidden rounded-full bg-canvas', className)}>
      <div
        className={clsx('h-full rounded-full transition-[width,background-color] duration-500 ease-out', tone === 'success' ? 'bg-success' : 'bg-primary')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
