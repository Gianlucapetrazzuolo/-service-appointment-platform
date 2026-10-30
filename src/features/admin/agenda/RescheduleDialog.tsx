import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Booking } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useLocations } from '@/features/locations/queries';
import { useStaff } from '@/features/staff/queries';
import { useRescheduleBooking } from '@/features/admin/bookingsAdmin';
import { DaySelector } from '@/features/booking/DaySelector';
import { SlotPicker } from '@/features/booking/SlotPicker';
import {
  buildDayOptions,
  formatBookingDateTime,
  formatDayLong,
  zonedDateKey,
} from '@/features/booking/dateUtils';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export function RescheduleDialog({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const { data: settings } = useSettings();
  const { data: locations } = useLocations();
  const { data: staffList } = useStaff(booking?.location_id ?? null);
  const reschedule = useRescheduleBooking();

  // Fuso della sede dell'appuntamento.
  const timezone =
    locations?.find((l) => l.id === booking?.location_id)?.timezone ??
    settings?.timezone ??
    'Europe/Rome';
  const maxAdvance = settings?.max_advance_days ?? 60;

  const dayOptions = useMemo(() => buildDayOptions(timezone, maxAdvance), [timezone, maxAdvance]);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string>('');

  // Reinizializza all'apertura: data e operatore correnti dell'appuntamento.
  useEffect(() => {
    if (booking) {
      setDate(zonedDateKey(booking.starts_at, timezone));
      setSlot(null);
      setStaffId(booking.staff_id);
      reschedule.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, timezone]);

  function confirm() {
    if (!booking || !slot) return;
    reschedule.mutate(
      { id: booking.id, newStartsAt: slot, newStaffId: staffId || null },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog
      open={!!booking}
      onClose={onClose}
      title="Sposta appuntamento"
      description={booking ? `${booking.service_name} · ${booking.customer_name}` : undefined}
    >
      {booking && (
        <div className="space-y-5">
          <p className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            Attuale: {formatBookingDateTime(booking.starts_at, timezone)} · {booking.staff_name}
          </p>

          {reschedule.isError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {reschedule.error.message}
            </p>
          )}

          <Select
            label="Operatore"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setSlot(null);
            }}
          >
            {(staffList ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </Select>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Nuovo giorno
            </h3>
            <DaySelector options={dayOptions} selected={date} onSelect={(d) => { setDate(d); setSlot(null); }} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Nuovo orario{date && <> · {formatDayLong(date)}</>}
            </h3>
            {date && (
              <SlotPicker
                serviceId={booking.service_id}
                date={date}
                timezone={timezone}
                selectedSlot={slot}
                onSelect={setSlot}
                locationId={booking.location_id}
                staffId={staffId || null}
                excludeBookingId={booking.id}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button onClick={confirm} disabled={!slot} isLoading={reschedule.isPending}>
              Conferma spostamento
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
