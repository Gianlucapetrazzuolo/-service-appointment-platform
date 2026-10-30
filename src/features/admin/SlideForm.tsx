import { useState } from 'react';
import type { HomeSlide } from '@/types/domain';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useCreateSlide, useUpdateSlide } from './slidesAdmin';

export function SlideForm({
  slide,
  nextOrder,
  onDone,
}: {
  slide?: HomeSlide;
  nextOrder: number;
  onDone: () => void;
}) {
  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();
  const pending = createSlide.isPending || updateSlide.isPending;
  const error = createSlide.error?.message ?? updateSlide.error?.message ?? null;

  const [imageUrl, setImageUrl] = useState<string | null>(slide?.image_url ?? null);
  const [title, setTitle] = useState(slide?.title ?? '');
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? '');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!imageUrl) {
      setLocalError('Carica un’immagine per la slide.');
      return;
    }
    const payload = {
      image_url: imageUrl,
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
    };
    if (slide) {
      updateSlide.mutate({ id: slide.id, patch: payload }, { onSuccess: onDone });
    } else {
      createSlide.mutate({ ...payload, sort_order: nextOrder }, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || localError) && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {localError ?? error}
        </p>
      )}
      <ImageUpload label="Immagine slide" folder="slides" value={imageUrl} onChange={setImageUrl} />
      <Input
        label="Titolo (facoltativo)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Testo grande sovrapposto"
      />
      <Input
        label="Sottotitolo (facoltativo)"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Testo secondario"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" isLoading={pending}>
          {slide ? 'Salva' : 'Aggiungi slide'}
        </Button>
      </div>
    </form>
  );
}
