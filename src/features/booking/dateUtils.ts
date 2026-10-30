import { addDays, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

export interface DayOption {
  /** Data in formato yyyy-MM-dd (da passare alla RPC). */
  dateStr: string;
  weekdayLabel: string; // es. "lun"
  dayNum: string; // es. "16"
  monthLabel: string; // es. "giu"
  isToday: boolean;
}

/** Data odierna nel fuso dell'attività, in formato yyyy-MM-dd. */
export function todayInTz(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

/**
 * Genera l'elenco dei giorni prenotabili a partire da oggi (nel fuso attività),
 * limitato da maxAdvanceDays e da un tetto pratico per la UI.
 */
export function buildDayOptions(timezone: string, maxAdvanceDays: number, uiCap = 30): DayOption[] {
  const today = todayInTz(timezone);
  const start = parseISO(today);
  const count = Math.min(maxAdvanceDays, uiCap) + 1;

  return Array.from({ length: count }, (_, i) => {
    const d = addDays(start, i);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      weekdayLabel: format(d, 'EEE', { locale: it }),
      dayNum: format(d, 'd'),
      monthLabel: format(d, 'MMM', { locale: it }),
      isToday: i === 0,
    };
  });
}

/** Orario di uno slot ISO nel fuso attività, es. "09:30". */
export function formatSlotTime(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, 'HH:mm');
}

/** Data+ora leggibile di una prenotazione, es. "lun 16 giugno 2026, 09:30". */
export function formatBookingDateTime(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, "EEE d MMMM yyyy, HH:mm", { locale: it });
}

/** Etichetta giorno estesa, es. "Lunedì 16 giugno". */
export function formatDayLong(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE d MMMM', { locale: it });
}

/** Chiave-data locale (yyyy-MM-dd) di un istante ISO nel fuso attività. */
export function zonedDateKey(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, 'yyyy-MM-dd');
}

/** yyyy-MM-dd da un oggetto Date (calendario locale, senza conversione fuso). */
export function dateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}
