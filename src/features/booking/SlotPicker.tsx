import { cn } from '@/lib/utils';
import { useAvailableSlots } from './queries';
import { formatSlotTime } from './dateUtils';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';

export function SlotPicker({
  serviceId,
  date,
  timezone,
  selectedSlot,
  onSelect,
  locationId,
  staffId,
  excludeBookingId,
}: {
  serviceId: string;
  date: string;
  timezone: string;
  selectedSlot: string | null;
  onSelect: (iso: string) => void;
  locationId?: string | null;
  staffId?: string | null;
  excludeBookingId?: string;
}) {
  const { data: slots, isLoading, isError, isFetching } = useAvailableSlots(serviceId, date, {
    locationId,
    staffId,
    excludeBookingId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Carico gli orari disponibili…
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Impossibile caricare gli orari" className="py-8" />;
  }

  if (!slots || slots.length === 0) {
    return (
      <EmptyState
        title="Nessuno slot disponibile"
        description="Per questo giorno non ci sono orari liberi. Prova a scegliere un altro giorno."
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5',
          isFetching && 'opacity-60',
        )}
      >
        {slots.map((iso) => {
          const isSelected = iso === selectedSlot;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              className={cn(
                'rounded-md border py-2.5 text-sm font-medium transition-colors',
                'touch-manipulation active:scale-[0.98]',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted',
              )}
            >
              {formatSlotTime(iso, timezone)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
