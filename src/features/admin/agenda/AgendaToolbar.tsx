import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type AgendaView = 'day' | 'week' | 'month';

const VIEWS: { key: AgendaView; label: string }[] = [
  { key: 'day', label: 'Giorno' },
  { key: 'week', label: 'Settimana' },
  { key: 'month', label: 'Mese' },
];

export function AgendaToolbar({
  view,
  onViewChange,
  title,
  onPrev,
  onNext,
  onToday,
}: {
  view: AgendaView;
  onViewChange: (v: AgendaView) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Switch viste */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onViewChange(v.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none',
              view === v.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Navigazione */}
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button variant="outline" size="sm" onClick={onToday}>
          Oggi
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Periodo precedente" onClick={onPrev}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <span className="min-w-[8rem] text-center text-sm font-medium capitalize sm:min-w-[12rem]">
            {title}
          </span>
          <Button variant="ghost" size="icon" aria-label="Periodo successivo" onClick={onNext}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
