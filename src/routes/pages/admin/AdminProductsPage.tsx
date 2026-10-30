import { useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types/domain';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAdminProducts, useDeleteProduct } from '@/features/admin/productsAdmin';
import { ProductForm } from '@/features/admin/ProductForm';

export function AdminProductsPage() {
  const { data: products, isLoading, isError } = useAdminProducts();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold">Prodotti</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Aggiungi
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare i prodotti" />
      ) : !products || products.length === 0 ? (
        <EmptyState
          title="Nessun prodotto"
          description="Aggiungi i prodotti che vuoi mostrare in vetrina."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Aggiungi prodotto
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-3 pr-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{product.name}</p>
                        {product.category && <Badge tone="muted">{product.category}</Badge>}
                        {!product.is_active && <Badge tone="muted">Nascosto</Badge>}
                      </div>
                      {product.price_cents > 0 && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatPrice(product.price_cents)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifica ${product.name}`}
                      onClick={() => setEditing(product)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Elimina ${product.name}`}
                      onClick={() => setToDelete(product)}
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
        title={editing ? 'Modifica prodotto' : 'Nuovo prodotto'}
      >
        <ProductForm
          product={editing ?? undefined}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminare il prodotto?"
        description={toDelete ? `"${toDelete.name}" verrà rimosso dalla vetrina.` : undefined}
      >
        {deleteProduct.isError && (
          <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {deleteProduct.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            isLoading={deleteProduct.isPending}
            onClick={() => {
              if (!toDelete) return;
              deleteProduct.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
            }}
          >
            Elimina
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
