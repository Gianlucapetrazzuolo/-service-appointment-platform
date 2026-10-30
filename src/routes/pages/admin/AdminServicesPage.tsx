import { useState } from 'react';
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Service } from '@/types/domain';
import { formatDuration, formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAdminServices, useDeleteService } from '@/features/admin/servicesAdmin';
import { ServiceForm } from '@/features/admin/ServiceForm';

export function AdminServicesPage() {
  const { data: services, isLoading, isError } = useAdminServices();
  const deleteService = useDeleteService();
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Servizi</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare i servizi" />
      ) : !services || services.length === 0 ? (
        <EmptyState
          title="Nessun servizio"
          description="Aggiungi il primo servizio che i clienti potranno prenotare."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Aggiungi servizio
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{service.name}</p>
                      {service.is_package && <Badge tone="default">Pacchetto</Badge>}
                      {!service.is_active && <Badge tone="muted">Disattivato</Badge>}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {formatDuration(service.duration_min)}
                      {service.price_cents > 0 && <> · {formatPrice(service.price_cents)}</>}
                    </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifica ${service.name}`}
                      onClick={() => setEditing(service)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Elimina ${service.name}`}
                      onClick={() => setToDelete(service)}
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

      {/* Crea / Modifica */}
      <Dialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? 'Modifica servizio' : 'Nuovo servizio'}
      >
        <ServiceForm
          service={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      {/* Conferma eliminazione */}
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminare il servizio?"
        description={toDelete ? `"${toDelete.name}" verrà rimosso definitivamente.` : undefined}
      >
        {deleteService.isError && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {deleteService.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteService.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteService.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            Elimina
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
