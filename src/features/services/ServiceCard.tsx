import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { Service } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { formatDuration, formatPrice } from '@/lib/utils';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      {service.image_url && (
        <div className="aspect-[16/10] w-full overflow-hidden">
          <img
            src={service.image_url}
            alt={service.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">{service.name}</h3>
          <Badge tone="muted" className="shrink-0 gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDuration(service.duration_min)}
          </Badge>
        </div>

        {service.description && (
          <p className="text-sm text-muted-foreground">{service.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-lg font-semibold">
            {service.price_cents > 0 ? formatPrice(service.price_cents) : 'Su richiesta'}
          </span>
          <Link
            to={`/prenota?service=${service.id}`}
            className={buttonClasses({ size: 'sm' })}
            aria-label={`Prenota ${service.name}`}
          >
            Prenota
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
