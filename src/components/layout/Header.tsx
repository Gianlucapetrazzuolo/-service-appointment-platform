import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useBranding } from '@/features/settings/useBranding';
import { cn } from '@/lib/utils';
import { Container } from './Container';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';

export function Header() {
  const { session, profile, isAdmin, signOut } = useAuth();
  const { businessName, logoUrl } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Chiudi il menu mobile a ogni cambio di pagina.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <Scissors className="h-5 w-5" aria-hidden />
            )}
          </span>
          <span className="truncate">{businessName}</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/servizi" className={navLinkClass}>
            Servizi
          </NavLink>
          <NavLink to="/prodotti" className={navLinkClass}>
            Prodotti
          </NavLink>
          <NavLink to="/chi-siamo" className={navLinkClass}>
            Chi siamo
          </NavLink>
          {session ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/le-mie-prenotazioni" className={navLinkClass}>
                Prenotazioni
              </NavLink>
              <NavLink to="/account" className={navLinkClass}>
                {profile?.full_name?.split(' ')[0] ?? 'Account'}
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleSignOut} isLoading={signingOut}>
                <LogOut className="h-4 w-4" aria-hidden />
                Esci
              </Button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Accedi
            </NavLink>
          )}
          <Link to="/prenota" className={buttonClasses({ size: 'sm' })}>
            Prenota
          </Link>
        </nav>

        {/* Azioni mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/prenota" className={buttonClasses({ size: 'sm' })}>
            Prenota
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </Button>
        </div>
      </Container>

      {/* Menu mobile a tendina */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden animate-fade-in">
          <Container className="flex flex-col py-2">
            <MobileLink to="/servizi" icon={Scissors} label="Servizi" />
            <MobileLink to="/prodotti" icon={ShoppingBag} label="Prodotti" />
            <MobileLink to="/chi-siamo" icon={Info} label="Chi siamo" />
            {session ? (
              <>
                {isAdmin && <MobileLink to="/admin" icon={LayoutDashboard} label="Pannello admin" />}
                <MobileLink to="/le-mie-prenotazioni" icon={UserIcon} label="Le mie prenotazioni" />
                <MobileLink to="/account" icon={UserIcon} label="Account" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 py-3 text-left text-sm font-medium text-destructive"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Esci
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" icon={UserIcon} label="Accedi" />
                <MobileLink to="/registrati" icon={UserIcon} label="Registrati" />
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Scissors;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 py-3 text-sm font-medium',
          isActive ? 'text-primary' : 'text-foreground',
        )
      }
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </NavLink>
  );
}
