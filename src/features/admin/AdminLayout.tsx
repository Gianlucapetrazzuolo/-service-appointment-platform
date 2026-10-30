import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { FullPageSpinner } from '@/components/ui/Spinner';

/**
 * Contenitore delle pagine admin. La navigazione è gestita dalla Sidebar
 * (visibile dopo il login); qui resta solo il wrapper del contenuto.
 */
export function AdminLayout() {
  return (
    <Container className="py-6 sm:py-10">
      <Suspense fallback={<FullPageSpinner />}>
        <Outlet />
      </Suspense>
    </Container>
  );
}
