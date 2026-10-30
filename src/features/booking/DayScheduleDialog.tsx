import { useEffect, useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import type { DayScheduleRow } from '@/types/database.types';
import { useDaySchedule } from './queries';
import { formatDayLong, formatSlotTime } from './dateUtils';
import { Dialog } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

interface Fascia {
  is_free: boolean;
  starts_at: string;
  ends_at: string;
}
interface OperatorAgenda {
  staffId: string;
  staffName: string;
  fasce: Fascia[];
}

function group(rows: DayScheduleRow[]): OperatorAgenda[] {
  const map = new Map<string, OperatorAgenda>();
  for (const r of rows) {
    let op = map.get(r.staff_id);
    if (!op) {
      op = { staffId: r.staff_id, staffName: r.staff_name, fasce: [] };
      map.set(r.staff_id, op);
    }
    op.fasce.push({ is_free: r.is_free, starts_at: r.starts_at, ends_at: r.ends_at });
  }
  for (const op of map.values()) op.fasce.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return Array.from(map.values());
}

const colsClass = (n: number) =>
  n <= 1 ? 'lg:grid-cols-1' : n === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

export function DayScheduleDialog({
  open,
  onClose,
  serviceId,
  locationId,
  date,
  timezone,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  locationId: string;
  date: string;
  timezone: string;
  onSelect: (staffId: string, iso: string) => void;
}) {
  const { data, isLoading, isError } = useDaySchedule(serviceId, locationId, open ? date : null);
  const operators = useMemo(() => group(data ?? []), [data]);

  const [tab, setTab] = useState(0);
  useEffect(() => setTab(0), [date, open]);
  const activeTab = Math.min(tab, Math.max(operators.length - 1, 0));

  return (
    <Dialog open={open} onClose={onClose} title={formatDayLong(date)} description="Scegli operatore e orario" className="sm:max-w-2xl">
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Carico le disponibilità…
        </div>
      ) : isError ? (
        <ErrorState title="Impossibile caricare le disponibilità" className="py-8" />
      ) : operators.length === 0 ? (
        <EmptyState
          title="Nessun operatore disponibile"
          description="Per questa data non ci sono operatori. Prova un altro giorno."
          className="py-8"
        />
      ) : (
        <>
          {/* Desktop: operatori affiancati */}
          <div className={cn('hidden gap-4 lg:grid', colsClass(operators.length))}>
            {operators.map((op) => (
              <OperatorBlock key={op.staffId} op={op} timezone={timezone} onSelect={onSelect} />
            ))}
          </div>

          {/* Mobile: tab per operatore */}
          <div className="lg:hidden">
            {operators.length > 1 && (
              <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
                {operators.map((op, i) => (
                  <button
                    key={op.staffId}
                    type="button"
                    onClick={() => setTab(i)}
                    className={cn(
                      'flex-1 truncate rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                      i === activeTab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    {op.staffName}
                  </button>
                ))}
              </div>
            )}
            {operators[activeTab] && (
              <OperatorBlock
                op={operators[activeTab]}
                timezone={timezone}
                onSelect={onSelect}
                hideName={operators.length > 1}
              />
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}

function OperatorBlock({
  op,
  timezone,
  onSelect,
  hideName,
}: {
  op: OperatorAgenda;
  timezone: string;
  onSelect: (staffId: string, iso: string) => void;
  hideName?: boolean;
}) {
  const free = op.fasce.filter((f) => f.is_free);
  const busy = op.fasce.filter((f) => !f.is_free);

  return (
    <div className="rounded-lg border border-border p-3">
      {!hideName && (
        <div className="mb-2.5 flex items-center gap-2 font-medium">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <span className="truncate">{op.staffName}</span>
        </div>
      )}

      {free.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Nessun orario libero</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {free.map((f) => (
            <button
              key={f.starts_at}
              type="button"
              onClick={() => onSelect(op.staffId, f.starts_at)}
              className="rounded-md border border-success/30 bg-success/10 px-2 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20 active:scale-[0.97] touch-manipulation"
            >
              {formatSlotTime(f.starts_at, timezone)}
            </button>
          ))}
        </div>
      )}

      {busy.length > 0 && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          <span className="font-medium">Occupato:</span>{' '}
          {busy
            .map((f) => `${formatSlotTime(f.starts_at, timezone)}–${formatSlotTime(f.ends_at, timezone)}`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}
