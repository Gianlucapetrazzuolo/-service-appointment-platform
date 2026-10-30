import { useBranding } from '@/features/settings/useBranding';
import { Container } from './Container';

export function Footer() {
  const { businessName } = useBranding();
  return (
    <footer className="mt-auto border-t border-border py-8 text-sm text-muted-foreground">
      <Container className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} {businessName}. Tutti i diritti riservati.
        </p>
        <p>Prenotazioni online · Powered by Supabase</p>
      </Container>
    </footer>
  );
}
