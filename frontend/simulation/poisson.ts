export function poisson(lambda: number): number {
  const clamped = Math.max(0.05, Math.min(4.5, lambda));
  const limit = Math.exp(-clamped);
  let product = 1;
  let count = 0;

  do {
    count += 1;
    product *= Math.random();
  } while (product > limit);

  return count - 1;
}
