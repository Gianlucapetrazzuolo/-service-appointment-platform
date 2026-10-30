import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product } from '@/types/domain';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useSaveProduct } from './productsAdmin';

const schema = z.object({
  name: z.string().min(2, 'Inserisci il nome.'),
  description: z.string().max(800, 'Massimo 800 caratteri.').optional(),
  priceEuro: z.coerce.number().min(0, 'Il prezzo non può essere negativo.'),
  category: z.string().max(60, 'Massimo 60 caratteri.').optional(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  image_url: z.string().nullable().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const saveProduct = useSaveProduct();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      priceEuro: product ? product.price_cents / 100 : 0,
      category: product?.category ?? '',
      is_active: product?.is_active ?? true,
      sort_order: product?.sort_order ?? 0,
      image_url: product?.image_url ?? null,
    },
  });

  const imageUrl = watch('image_url') ?? null;

  function onSubmit(values: FormValues) {
    saveProduct.mutate(
      {
        id: product?.id,
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        price_cents: Math.round(values.priceEuro * 100),
        category: values.category?.trim() ? values.category.trim() : null,
        is_active: values.is_active,
        sort_order: values.sort_order,
        image_url: values.image_url ?? null,
      },
      { onSuccess: onDone },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saveProduct.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {saveProduct.error.message}
        </p>
      )}

      <ImageUpload
        label="Immagine prodotto"
        folder="products"
        aspect="square"
        value={imageUrl}
        onChange={(url) => setValue('image_url', url, { shouldDirty: true })}
      />

      <Input label="Nome" required error={errors.name?.message} {...register('name')} />
      <Textarea
        label="Descrizione"
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prezzo (€)"
          type="number"
          inputMode="decimal"
          step="0.01"
          hint="0 = non mostrato"
          error={errors.priceEuro?.message}
          {...register('priceEuro')}
        />
        <Input
          label="Categoria"
          placeholder="Es. Capelli"
          error={errors.category?.message}
          {...register('category')}
        />
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
          Attivo (in vetrina)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" isLoading={saveProduct.isPending}>
          {product ? 'Salva modifiche' : 'Crea prodotto'}
        </Button>
      </div>
    </form>
  );
}
