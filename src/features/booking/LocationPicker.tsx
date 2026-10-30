import { MapPin } from 'lucide-react';
import { useLocations } from '@/features/locations/queries';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';

export function LocationPicker({ onSelect }: { onSelect: (locationId: string) => void }) {
  const { data, isLoading, isError } = useLocations();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Carico le sedi…
      </div>
    );
  }
  if (isError) return <ErrorState title="Impossibile caricare le sedi" />;
  if (!data || data.length === 0) {
    return <EmptyState title="Nessuna sede disponibile" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data.map((location) => (
        <button
          key={location.id}
          type="button"
          onClick={() => onSelect(location.id)}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted touch-manipulation active:scale-[0.99]"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{location.name}</span>
            {location.address && (
              <span className="block truncate text-sm text-muted-foreground">{location.address}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
