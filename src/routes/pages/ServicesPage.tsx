import { Container } from '@/components/layout/Container';
import { ServiceList } from '@/features/services/ServiceList';
import { OpeningHours } from '@/features/settings/OpeningHours';

export function ServicesPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          I nostri servizi
        </h1>
        <p className="mt-3 text-muted-foreground">
          Scegli il servizio o il pacchetto che preferisci: la disponibilità degli orari si adatta
          automaticamente alla sua durata.
        </p>
      </div>

      {/* Pacchetti (mostrati solo se presenti) */}
      <section className="mb-12 empty:hidden">
        <ServiceList kind="packages" hideIfEmpty />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Servizi singoli</h2>
          <ServiceList kind="services" />
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <OpeningHours />
        </aside>
      </div>
    </Container>
  );
}
