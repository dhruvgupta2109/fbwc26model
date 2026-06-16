import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}

export function Badge({ className, tone = 'muted', ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone === 'primary' && 'border-primary/30 bg-primary/10 text-primary',
        tone === 'success' && 'border-success/30 bg-success/10 text-success',
        tone === 'warning' && 'border-accent/40 bg-accent/10 text-accent',
        tone === 'danger' && 'border-danger/30 bg-danger/10 text-danger',
        tone === 'muted' && 'border-line bg-canvas text-muted',
        className
      )}
      {...props}
    />
  );
}
