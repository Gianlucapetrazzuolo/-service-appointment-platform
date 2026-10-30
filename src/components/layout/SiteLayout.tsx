import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, Scissors, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useBranding } from '@/features/settings/useBranding';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

const SkipLink = () => (
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
  >
    Vai al contenuto
  </a>
);

/**
 * Layout principale del sito:
 * - Ospite → header in alto (come prima).
 * - Autenticato → sidebar fissa (desktop) / drawer hamburger (mobile).
 */
export function SiteLayout() {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SkipLink />
        <Header />
        <main id="main" className="flex-1">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  return <AuthenticatedShell />;
}

function AuthenticatedShell() {
  const { businessName, logoUrl } = useBranding();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chiudi il drawer al cambio pagina e blocca lo scroll quando è aperto.
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />

      {/* Sidebar fissa — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card px-4 py-5 lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {/* Colonna contenuto */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <Scissors className="h-4 w-4" aria-hidden />
              )}
            </span>
            <span className="truncate">{businessName}</span>
          </Link>
          <button
            type="button"
            aria-label="Apri menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-foreground hover:bg-muted"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>

        <main id="main" className="flex-1">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in-slow"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu di navigazione"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-card px-4 py-5 shadow-card-hover animate-fade-in"
          >
            <button
              type="button"
              aria-label="Chiudi menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
