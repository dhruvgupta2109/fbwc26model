import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:pointer-events-none disabled:opacity-55',
        variant === 'primary' && 'bg-primary text-white hover:opacity-90',
        variant === 'ghost' && 'border border-line bg-transparent text-ink hover:bg-primary/10',
        variant === 'soft' && 'bg-primary/10 text-primary hover:bg-primary/15',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        className
      )}
      {...props}
    />
  );
}
