import type { BookingStatus } from '@/types/domain';

export type StatusTone = 'success' | 'muted' | 'warning' | 'default';

/** Etichetta e tono (Badge) per ogni stato prenotazione. */
export const STATUS_META: Record<BookingStatus, { label: string; tone: StatusTone }> = {
  confirmed: { label: 'Confermata', tone: 'success' },
  cancelled: { label: 'Annullata', tone: 'muted' },
  completed: { label: 'Completata', tone: 'default' },
  no_show: { label: 'Non presentato', tone: 'warning' },
};
