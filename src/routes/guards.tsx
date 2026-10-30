import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { FullPageSpinner } from '@/components/ui/Spinner';

/** Richiede un utente autenticato; altrimenti reindirizza al login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/** Richiede ruolo admin; reindirizza al login o alla home se non autorizzato. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
