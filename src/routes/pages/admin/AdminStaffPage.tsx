import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import type { Staff } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAdminLocations } from '@/features/admin/locationsAdmin';
import { useAdminStaff, useDeleteStaff } from '@/features/admin/staffAdmin';
import { StaffForm } from '@/features/admin/StaffForm';

export function AdminStaffPage() {
  const { data: staff, isLoading, isError } = useAdminStaff();
  const { data: locations } = useAdminLocations();
  const deleteStaff = useDeleteStaff();
  const [editing, setEditing] = useState<Staff | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Staff | null>(null);

  const locationName = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of locations ?? []) map.set(l.id, l.name);
    return map;
  }, [locations]);

  if (isLoading) return <FullPageSpinner />;

  const noLocations = !locations || locations.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Operatori</h2>
          <p className="text-sm text-muted-foreground">Ogni operatore appartiene a una sede.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} disabled={noLocations}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {noLocations && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Crea prima una <strong>sede</strong> per poter aggiungere operatori.
        </p>
      )}

      {isError ? (
        <ErrorState title="Impossibile caricare gli operatori" />
      ) : !staff || staff.length === 0 ? (
        <EmptyState title="Nessun operatore" description="Aggiungi gli operatori delle tue sedi." />
      ) : (
        <ul className="space-y-3">
          {staff.map((s) => (
            <li key={s.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                      <UserRound className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{s.full_name}</p>
                        {!s.is_active && <Badge tone="muted">Disattivato</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {locationName.get(s.location_id) ?? 'Sede sconosciuta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifica ${s.full_name}`}
                      onClick={() => setEditing(s)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Elimina ${s.full_name}`}
                      onClick={() => setToDelete(s)}
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
        title={editing ? 'Modifica operatore' : 'Nuovo operatore'}
      >
        <StaffForm
          staff={editing ?? undefined}
          locations={locations ?? []}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminare l'operatore?"
        description={toDelete ? `"${toDelete.full_name}" verrà rimosso.` : undefined}
      >
        {deleteStaff.isError && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {deleteStaff.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteStaff.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteStaff.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            Elimina
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
