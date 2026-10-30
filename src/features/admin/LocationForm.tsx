import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Location } from '@/types/domain';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useSaveLocation } from './locationsAdmin';

const TIMEZONES = ['Europe/Rome', 'Europe/London', 'Europe/Madrid', 'Europe/Paris', 'Europe/Berlin'];

const schema = z.object({
  name: z.string().min(2, 'Inserisci il nome della sede.'),
  address: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  timezone: z.string(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

export function LocationForm({ location, onDone }: { location?: Location; onDone: () => void }) {
  const saveLocation = useSaveLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: location?.name ?? '',
      address: location?.address ?? '',
      phone: location?.phone ?? '',
      timezone: location?.timezone ?? 'Europe/Rome',
      is_active: location?.is_active ?? true,
      sort_order: location?.sort_order ?? 0,
    },
  });

  const tzOptions =
    location && !TIMEZONES.includes(location.timezone) ? [location.timezone, ...TIMEZONES] : TIMEZONES;

  function onSubmit(v: FormValues) {
    saveLocation.mutate(
      {
        id: location?.id,
        name: v.name,
        address: v.address?.trim() ? v.address.trim() : null,
        phone: v.phone?.trim() ? v.phone.trim() : null,
        timezone: v.timezone,
        is_active: v.is_active,
        sort_order: v.sort_order,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saveLocation.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {saveLocation.error.message}
        </p>
      )}
      <Input label="Nome sede" required error={errors.name?.message} {...register('name')} />
      <Input label="Indirizzo" placeholder="Via Roma 1, Napoli" {...register('address')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Telefono" type="tel" {...register('phone')} />
        <Select label="Fuso orario" {...register('timezone')}>
          {tzOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <Input
          label="Ordine"
          type="number"
          inputMode="numeric"
          error={errors.sort_order?.message}
          {...register('sort_order')}
        />
        <label className="flex h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register('is_active')} />
          Attiva (prenotabile)
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" isLoading={saveLocation.isPending}>
          {location ? 'Salva modifiche' : 'Crea sede'}
        </Button>
      </div>
    </form>
  );
}
