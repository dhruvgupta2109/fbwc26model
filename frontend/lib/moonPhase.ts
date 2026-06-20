export type MoonPhase = 'new' | 'waxing' | 'full' | 'waning';

export function getMoonPhase(dateInput: string | Date): MoonPhase {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNewMoon) / 86_400_000;
  const age = ((days % synodicMonth) + synodicMonth) % synodicMonth;

  if (age < 2 || age > 27.5) return 'new';
  if (age > 13.4 && age < 16.2) return 'full';
  if (age < 14.8) return 'waxing';
  return 'waning';
}
