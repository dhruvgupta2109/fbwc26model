import { clsx } from 'clsx';

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('h-2 overflow-hidden rounded-full bg-canvas', className)}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
