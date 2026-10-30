import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, Clock } from 'lucide-react';
import type { Booking, Service } from '@/types/domain';
import { useAuth } from '@/context/auth-context';
import { formatDuration, formatPrice } from '@/lib/utils';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateBooking } from './queries';
import { formatBookingDateTime } from './dateUtils';

const schema = z.object({
  customerName: z.string().min(2, 'Inserisci il tuo nome.'),
  customerEmail: z.string().email('Inserisci un’email valida.'),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s().-]{5,}$/, 'Numero di telefono non valido.')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500, 'Massimo 500 caratteri.').optional(),
});
type FormValues = z.infer<typeof schema>;

export function BookingForm({
  service,
  slotIso,
  timezone,
  locationId,
  staffId,
  onSuccess,
}: {
  service: Service;
  slotIso: string;
  timezone: string;
  locationId: string;
  staffId: string | null; // null = qualsiasi operatore
  onSuccess: (booking: Booking) => void;
}) {
  const { user, profile } = useAuth();
  const createBooking = useCreateBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: profile?.full_name ?? '',
      customerEmail: user?.email ?? '',
      customerPhone: profile?.phone ?? '',
      notes: '',
    },
  });

  function onSubmit(values: FormValues) {
    createBooking.mutate(
      {
        serviceId: service.id,
        startsAt: slotIso,
        locationId,
        staffId,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone || undefined,
        notes: values.notes || undefined,
      },
      { onSuccess },
    );
  }

  return (
    <div className="space-y-5">
      {/* Riepilogo */}
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="font-display text-lg font-semibold">{service.name}</p>
        <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden />
            {formatBookingDateTime(slotIso, timezone)}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden />
            Durata {formatDuration(service.duration_min)}
            {service.price_cents > 0 && <> · {formatPrice(service.price_cents)}</>}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {createBooking.isError && (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {createBooking.error.message}
          </p>
        )}
        <Input
          label="Nome e cognome"
          autoComplete="name"
          required
          error={errors.customerName?.message}
          {...register('customerName')}
        />
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          hint="Riceverai qui la conferma della prenotazione."
          error={errors.customerEmail?.message}
          {...register('customerEmail')}
        />
        <Input
          label="Telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          error={errors.customerPhone?.message}
          {...register('customerPhone')}
        />
        <Textarea
          label="Note (facoltative)"
          rows={3}
          placeholder="Eventuali richieste particolari…"
          error={errors.notes?.message}
          {...register('notes')}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={createBooking.isPending}>
          Conferma prenotazione
        </Button>
      </form>
    </div>
  );
}
