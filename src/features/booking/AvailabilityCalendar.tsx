import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthAvailability } from './queries';
import { dateKey, todayInTz } from './dateUtils';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function AvailabilityCalendar({
  serviceId,
  locationId,
  timezone,
  maxAdvanceDays,
  selectedDate,
  onSelectDate,
}: {
  serviceId: string;
  locationId: string;
  timezone: string;
  maxAdvanceDays: number;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}) {
  const today = useMemo(() => parseISO(todayInTz(timezone)), [timezone]);
  const maxDate = useMemo(() => addDays(today, maxAdvanceDays), [today, maxAdvanceDays]);
  const todayKey = dateKey(today);

  const [cursor, setCursor] = useState<Date>(() =>
    startOfMonth(selectedDate ? parseISO(selectedDate) : today),
  );

  const { data: available, isLoading, isFetching } = useMonthAvailability(
    serviceId,
    locationId,
    cursor.getFullYear(),
    cursor.getMonth() + 1,
  );

  // Solo i giorni del mese corrente; celle vuote (null) prima e dopo per
  // allineare la griglia senza mostrare i giorni dei mesi adiacenti.
  const cells = useMemo<(Date | null)[]>(() => {
    const monthStart = startOfMonth(cursor);
    const monthDays = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
    const leading = (monthStart.getDay() + 6) % 7; // 0 = Lunedì
    const trailing = (7 - ((leading + monthDays.length) % 7)) % 7;
    return [
      ...Array.from({ length: leading }, () => null),
      ...monthDays,
      ...Array.from({ length: trailing }, () => null),
    ];
  }, [cursor]);

  const canPrev = startOfMonth(cursor) > startOfMonth(today);
  const canNext = startOfMonth(cursor) < startOfMonth(maxDate);

  const noAvailability = !isLoading && available && available.size === 0;

  return (
    <Card className="overflow-hidden">
      {/* Header navigazione mese */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <button
          type="button"
          aria-label="Mese precedente"
          disabled={!canPrev}
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="font-display text-base font-semibold capitalize">
          {format(cursor, 'MMMM yyyy', { locale: it })}
        </span>
        <button
          type="button"
          aria-label="Mese successivo"
          disabled={!canNext}
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Intestazione giorni */}
      <div className="grid grid-cols-7 bg-muted/40">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      {/* Griglia */}
      <div className="relative">
        <div className={cn('grid grid-cols-7', isFetching && 'opacity-50')}>
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`blank-${i}`} className="aspect-square border-b border-r border-border" aria-hidden />;
            }
            const key = dateKey(day);
            const isAvail = available?.has(key) ?? false;
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const beyond = isAfter(day, maxDate);

            return (
              <button
                key={key}
                type="button"
                disabled={!isAvail}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(key)}
                className={cn(
                  'relative flex aspect-square items-center justify-center border-b border-r border-border text-sm transition-colors',
                  isAvail
                    ? 'cursor-pointer font-medium hover:bg-success/10'
                    : 'cursor-not-allowed text-muted-foreground/40',
                  beyond && 'text-muted-foreground/30',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isToday && !isSelected && 'ring-1 ring-primary/50',
                  )}
                >
                  {day.getDate()}
                </span>
                {isAvail && !isSelected && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>

      {noAvailability && (
        <p className="px-4 py-4 text-center text-sm text-muted-foreground">
          Nessuna disponibilità in questo mese.{' '}
          {canNext && <span className="font-medium text-foreground">Prova il mese successivo.</span>}
        </p>
      )}
    </Card>
  );
}
