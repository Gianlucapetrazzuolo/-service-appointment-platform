import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Clock, ShieldCheck, Smartphone } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ServiceList } from '@/features/services/ServiceList';
import { useServices } from '@/features/services/queries';
import { useProducts } from '@/features/products/queries';
import { ProductCard } from '@/features/products/ProductCard';
import { HeroCarousel } from '@/features/home/HeroCarousel';
import { useBranding } from '@/features/settings/useBranding';

const features = [
  {
    icon: Clock,
    title: 'Slot in tempo reale',
    description: 'Gli orari liberi si calcolano in base alla durata del servizio scelto.',
  },
  {
    icon: CalendarCheck,
    title: 'Conferma immediata',
    description: 'Prenoti in pochi tap e ricevi subito l’email di conferma.',
  },
  {
    icon: Smartphone,
    title: 'Pensato per il mobile',
    description: 'Interfaccia veloce e comoda da smartphone, dove prenoti davvero.',
  },
  {
    icon: ShieldCheck,
    title: 'Dati al sicuro',
    description: 'Autenticazione e permessi gestiti con Supabase e Row Level Security.',
  },
];

export function HomePage() {
  const { businessName, tagline } = useBranding();

  return (
    <>
      <HeroCarousel fallbackTitle={businessName} fallbackSubtitle={tagline}>
        <Link to="/prenota" className={buttonClasses({ size: 'lg', className: 'w-full sm:w-auto' })}>
          Prenota ora
        </Link>
        <Link
          to="/servizi"
          className={buttonClasses({ size: 'lg', variant: 'outline', className: 'w-full sm:w-auto' })}
        >
          Vedi i servizi
        </Link>
      </HeroCarousel>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <CardHeader>
                  <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Pacchetti in evidenza (solo se presenti) */}
      <section className="py-6 empty:hidden">
        <Container>
          <PackagesPreview />
        </Container>
      </section>

      <section className="border-t border-border bg-muted/30 py-14 sm:py-20">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Servizi in evidenza
              </h2>
              <p className="mt-2 text-muted-foreground">Un assaggio di ciò che puoi prenotare.</p>
            </div>
            <Link
              to="/servizi"
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Tutti i servizi
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ServiceList kind="services" limit={3} />
        </Container>
      </section>

      {/* Prodotti in vetrina (solo se presenti) */}
      <section className="py-14 empty:hidden sm:py-20">
        <Container>
          <ProductsPreview />
        </Container>
      </section>
    </>
  );
}

/** Anteprima prodotti che si nasconde se non ce ne sono. */
function ProductsPreview() {
  const { data } = useProducts();
  const items = (data ?? []).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Prodotti in vetrina
          </h2>
          <p className="mt-2 text-muted-foreground">I prodotti che usiamo e consigliamo.</p>
        </div>
        <Link to="/prodotti" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          Tutti i prodotti
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

/** Sezione "Pacchetti in evidenza" che si nasconde se non ci sono pacchetti. */
function PackagesPreview() {
  const { data } = useServices();
  const hasPackages = (data ?? []).some((s) => s.is_package);
  if (!hasPackages) return null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            I nostri pacchetti
          </h2>
          <p className="mt-2 text-muted-foreground">Trattamenti combinati, pensati per te.</p>
        </div>
        <Link to="/servizi" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          Scopri tutto
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <ServiceList kind="packages" limit={2} hideIfEmpty />
    </>
  );
}
