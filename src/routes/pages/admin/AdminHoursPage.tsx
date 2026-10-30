import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { BusinessHour, Location } from '@/types/domain';
import { WEEKDAY_LABELS } from '@/types/domain';
import { formatBookingDateTime } from '@/features/booking/dateUtils';
import { useAdminLocations } from '@/features/admin/locationsAdmin';
import { LocationSelect } from '@/features/locations/LocationSelect';
import {
  useAdminClosures,
  useAdminHours,
  useCreateClosure,
  useCreateHour,
  useDeleteClosure,
  useDeleteHour,
  useUpdateHour,
} from '@/features/admin/hoursAdmin';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner, Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const hhmm = (t: string) => t.slice(0, 5);
const timeInput =
  'h-10 rounded-md border border-input bg-card px-2 text-base text-foreground focus-visible:border-ring';

export function AdminHoursPage() {
  const { data: locations, isLoading: locLoading } = useAdminLocations();
  const [picked, setPicked] = useState<string | null>(null);
  const locationId = picked ?? locations?.[0]?.id ?? null;

  const { data: hours, isFetching } = useAdminHours(locationId);

  if (locLoading) return <FullPageSpinner />;
  if (!locations || locations.length === 0) {
    return (
      <EmptyState
        title="Nessuna sede"
        description="Crea prima una sede in Gestione → Sedi per impostarne gli orari."
      />
    );
  }

  const byDay = new Map<number, BusinessHour[]>();
  for (const h of hours ?? []) {
    const arr = byDay.get(h.weekday) ?? [];
    arr.push(h);
    byDay.set(h.weekday, arr);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Orari di apertura</h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              Orari per sede. Per la pausa pranzo imposta <strong>due fasce</strong> nello stesso
              giorno (es. 9:00–13:00 e 16:00–20:00): l'intervallo centrale diventa non prenotabile.
            </p>
          </div>
          <LocationSelect value={locationId} onChange={setPicked} className="sm:w-56" />
        </div>

        <div className={cn('space-y-3', isFetching && 'opacity-60')}>
          {DISPLAY_ORDER.map((weekday) => (
            <DayHoursCard
              key={weekday}
              weekday={weekday}
              ranges={byDay.get(weekday) ?? []}
              locationId={locationId}
            />
          ))}
        </div>
      </section>

      <ClosuresSection locations={locations} defaultLocationId={locationId} />
    </div>
  );
}

function DayHoursCard({
  weekday,
  ranges,
  locationId,
}: {
  weekday: number;
  ranges: BusinessHour[];
  locationId: string | null;
}) {
  const createHour = useCreateHour();

  function addRange() {
    if (!locationId) return;
    const def = ranges.length === 0 ? ['09:00', '13:00'] : ['15:00', '19:00'];
    createHour.mutate({ weekday, open_time: def[0]!, close_time: def[1]!, location_id: locationId });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-medium">{WEEKDAY_LABELS[weekday]}</span>
          <Button size="sm" variant="outline" onClick={addRange} isLoading={createHour.isPending}>
            <Plus className="h-4 w-4" aria-hidden />
            Aggiungi fascia
          </Button>
        </div>
        {ranges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chiuso</p>
        ) : (
          <div className="space-y-2">
            {ranges.map((r) => (
              <HourRangeRow key={r.id} hour={r} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HourRangeRow({ hour }: { hour: BusinessHour }) {
  const update = useUpdateHour();
  const del = useDeleteHour();
  const [open, setOpen] = useState(hhmm(hour.open_time));
  const [close, setClose] = useState(hhmm(hour.close_time));
  const [err, setErr] = useState<string | null>(null);

  function commit() {
    if (open >= close) {
      setErr('La chiusura deve essere dopo l’apertura.');
      return;
    }
    setErr(null);
    if (open !== hhmm(hour.open_time) || close !== hhmm(hour.close_time)) {
      update.mutate({ id: hour.id, open_time: open, close_time: close });
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="time"
          aria-label="Apertura"
          value={open}
          onChange={(e) => setOpen(e.target.value)}
          onBlur={commit}
          className={cn(timeInput, err && 'border-destructive')}
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="time"
          aria-label="Chiusura"
          value={close}
          onChange={(e) => setClose(e.target.value)}
          onBlur={commit}
          className={cn(timeInput, err && 'border-destructive')}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Elimina fascia"
          onClick={() => del.mutate(hour.id)}
          disabled={del.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
        </Button>
      </div>
      {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
    </div>
  );
}

function ClosuresSection({
  locations,
  defaultLocationId,
}: {
  locations: Location[];
  defaultLocationId: string | null;
}) {
  const { data: closures, isLoading } = useAdminClosures();
  const deleteClosure = useDeleteClosure();
  const [addOpen, setAddOpen] = useState(false);

  const locMap = useMemo(() => {
    const m = new Map<string, Location>();
    for (const l of locations) m.set(l.id, l);
    return m;
  }, [locations]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Chiusure straordinarie</h2>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !closures || closures.length === 0 ? (
        <EmptyState title="Nessuna chiusura programmata" description="Ferie e festivi appariranno qui." />
      ) : (
        <ul className="space-y-2">
          {closures.map((c) => {
            const loc = c.location_id ? locMap.get(c.location_id) : null;
            const tz = loc?.timezone ?? 'Europe/Rome';
            return (
              <li key={c.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-3 pl-4">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">
                        {c.reason ?? 'Chiusura'}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {loc ? loc.name : 'Tutte le sedi'}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {formatBookingDateTime(c.starts_at, tz)} → {formatBookingDateTime(c.ends_at, tz)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Elimina chiusura"
                      onClick={() => deleteClosure.mutate(c.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AddClosureDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        locations={locations}
        defaultLocationId={defaultLocationId}
      />
    </section>
  );
}

interface ClosureFormValues {
  starts_at: string;
  ends_at: string;
  reason: string;
  location_id: string; // '' = tutte le sedi
}

function AddClosureDialog({
  open,
  onClose,
  locations,
  defaultLocationId,
}: {
  open: boolean;
  onClose: () => void;
  locations: Location[];
  defaultLocationId: string | null;
}) {
  const createClosure = useCreateClosure();
  const { register, handleSubmit, reset, setError, formState } = useForm<ClosureFormValues>({
    defaultValues: { location_id: defaultLocationId ?? '' },
  });

  function onSubmit(values: ClosureFormValues) {
    if (!values.starts_at || !values.ends_at || values.starts_at >= values.ends_at) {
      setError('ends_at', { message: 'La fine deve essere dopo l’inizio.' });
      return;
    }
    createClosure.mutate(
      {
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: new Date(values.ends_at).toISOString(),
        reason: values.reason?.trim() ? values.reason.trim() : null,
        location_id: values.location_id || null,
      },
      {
        onSuccess: () => {
          reset({ location_id: defaultLocationId ?? '' });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Aggiungi chiusura">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {createClosure.isError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {createClosure.error.message}
          </p>
        )}
        <Select label="Sede" {...register('location_id')}>
          <option value="">Tutte le sedi</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Input label="Inizio" type="datetime-local" required {...register('starts_at')} />
        <Input
          label="Fine"
          type="datetime-local"
          required
          error={formState.errors.ends_at?.message}
          {...register('ends_at')}
        />
        <Input label="Motivo (facoltativo)" placeholder="Es. Ferie estive" {...register('reason')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" isLoading={createClosure.isPending}>
            Aggiungi
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
