import { useMemo, useState } from 'react';
import { CalendarClock, Mail, MapPin, Phone, StickyNote, UserRound } from 'lucide-react';
import type { Booking } from '@/types/domain';
import { useSettings } from '@/features/settings/queries';
import { useAdminBookings, useUpdateBookingStatus } from '@/features/admin/bookingsAdmin';
import { formatBookingDateTime, formatSlotTime } from '@/features/booking/dateUtils';
import { STATUS_META } from '@/features/booking/status';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

type Tab = 'upcoming' | 'past' | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Prossime' },
  { key: 'past', label: 'Passate' },
  { key: 'all', label: 'Tutte' },
];

export function AdminBookingsPage() {
  const { data: bookings, isLoading, isError } = useAdminBookings();
  const { data: settings } = useSettings();
  const timezone = settings?.timezone ?? 'Europe/Rome';
  const [tab, setTab] = useState<Tab>('upcoming');

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const now = Date.now();
    if (tab === 'all') return bookings;
    return bookings.filter((b) => {
      const isFuture = new Date(b.starts_at).getTime() >= now;
      return tab === 'upcoming' ? isFuture : !isFuture;
    });
  }, [bookings, tab]);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Prenotazioni</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare le prenotazioni" />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nessuna prenotazione" description="Qui vedrai gli appuntamenti dei clienti." />
      ) : (
        <ul className="space-y-3">
          {filtered.map((booking) => (
            <li key={booking.id}>
              <AdminBookingRow booking={booking} timezone={timezone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminBookingRow({ booking, timezone }: { booking: Booking; timezone: string }) {
  const updateStatus = useUpdateBookingStatus();
  const meta = STATUS_META[booking.status];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{booking.service_name}</p>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
              {formatBookingDateTime(booking.starts_at, timezone)} –{' '}
              {formatSlotTime(booking.ends_at, timezone)}
            </p>
          </div>
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {booking.location_name}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {booking.staff_name}
          </span>
        </p>

        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="truncate">
            <span className="font-medium text-foreground">{booking.customer_name}</span>
          </p>
          <p className="flex items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <a href={`mailto:${booking.customer_email}`} className="truncate hover:underline">
              {booking.customer_email}
            </a>
          </p>
          {booking.customer_phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <a href={`tel:${booking.customer_phone}`} className="hover:underline">
                {booking.customer_phone}
              </a>
            </p>
          )}
          {booking.notes && (
            <p className="flex items-start gap-1.5 sm:col-span-2">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{booking.notes}</span>
            </p>
          )}
        </div>

        {booking.status === 'confirmed' && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              isLoading={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: booking.id, status: 'completed' })}
            >
              Completata
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus.mutate({ id: booking.id, status: 'no_show' })}
            >
              Non presentato
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => updateStatus.mutate({ id: booking.id, status: 'cancelled' })}
            >
              Annulla
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
