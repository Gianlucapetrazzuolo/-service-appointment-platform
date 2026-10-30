import { useMemo } from 'react';
import { useServices } from './queries';
import { ServiceCard } from './ServiceCard';
import { PackageCard } from './PackageCard';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/States';

function ServiceSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Griglia responsive di servizi o pacchetti, con stati di
 * caricamento/errore/vuoto. `limit` mostra solo i primi N (anteprima home).
 */
export function ServiceList({
  limit,
  kind = 'services',
  hideIfEmpty = false,
}: {
  limit?: number;
  kind?: 'services' | 'packages';
  hideIfEmpty?: boolean;
}) {
  const { data, isLoading, isError } = useServices();

  const items = useMemo(() => {
    const list = (data ?? []).filter((s) => (kind === 'packages' ? s.is_package : !s.is_package));
    return limit ? list.slice(0, limit) : list;
  }, [data, kind, limit]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <ServiceSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState title="Impossibile caricare i contenuti" />;

  if (items.length === 0) {
    if (hideIfEmpty) return null;
    return (
      <EmptyState
        title={kind === 'packages' ? 'Nessun pacchetto disponibile' : 'Nessun servizio disponibile'}
        description="Appariranno qui non appena verranno aggiunti dal pannello admin."
      />
    );
  }

  if (kind === 'packages') {
    return (
      <div className="space-y-4">
        {items.map((service) => (
          <PackageCard key={service.id} service={service} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
