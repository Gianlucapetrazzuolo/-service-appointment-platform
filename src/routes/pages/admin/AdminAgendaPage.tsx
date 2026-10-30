import { useMemo, useState } from 'react';
import { addDays, addMonths, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Booking } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useAdminLocations } from '@/features/admin/locationsAdmin';
import { useStaff } from '@/features/staff/queries';
import { LocationSelect } from '@/features/locations/LocationSelect';
import { useAdminBookings } from '@/features/admin/bookingsAdmin';
import { useCancelBooking } from '@/features/booking/queries';
import { dateKey, formatDayLong, todayInTz, zonedDateKey } from '@/features/booking/dateUtils';
import { AgendaToolbar, type AgendaView } from '@/features/admin/agenda/AgendaToolbar';
import { AgendaDay } from '@/features/admin/agenda/AgendaDay';
import { AgendaWeek } from '@/features/admin/agenda/AgendaWeek';
import { AgendaMonth } from '@/features/admin/agenda/AgendaMonth';
import { RescheduleDialog } from '@/features/admin/agenda/RescheduleDialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';

export function AdminAgendaPage() {
  const { data: settings } = useSettings();
  const { data: locations, isLoading: locLoading } = useAdminLocations();
  const { data: bookings, isLoading, isError } = useAdminBookings();
  const cancelBooking = useCancelBooking();

  const [picked, setPicked] = useState<string | null>(null);
  const locationId = picked ?? locations?.[0]?.id ?? null;
  const { data: staffList } = useStaff(locationId);
  const [staffFilter, setStaffFilter] = useState<string | null>(null); // null = tutti

  const timezone =
    locations?.find((l) => l.id === locationId)?.timezone ?? settings?.timezone ?? 'Europe/Rome';

  const [view, setView] = useState<AgendaView>('day');
  const [cursor, setCursor] = useState<Date>(() => parseISO(todayInTz('Europe/Rome')));
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [toReschedule, setToReschedule] = useState<Booking | null>(null);

  const todayKey = dateKey(parseISO(todayInTz(timezone)));

  // Prenotazioni della sede (e operatore) selezionati, raggruppate per giorno.
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings ?? []) {
      if (b.status === 'cancelled') continue;
      if (locationId && b.location_id !== locationId) continue;
      if (staffFilter && b.staff_id !== staffFilter) continue;
      const key = zonedDateKey(b.starts_at, timezone);
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return map;
  }, [bookings, locationId, staffFilter, timezone]);

  const dayBookings = byDay.get(dateKey(cursor)) ?? [];

  function selectDate(d: Date) {
    setCursor(d);
    setView('day');
  }
  function navigate(dir: -1 | 1) {
    setCursor((c) =>
      view === 'day' ? addDays(c, dir) : view === 'week' ? addDays(c, dir * 7) : addMonths(c, dir),
    );
  }
  const goToday = () => setCursor(parseISO(todayInTz(timezone)));

  const title = useMemo(() => {
    if (view === 'day') return formatDayLong(dateKey(cursor));
    if (view === 'week') {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      const e = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(s, 'd', { locale: it })}–${format(e, 'd MMM', { locale: it })}`;
    }
    return format(cursor, 'MMMM yyyy', { locale: it });
  }, [view, cursor]);

  if (isLoading || locLoading) return <FullPageSpinner />;
  if (!locations || locations.length === 0) {
    return <EmptyState title="Nessuna sede" description="Crea una sede per usare l'agenda." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-lg font-semibold">Agenda</h2>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <LocationSelect
            value={locationId}
            onChange={(id) => {
              setPicked(id);
              setStaffFilter(null);
            }}
            className="sm:w-44"
          />
          <Select
            value={staffFilter ?? ''}
            onChange={(e) => setStaffFilter(e.target.value || null)}
            className="sm:w-44"
          >
            <option value="">Tutti gli operatori</option>
            {(staffList ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <AgendaToolbar
        view={view}
        onViewChange={setView}
        title={title}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
      />

      {isError ? (
        <ErrorState title="Impossibile caricare l'agenda" />
      ) : view === 'day' ? (
        <AgendaDay
          bookings={dayBookings}
          timezone={timezone}
          onReschedule={setToReschedule}
          onCancel={setToCancel}
        />
      ) : view === 'week' ? (
        <AgendaWeek
          cursor={cursor}
          byDay={byDay}
          todayKey={todayKey}
          timezone={timezone}
          onSelectDate={selectDate}
        />
      ) : (
        <AgendaMonth cursor={cursor} byDay={byDay} todayKey={todayKey} onSelectDate={selectDate} />
      )}

      {/* Spostamento appuntamento */}
      <RescheduleDialog booking={toReschedule} onClose={() => setToReschedule(null)} />

      {/* Conferma cancellazione */}
      <Dialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title="Cancellare l'appuntamento?"
        description={
          toCancel
            ? `${toCancel.service_name} · ${toCancel.customer_name}. Il cliente riceverà un'email di avviso.`
            : undefined
        }
      >
        {cancelBooking.isError && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {cancelBooking.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToCancel(null)}>
            Indietro
          </Button>
          <Button
            variant="destructive"
            isLoading={cancelBooking.isPending}
            onClick={() => {
              if (!toCancel) return;
              cancelBooking.mutate(toCancel.id, { onSuccess: () => setToCancel(null) });
            }}
          >
            Cancella appuntamento
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
