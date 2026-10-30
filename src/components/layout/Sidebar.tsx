import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock,
  Home,
  Image as ImageIcon,
  Info,
  LogOut,
  MapPin,
  Package,
  Scissors,
  Settings as SettingsIcon,
  ShoppingBag,
  User as UserIcon,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useBranding } from '@/features/settings/useBranding';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const clientItems: NavItem[] = [
  { to: '/', label: 'Vetrina', icon: Home, end: true },
  { to: '/prenota', label: 'Prenota', icon: CalendarPlus },
  { to: '/chi-siamo', label: 'Chi siamo', icon: Info },
  { to: '/le-mie-prenotazioni', label: 'Le mie prenotazioni', icon: CalendarDays },
  { to: '/account', label: 'Account', icon: UserIcon },
];

const adminItems: NavItem[] = [
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarRange },
  { to: '/admin/statistiche', label: 'Statistiche', icon: BarChart3 },
  { to: '/admin', label: 'Prenotazioni', icon: CalendarDays, end: true },
  { to: '/admin/sedi', label: 'Sedi', icon: MapPin },
  { to: '/admin/operatori', label: 'Operatori', icon: UsersRound },
  { to: '/admin/servizi', label: 'Servizi / Pacchetti', icon: Package },
  { to: '/admin/prodotti', label: 'Prodotti', icon: ShoppingBag },
  { to: '/admin/slide', label: 'Home / Slide', icon: ImageIcon },
  { to: '/admin/contenuti', label: 'Chi siamo', icon: Info },
  { to: '/admin/orari', label: 'Orari', icon: Clock },
  { to: '/admin/impostazioni', label: 'Impostazioni', icon: SettingsIcon },
];

function itemClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );
}

/** Contenuto della sidebar, condiviso tra versione desktop e drawer mobile. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, isAdmin, signOut } = useAuth();
  const { businessName, logoUrl } = useBranding();
  const navigate = useNavigate();

  async function handleSignOut() {
    onNavigate?.();
    await signOut();
    navigate('/');
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <NavLink
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 py-1 font-display text-xl font-semibold"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
          ) : (
            <Scissors className="h-5 w-5" aria-hidden />
          )}
        </span>
        <span className="truncate">{businessName}</span>
      </NavLink>

      {/* Navigazione */}
      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
        {clientItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={itemClass}>
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gestione
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={itemClass}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer sidebar: utente + logout */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 px-3 text-sm">
          <p className="truncate font-medium">{profile?.full_name ?? 'Account'}</p>
          {isAdmin && <p className="text-xs text-muted-foreground">Amministratore</p>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Esci
        </button>
      </div>
    </div>
  );
}
