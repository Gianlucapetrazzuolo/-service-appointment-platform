import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Riporta in cima la pagina a ogni cambio di rotta. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}
