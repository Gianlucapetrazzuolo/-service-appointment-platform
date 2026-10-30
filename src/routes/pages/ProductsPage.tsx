import { useMemo, useState } from 'react';
import { useProducts } from '@/features/products/queries';
import { ProductCard } from '@/features/products/ProductCard';
import { Container } from '@/components/layout/Container';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

export function ProductsPage() {
  const { data: products, isLoading, isError } = useProducts();
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products ?? []) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(
    () => (category ? (products ?? []).filter((p) => p.category === category) : (products ?? [])),
    [products, category],
  );

  if (isLoading) return <FullPageSpinner />;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">I nostri prodotti</h1>
        <p className="mt-3 text-muted-foreground">
          Una selezione dei prodotti che usiamo e consigliamo. Chiedi in negozio per acquistarli.
        </p>
      </div>

      {isError ? (
        <ErrorState title="Impossibile caricare i prodotti" />
      ) : !products || products.length === 0 ? (
        <EmptyState
          title="Nessun prodotto disponibile"
          description="I prodotti appariranno qui non appena verranno aggiunti dal pannello admin."
        />
      ) : (
        <>
          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <FilterChip active={category === null} onClick={() => setCategory(null)}>
                Tutti
              </FilterChip>
              {categories.map((c) => (
                <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
