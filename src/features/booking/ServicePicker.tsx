import { Clock } from 'lucide-react';
import { useServices } from '@/features/services/queries';
import { formatDuration, formatPrice } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';

export function ServicePicker({ onSelect }: { onSelect: (serviceId: string) => void }) {
  const { data, isLoading, isError } = useServices();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Carico i servizi…
      </div>
    );
  }
  if (isError) return <ErrorState title="Impossibile caricare i servizi" />;
  if (!data || data.length === 0) {
    return <EmptyState title="Nessun servizio disponibile" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onSelect(service.id)}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted touch-manipulation active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{service.name}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatDuration(service.duration_min)}
            </span>
          </div>
          {service.description && (
            <span className="line-clamp-2 text-sm text-muted-foreground">{service.description}</span>
          )}
          <span className="mt-1 font-semibold">
            {service.price_cents > 0 ? formatPrice(service.price_cents) : 'Su richiesta'}
          </span>
        </button>
      ))}
    </div>
  );
}
