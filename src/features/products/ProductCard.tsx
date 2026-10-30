import { Package } from 'lucide-react';
import type { Product } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

/** Card prodotto da vetrina: solo esposizione, niente carrello/acquisto. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-8 w-8" aria-hidden />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <Badge tone="muted" className="w-fit">
            {product.category}
          </Badge>
        )}
        <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
        )}
        {product.price_cents > 0 && (
          <p className="mt-auto pt-2 font-display text-lg font-semibold">
            {formatPrice(product.price_cents)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
