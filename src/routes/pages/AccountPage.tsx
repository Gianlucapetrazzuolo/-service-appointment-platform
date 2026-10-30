import { Link } from 'react-router-dom';
import { CalendarDays, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/buttonClasses';

export function AccountPage() {
  const { user, profile, isAdmin } = useAuth();

  const rows = [
    { icon: UserIcon, label: 'Nome', value: profile?.full_name ?? '—' },
    { icon: Mail, label: 'Email', value: user?.email ?? '—' },
    { icon: Phone, label: 'Telefono', value: profile?.phone ?? '—' },
  ];

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Il mio account</h1>
          {isAdmin && (
            <Badge tone="success" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Admin
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dati personali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/le-mie-prenotazioni"
            className={buttonClasses({ variant: 'outline', className: 'w-full sm:w-auto' })}
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            Le mie prenotazioni
          </Link>
          <Link to="/prenota" className={buttonClasses({ className: 'w-full sm:w-auto' })}>
            Nuova prenotazione
          </Link>
        </div>
      </div>
    </Container>
  );
}
