import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useBranding } from '@/features/settings/useBranding';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';

/** Cornice centrata per le schermate di login/registrazione. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { businessName, logoUrl } = useBranding();
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-display text-xl font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
            ) : (
              <Scissors className="h-5 w-5" aria-hidden />
            )}
          </span>
          {businessName}
        </Link>
        <Card>
          <CardContent className="p-6 pt-6">
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </CardContent>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </Container>
  );
}
