import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Location } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAdminLocations, useDeleteLocation } from '@/features/admin/locationsAdmin';
import { LocationForm } from '@/features/admin/LocationForm';

export function AdminLocationsPage() {
  const { data: locations, isLoading, isError } = useAdminLocations();
  const deleteLocation = useDeleteLocation();
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Location | null>(null);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Sedi</h2>
          <p className="text-sm text-muted-foreground">Le sedi fisiche dell'attività.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare le sedi" />
      ) : !locations || locations.length === 0 ? (
        <EmptyState
          title="Nessuna sede"
          description="Aggiungi la prima sede della tua attività."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Aggiungi sede
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {locations.map((location) => (
            <li key={location.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{location.name}</p>
                        {!location.is_active && <Badge tone="muted">Disattivata</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {location.address ?? '—'} · {location.timezone}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifica ${location.name}`}
                      onClick={() => setEditing(location)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Elimina ${location.name}`}
                      onClick={() => setToDelete(location)}
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
        title={editing ? 'Modifica sede' : 'Nuova sede'}
      >
        <LocationForm
          location={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminare la sede?"
        description={toDelete ? `"${toDelete.name}" e i suoi operatori/orari verranno rimossi.` : undefined}
      >
        {deleteLocation.isError && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {deleteLocation.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteLocation.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteLocation.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            Elimina
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
