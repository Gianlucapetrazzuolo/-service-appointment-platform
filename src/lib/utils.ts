import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina classi condizionali risolvendo i conflitti Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatta un prezzo memorizzato in centesimi (es. 2500 -> "25,00 €"). */
export function formatPrice(cents: number, currency = 'EUR', locale = 'it-IT'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/** Formatta una durata in minuti in forma leggibile (es. 90 -> "1h 30min"). */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
