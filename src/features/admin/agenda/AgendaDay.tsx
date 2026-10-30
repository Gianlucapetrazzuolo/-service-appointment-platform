import { CalendarOff, Clock, Mail, Phone, StickyNote, UserRound } from 'lucide-react';
import type { Booking } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { STATUS_META } from '@/features/booking/status';
import { formatSlotTime } from '@/features/booking/dateUtils';

export function AgendaDay({
  bookings,
  timezone,
  onReschedule,
  onCancel,
}: {
  bookings: Booking[];
  timezone: string;
  onReschedule?: (b: Booking) => void;
  onCancel?: (b: Booking) => void;
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="Nessun appuntamento"
        description="Non ci sono prenotazioni per questa data."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((booking) => {
        const meta = STATUS_META[booking.status];
        const canManage = booking.status === 'confirmed';
        return (
          <li key={booking.id}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-stretch">
                {/* Orario */}
                <div className="flex shrink-0 items-center gap-2 sm:w-28 sm:flex-col sm:items-start sm:justify-center sm:border-r sm:border-border sm:pr-4">
                  <span className="font-display text-xl font-semibold">
                    {formatSlotTime(booking.starts_at, timezone)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {formatSlotTime(booking.ends_at, timezone)}
                  </span>
                </div>

                {/* Dettagli */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{booking.service_name}</p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {booking.staff_name}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium">{booking.customer_name}</p>
                  <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                    <a href={`mailto:${booking.customer_email}`} className="flex items-center gap-1.5 truncate hover:text-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {booking.customer_email}
                    </a>
                    {booking.customer_phone && (
                      <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {booking.customer_phone}
                      </a>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{booking.notes}</span>
                    </p>
                  )}

                  {canManage && (onReschedule || onCancel) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onReschedule && (
                        <Button variant="outline" size="sm" onClick={() => onReschedule(booking)}>
                          Sposta
                        </Button>
                      )}
                      {onCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => onCancel(booking)}
                        >
                          <CalendarOff className="h-4 w-4" aria-hidden />
                          Cancella
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
