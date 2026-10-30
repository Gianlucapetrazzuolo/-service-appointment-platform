import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, MapPin, UserRound } from 'lucide-react';
import type { Booking } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useLocations } from '@/features/locations/queries';
import { useCancelBooking, useMyBookings } from '@/features/booking/queries';
import { formatBookingDateTime, formatSlotTime } from '@/features/booking/dateUtils';
import { STATUS_META } from '@/features/booking/status';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';

export function MyBookingsPage() {
  const { data: settings } = useSettings();
  const fallbackTz = settings?.timezone ?? 'Europe/Rome';
  const { data: locations } = useLocations();
  const { data: bookings, isLoading, isError } = useMyBookings();

  const tzFor = (locationId: string) =>
    locations?.find((l) => l.id === locationId)?.timezone ?? fallbackTz;

  if (isLoading) return <FullPageSpinner />;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Le mie prenotazioni
        </h1>

        {isError ? (
          <ErrorState title="Impossibile caricare le prenotazioni" />
        ) : !bookings || bookings.length === 0 ? (
          <EmptyState
            title="Nessuna prenotazione"
            description="Non hai ancora prenotazioni. Prenota il tuo primo appuntamento!"
            action={
              <Link to="/prenota" className={buttonClasses({})}>
                Prenota ora
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingRow booking={booking} timezone={tzFor(booking.location_id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

function BookingRow({ booking, timezone }: { booking: Booking; timezone: string }) {
  const cancelBooking = useCancelBooking();
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[booking.status];
  const isUpcoming = new Date(booking.starts_at).getTime() > Date.now();
  const canCancel = booking.status === 'confirmed' && isUpcoming;

  function handleCancel() {
    setError(null);
    cancelBooking.mutate(booking.id, {
      onError: (e) => setError(e.message),
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{booking.service_name}</p>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            {formatBookingDateTime(booking.starts_at, timezone)}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            Fino alle {formatSlotTime(booking.ends_at, timezone)}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {booking.location_name}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              {booking.staff_name}
            </span>
          </p>
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            isLoading={cancelBooking.isPending}
            className="shrink-0 self-start sm:self-auto"
          >
            Annulla
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
