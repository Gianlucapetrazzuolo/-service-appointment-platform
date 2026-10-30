import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { buttonClasses } from '@/components/ui/buttonClasses';

/** Pagina segnaposto per rotte completate nelle tappe successive. */
export function PlaceholderPage({ title, stage }: { title: string; stage: string }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Construction className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Questa sezione verrà implementata nella <strong>{stage}</strong>.
      </p>
      <Link to="/" className={buttonClasses({ variant: 'outline', className: 'mt-6' })}>
        Torna alla home
      </Link>
    </Container>
  );
}

export function NotFoundPage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-5xl font-bold text-primary">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">Pagina non trovata</h1>
      <p className="mt-2 text-muted-foreground">La pagina che cerchi non esiste o è stata spostata.</p>
      <Link to="/" className={buttonClasses({ className: 'mt-6' })}>
        Torna alla home
      </Link>
    </Container>
  );
}
