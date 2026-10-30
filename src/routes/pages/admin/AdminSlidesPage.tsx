import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import type { HomeSlide } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import {
  useAdminSlides,
  useDeleteSlide,
  useSwapSlideOrder,
  useUpdateSlide,
} from '@/features/admin/slidesAdmin';
import { SlideForm } from '@/features/admin/SlideForm';

export function AdminSlidesPage() {
  const { data: slides, isLoading, isError } = useAdminSlides();
  const swap = useSwapSlideOrder();
  const updateSlide = useUpdateSlide();
  const deleteSlide = useDeleteSlide();

  const [editing, setEditing] = useState<HomeSlide | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<HomeSlide | null>(null);

  if (isLoading) return <FullPageSpinner />;

  const list = slides ?? [];
  const nextOrder = list.reduce((max, s) => Math.max(max, s.sort_order), -1) + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Slide della home</h2>
          <p className="text-sm text-muted-foreground">Carosello mostrato in cima alla home.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare le slide" />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nessuna slide"
          description="Aggiungi immagini per il carosello della home."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Aggiungi slide
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((slide, i) => (
            <li key={slide.id}>
              <Card>
                <CardContent className="flex items-center gap-3 p-3">
                  <img
                    src={slide.image_url}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{slide.title || 'Senza titolo'}</p>
                      {!slide.is_active && <Badge tone="muted">Nascosta</Badge>}
                    </div>
                    {slide.subtitle && (
                      <p className="truncate text-sm text-muted-foreground">{slide.subtitle}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sposta su"
                      disabled={i === 0 || swap.isPending}
                      onClick={() => swap.mutate({ a: slide, b: list[i - 1]! })}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sposta giù"
                      disabled={i === list.length - 1 || swap.isPending}
                      onClick={() => swap.mutate({ a: slide, b: list[i + 1]! })}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={slide.is_active ? 'Nascondi' : 'Mostra'}
                      onClick={() =>
                        updateSlide.mutate({ id: slide.id, patch: { is_active: !slide.is_active } })
                      }
                    >
                      {slide.is_active ? (
                        <Eye className="h-4 w-4" aria-hidden />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Modifica"
                      onClick={() => setEditing(slide)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Elimina"
                      onClick={() => setToDelete(slide)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? 'Modifica slide' : 'Nuova slide'}
      >
        <SlideForm
          slide={editing ?? undefined}
          nextOrder={nextOrder}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminare la slide?"
        description="L'immagine non sarà più mostrata nel carosello."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteSlide.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteSlide.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            Elimina
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
