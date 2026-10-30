import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Booking } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { dateKey, formatSlotTime } from '@/features/booking/dateUtils';
import { cn } from '@/lib/utils';

export function AgendaWeek({
  cursor,
  byDay,
  todayKey,
  timezone,
  onSelectDate,
}: {
  cursor: Date;
  byDay: Map<string, Booking[]>;
  todayKey: string;
  timezone: string;
  onSelectDate: (d: Date) => void;
}) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  const end = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <>
      {/* Desktop: 7 colonne */}
      <Card className="hidden overflow-hidden lg:block">
        <div className="grid grid-cols-7 divide-x divide-border">
          {days.map((day) => {
            const key = dateKey(day);
            const list = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex min-h-[260px] flex-col">
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    'border-b border-border px-2 py-2 text-center transition-colors hover:bg-muted',
                    isToday && 'bg-primary/10',
                  )}
                >
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className={cn('font-display text-lg font-semibold', isToday && 'text-primary')}>
                    {day.getDate()}
                  </p>
                </button>
                <div className="flex-1 space-y-1.5 p-1.5">
                  {list.length === 0 ? (
                    <p className="pt-2 text-center text-xs text-muted-foreground/60">—</p>
                  ) : (
                    list.map((b) => (
                      <WeekChip key={b.id} booking={b} timezone={timezone} onClick={() => onSelectDate(day)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Mobile: elenco per giorno */}
      <div className="space-y-3 lg:hidden">
        {days.map((day) => {
          const key = dateKey(day);
          const list = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <Card key={key}>
              <button
                type="button"
                onClick={() => onSelectDate(day)}
                className="flex w-full items-center justify-between border-b border-border px-4 py-2 text-left"
              >
                <span className={cn('text-sm font-semibold capitalize', isToday && 'text-primary')}>
                  {format(day, 'EEEE d', { locale: it })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {list.length === 0 ? 'libero' : `${list.length} appunt.`}
                </span>
              </button>
              {list.length > 0 && (
                <div className="space-y-1.5 p-2">
                  {list.map((b) => (
                    <WeekChip key={b.id} booking={b} timezone={timezone} onClick={() => onSelectDate(day)} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function WeekChip({
  booking,
  timezone,
  onClick,
}: {
  booking: Booking;
  timezone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md border border-border bg-card px-2 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-muted"
    >
      <span className="font-semibold text-primary">{formatSlotTime(booking.starts_at, timezone)}</span>{' '}
      <span className="font-medium">{booking.service_name}</span>
      <span className="block truncate text-muted-foreground">{booking.customer_name}</span>
    </button>
  );
}
