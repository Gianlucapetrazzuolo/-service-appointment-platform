import { cn } from '@/lib/utils';
import type { DayOption } from './dateUtils';

export function DaySelector({
  options,
  selected,
  onSelect,
}: {
  options: DayOption[];
  selected: string | null;
  onSelect: (dateStr: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      {options.map((day) => {
        const isSelected = day.dateStr === selected;
        return (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => onSelect(day.dateStr)}
            aria-pressed={isSelected}
            className={cn(
              'flex min-w-[64px] shrink-0 flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 transition-colors',
              'touch-manipulation active:scale-[0.98]',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span className="text-xs font-medium uppercase opacity-80">{day.weekdayLabel}</span>
            <span className="text-lg font-semibold leading-none">{day.dayNum}</span>
            <span className="text-xs opacity-80">{day.isToday ? 'oggi' : day.monthLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
