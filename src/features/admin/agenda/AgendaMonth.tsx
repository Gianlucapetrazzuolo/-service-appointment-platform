import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { Booking } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { dateKey } from '@/features/booking/dateUtils';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function AgendaMonth({
  cursor,
  byDay,
  todayKey,
  onSelectDate,
}: {
  cursor: Date;
  byDay: Map<string, Booking[]>;
  todayKey: string;
  onSelectDate: (d: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const count = byDay.get(key)?.length ?? 0;
          const inMonth = isSameMonth(day, cursor);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex min-h-[64px] flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-muted sm:min-h-[92px] sm:p-2',
                !inMonth && 'bg-muted/30 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isToday && 'bg-primary font-semibold text-primary-foreground',
                )}
              >
                {day.getDate()}
              </span>
              {count > 0 && (
                <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  {count}
                  <span className="hidden sm:inline">{count === 1 ? 'appunt.' : 'appunt.'}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
