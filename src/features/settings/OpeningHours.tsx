import { useBusinessHours } from './queries';
import { useLocations } from '@/features/locations/queries';
import { WEEKDAY_LABELS } from '@/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

/** "09:00:00" -> "09:00" */
function hhmm(time: string): string {
  return time.slice(0, 5);
}

// Ordine di visualizzazione: Lun..Sab, Dom in fondo (convenzione IT).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * Orari di una sede. Se `locationId` non è passato, usa la prima sede attiva
 * (mostrandone il nome nel titolo quando ci sono più sedi).
 */
export function OpeningHours({ locationId }: { locationId?: string }) {
  const { data: locations } = useLocations();
  const resolvedId = locationId ?? locations?.[0]?.id ?? null;
  const locationName =
    locations && locations.length > 1
      ? locations.find((l) => l.id === resolvedId)?.name
      : undefined;
  const { data, isLoading } = useBusinessHours(resolvedId);

  if (isLoading || !resolvedId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orari di apertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 w-full animate-pulse rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const byDay = new Map<number, string[]>();
  for (const h of data ?? []) {
    const ranges = byDay.get(h.weekday) ?? [];
    ranges.push(`${hhmm(h.open_time)}–${hhmm(h.close_time)}`);
    byDay.set(h.weekday, ranges);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orari di apertura{locationName ? ` · ${locationName}` : ''}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {DISPLAY_ORDER.map((weekday) => {
            const ranges = byDay.get(weekday);
            return (
              <div key={weekday} className="flex items-center justify-between py-2 text-sm">
                <dt className="font-medium">{WEEKDAY_LABELS[weekday]}</dt>
                <dd className={ranges ? 'text-foreground' : 'text-muted-foreground'}>
                  {ranges ? ranges.join(' · ') : 'Chiuso'}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
