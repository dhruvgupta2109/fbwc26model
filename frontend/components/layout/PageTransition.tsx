export function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`page-transition grid gap-8 ${className}`}>{children}</div>;
}
