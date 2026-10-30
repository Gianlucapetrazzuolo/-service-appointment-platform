import { useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarCheck, Euro, Users } from 'lucide-react';
import { useAdminStats } from '@/features/stats/queries';
import { BookingsChart } from '@/features/stats/BookingsChart';
import { LocationSelect } from '@/features/locations/LocationSelect';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

export function AdminStatsPage() {
  const [locationId, setLocationId] = useState<string | null>(null); // null = tutte
  const { data, isLoading, isError } = useAdminStats(locationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-lg font-semibold">Statistiche</h2>
        <LocationSelect value={locationId} onChange={setLocationId} allowAll className="sm:w-56" />
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : isError || !data ? (
        <ErrorState title="Impossibile caricare le statistiche" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-5 w-5" aria-hidden />}
              label="Clienti iscritti"
              value={data.total_clients.toString()}
              hint="Totale (tutte le sedi)"
            />
            <StatCard
              icon={<Euro className="h-5 w-5" aria-hidden />}
              label="Fatturato stimato"
              value={formatPrice(data.revenue_cents)}
              hint="Prenotazioni confermate e completate"
            />
            <StatCard
              icon={<CalendarCheck className="h-5 w-5" aria-hidden />}
              label="Prenotazioni"
              value={data.total_bookings.toString()}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Andamento ultimi 12 mesi</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingsChart byMonth={data.by_month} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-semibold">{value}</p>
          </div>
        </div>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
