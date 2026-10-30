import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Service } from '@/types/domain';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useSaveService } from './servicesAdmin';

const schema = z.object({
  name: z.string().min(2, 'Inserisci il nome.'),
  description: z.string().max(500, 'Massimo 500 caratteri.').optional(),
  duration_min: z.coerce
    .number()
    .int('Solo numeri interi.')
    .min(1, 'Durata minima 1 minuto.')
    .max(600, 'Durata massima 600 minuti.'),
  priceEuro: z.coerce.number().min(0, 'Il prezzo non può essere negativo.'),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  is_package: z.boolean(),
  description_long: z.string().max(2000, 'Massimo 2000 caratteri.').optional(),
  image_url: z.string().nullable().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ServiceForm({ service, onDone }: { service?: Service; onDone: () => void }) {
  const saveService = useSaveService();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration_min: service?.duration_min ?? 30,
      priceEuro: service ? service.price_cents / 100 : 0,
      is_active: service?.is_active ?? true,
      sort_order: service?.sort_order ?? 0,
      is_package: service?.is_package ?? false,
      description_long: service?.description_long ?? '',
      image_url: service?.image_url ?? null,
    },
  });

  const isPackage = watch('is_package');
  const imageUrl = watch('image_url') ?? null;

  function onSubmit(values: FormValues) {
    saveService.mutate(
      {
        id: service?.id,
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        duration_min: values.duration_min,
        price_cents: Math.round(values.priceEuro * 100),
        is_active: values.is_active,
        sort_order: values.sort_order,
        is_package: values.is_package,
        description_long: values.description_long?.trim() ? values.description_long.trim() : null,
        image_url: values.image_url ?? null,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saveService.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {saveService.error.message}
        </p>
      )}

      <label className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 accent-primary" {...register('is_package')} />
        È un pacchetto (combo di trattamenti con descrizione estesa)
      </label>

      <Input label="Nome" required error={errors.name?.message} {...register('name')} />
      <Textarea
        label="Descrizione breve"
        rows={2}
        hint="Mostrata nelle card."
        error={errors.description?.message}
        {...register('description')}
      />

      {isPackage && (
        <Textarea
          label="Descrizione estesa (pacchetto)"
          rows={4}
          hint="Spiega cosa include e i benefici del pacchetto."
          error={errors.description_long?.message}
          {...register('description_long')}
        />
      )}

      <ImageUpload
        label="Immagine"
        folder="services"
        value={imageUrl}
        onChange={(url) => setValue('image_url', url, { shouldDirty: true })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Durata (minuti)"
          type="number"
          inputMode="numeric"
          required
          error={errors.duration_min?.message}
          {...register('duration_min')}
        />
        <Input
          label="Prezzo (€)"
          type="number"
          inputMode="decimal"
          step="0.01"
          error={errors.priceEuro?.message}
          {...register('priceEuro')}
        />
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <Input
          label="Ordine"
          type="number"
          inputMode="numeric"
          hint="Posizione in lista"
          error={errors.sort_order?.message}
          {...register('sort_order')}
        />
        <label className="flex h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register('is_active')} />
          Attivo (visibile ai clienti)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" isLoading={saveService.isPending}>
          {service ? 'Salva modifiche' : 'Crea'}
        </Button>
      </div>
    </form>
  );
}
