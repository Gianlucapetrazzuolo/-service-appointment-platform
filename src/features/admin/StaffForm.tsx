import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Location, Staff } from '@/types/domain';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useSaveStaff } from './staffAdmin';

const schema = z.object({
  full_name: z.string().min(2, 'Inserisci il nome dell’operatore.'),
  location_id: z.string().uuid('Seleziona una sede.'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof schema>;

export function StaffForm({
  staff,
  locations,
  onDone,
}: {
  staff?: Staff;
  locations: Location[];
  onDone: () => void;
}) {
  const saveStaff = useSaveStaff();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: staff?.full_name ?? '',
      location_id: staff?.location_id ?? locations[0]?.id ?? '',
      is_active: staff?.is_active ?? true,
      sort_order: staff?.sort_order ?? 0,
    },
  });

  function onSubmit(v: FormValues) {
    saveStaff.mutate(
      {
        id: staff?.id,
        full_name: v.full_name,
        location_id: v.location_id,
        is_active: v.is_active,
        sort_order: v.sort_order,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saveStaff.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {saveStaff.error.message}
        </p>
      )}
      <Input label="Nome operatore" required error={errors.full_name?.message} {...register('full_name')} />
      <Select label="Sede" error={errors.location_id?.message} {...register('location_id')}>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
            {!l.is_active ? ' (inattiva)' : ''}
          </option>
        ))}
      </Select>
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
          Attivo (prenotabile)
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" isLoading={saveStaff.isPending}>
          {staff ? 'Salva modifiche' : 'Crea operatore'}
        </Button>
      </div>
    </form>
  );
}
