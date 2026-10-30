import { Link } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';
import type { Service } from '@/types/domain';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { formatDuration, formatPrice } from '@/lib/utils';

/** Card ricca per i pacchetti: immagine grande + descrizione estesa. */
export function PackageCard({ service }: { service: Service }) {
  return (
    <Card className="grid overflow-hidden transition-all duration-200 hover:shadow-card-hover md:grid-cols-2">
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted md:aspect-auto md:h-full">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Sparkles className="h-8 w-8" aria-hidden />
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl font-semibold leading-tight">{service.name}</h3>
          <Badge tone="default" className="shrink-0 gap-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Pacchetto
          </Badge>
        </div>

        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {service.description_long || service.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden />
              {formatDuration(service.duration_min)}
            </p>
            <p className="font-display text-xl font-semibold">
              {service.price_cents > 0 ? formatPrice(service.price_cents) : 'Su richiesta'}
            </p>
          </div>
          <Link
            to={`/prenota?service=${service.id}`}
            className={buttonClasses({})}
            aria-label={`Prenota ${service.name}`}
          >
            Prenota
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
