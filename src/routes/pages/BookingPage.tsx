import { useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Clock, LogIn, MapPin, UserRound } from 'lucide-react';
import type { Booking } from '@/types/domain';
import { useAuth } from '@/context/auth-context';
import { useService } from '@/features/services/queries';
import { useSettings } from '@/features/settings/queries';
import { useLocations } from '@/features/locations/queries';
import { useStaff } from '@/features/staff/queries';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { formatDuration, formatPrice } from '@/lib/utils';
import { ServicePicker } from '@/features/booking/ServicePicker';
import { LocationPicker } from '@/features/booking/LocationPicker';
import { AvailabilityCalendar } from '@/features/booking/AvailabilityCalendar';
import { DayScheduleDialog } from '@/features/booking/DayScheduleDialog';
import { BookingForm } from '@/features/booking/BookingForm';
import { formatBookingDateTime, formatSlotTime } from '@/features/booking/dateUtils';

export function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const { session } = useAuth();
  const { data: settings } = useSettings();
  const { data: locations } = useLocations();

  const serviceId = searchParams.get('service');
  const locationId = searchParams.get('location');
  const selectedDate = searchParams.get('date');
  const selectedSlot = searchParams.get('slot');
  const staffId = searchParams.get('staff'); // operatore concreto (settato al click)

  const { data: service, isLoading: serviceLoading, isError } = useService(serviceId);
  const { data: staffList } = useStaff(locationId);

  const selectedLocation = useMemo(
    () => locations?.find((l) => l.id === locationId) ?? null,
    [locations, locationId],
  );
  const timezone = selectedLocation?.timezone ?? settings?.timezone ?? 'Europe/Rome';
  const maxAdvance = settings?.max_advance_days ?? 60;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [dayOpen, setDayOpen] = useState(false);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next);
  }

  const staffLabel = staffList?.find((s) => s.id === staffId)?.full_name ?? 'Operatore';

  if (booking) {
    return <BookingSuccess booking={booking} timezone={timezone} />;
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Prenota</h1>

        {/* Step 1 — servizio */}
        {!serviceId && (
          <div className="mt-6">
            <p className="mb-4 text-muted-foreground">Scegli il servizio che vuoi prenotare.</p>
            <ServicePicker onSelect={(id) => setSearchParams({ service: id })} />
          </div>
        )}

        {serviceId && serviceLoading && <FullPageSpinner />}

        {serviceId && !serviceLoading && (isError || !service) && (
          <div className="mt-6">
            <ErrorState
              title="Servizio non trovato"
              action={
                <Button variant="outline" onClick={() => setSearchParams({})}>
                  Scegli un servizio
                </Button>
              }
            />
          </div>
        )}

        {serviceId && service && (
          <div className="mt-6 space-y-4">
            {/* Riepilogo servizio */}
            <SummaryRow
              icon={<Clock className="h-4 w-4" aria-hidden />}
              title={service.name}
              subtitle={`${formatDuration(service.duration_min)}${service.price_cents > 0 ? ` · ${formatPrice(service.price_cents)}` : ''}`}
              onChange={() => setSearchParams({})}
            />

            {/* Step 2 — sede (invariato) */}
            {!locationId ? (
              <Section title="Scegli la sede">
                <LocationPicker onSelect={(id) => update({ location: id, date: null, slot: null, staff: null })} />
              </Section>
            ) : (
              <>
                <SummaryRow
                  icon={<MapPin className="h-4 w-4" aria-hidden />}
                  title={selectedLocation?.name ?? 'Sede'}
                  subtitle={selectedLocation?.address ?? undefined}
                  onChange={() => update({ location: null, date: null, slot: null, staff: null })}
                />

                {/* Step 3 — conferma (orario+operatore scelti) */}
                {selectedSlot && staffId ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => update({ slot: null, staff: null })}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Cambia orario / operatore
                    </button>

                    <SummaryRow
                      icon={<UserRound className="h-4 w-4" aria-hidden />}
                      title={staffLabel}
                      subtitle={formatBookingDateTime(selectedSlot, timezone)}
                      onChange={() => update({ slot: null, staff: null })}
                    />

                    {session ? (
                      <BookingForm
                        service={service}
                        slotIso={selectedSlot}
                        timezone={timezone}
                        locationId={locationId}
                        staffId={staffId}
                        onSuccess={setBooking}
                      />
                    ) : (
                      <Card>
                        <CardContent className="space-y-4 p-6 text-center">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <LogIn className="h-6 w-6" aria-hidden />
                          </span>
                          <div>
                            <p className="font-medium">Accedi per confermare</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Hai scelto <strong>{service.name}</strong> · {selectedLocation?.name} ·{' '}
                              {staffLabel} per il {formatBookingDateTime(selectedSlot, timezone)}.
                              Accedi o registrati: la tua scelta verrà mantenuta.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                            <Link
                              to="/login"
                              state={{ from: routerLocation }}
                              className={buttonClasses({ className: 'w-full sm:w-auto' })}
                            >
                              Accedi
                            </Link>
                            <Link
                              to="/registrati"
                              className={buttonClasses({ variant: 'outline', className: 'w-full sm:w-auto' })}
                            >
                              Registrati
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  /* Step 3 — calendario + agenda del giorno */
                  <div className="space-y-5">
                    <Section title="Scegli il giorno">
                      <AvailabilityCalendar
                        serviceId={service.id}
                        locationId={locationId}
                        timezone={timezone}
                        maxAdvanceDays={maxAdvance}
                        selectedDate={selectedDate}
                        onSelectDate={(d) => {
                          update({ date: d, slot: null, staff: null });
                          setDayOpen(true);
                        }}
                      />
                    </Section>

                    {selectedDate && (
                      <DayScheduleDialog
                        open={dayOpen}
                        onClose={() => setDayOpen(false)}
                        serviceId={service.id}
                        locationId={locationId}
                        date={selectedDate}
                        timezone={timezone}
                        onSelect={(sid, iso) => {
                          update({ date: selectedDate, slot: iso, staff: sid });
                          setDayOpen(false);
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SummaryRow({
  icon,
  title,
  subtitle,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onChange: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          {subtitle && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              {icon}
              {subtitle}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onChange}>
          Cambia
        </Button>
      </CardContent>
    </Card>
  );
}

function BookingSuccess({ booking, timezone }: { booking: Booking; timezone: string }) {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CalendarCheck className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">Prenotazione confermata!</h1>
        <p className="mt-2 text-muted-foreground">
          Ti abbiamo inviato un’email di conferma a <strong>{booking.customer_email}</strong>.
        </p>

        <Card className="mt-6 text-left">
          <CardContent className="space-y-2 p-5">
            <p className="font-display text-lg font-semibold">{booking.service_name}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {formatBookingDateTime(booking.starts_at, timezone)} –{' '}
              {formatSlotTime(booking.ends_at, timezone)}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {booking.location_name}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              {booking.staff_name}
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/le-mie-prenotazioni" className={buttonClasses({})}>
            Le mie prenotazioni
          </Link>
          <Link to="/" className={buttonClasses({ variant: 'outline' })}>
            Torna alla home
          </Link>
        </div>
      </div>
    </Container>
  );
}
