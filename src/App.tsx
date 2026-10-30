import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthProvider';
import { SiteLayout } from './components/layout/SiteLayout';
import { BrandingEffect } from './features/settings/BrandingEffect';
import { ScrollToTop } from './routes/ScrollToTop';
import { RequireAdmin, RequireAuth } from './routes/guards';
import { FullPageSpinner } from './components/ui/Spinner';

// Code-splitting: ogni pagina è un chunk separato, caricato on-demand.
const HomePage = lazy(() => import('./routes/pages/HomePage').then((m) => ({ default: m.HomePage })));
const ServicesPage = lazy(() =>
  import('./routes/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })),
);
const BookingPage = lazy(() =>
  import('./routes/pages/BookingPage').then((m) => ({ default: m.BookingPage })),
);
const MyBookingsPage = lazy(() =>
  import('./routes/pages/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage })),
);
const AccountPage = lazy(() =>
  import('./routes/pages/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const LoginPage = lazy(() => import('./routes/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() =>
  import('./routes/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const NotFoundPage = lazy(() =>
  import('./routes/pages/PlaceholderPage').then((m) => ({ default: m.NotFoundPage })),
);

// Admin (chunk separato, caricato solo dagli amministratori).
const AdminLayout = lazy(() =>
  import('./features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminBookingsPage = lazy(() =>
  import('./routes/pages/admin/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage })),
);
const AdminServicesPage = lazy(() =>
  import('./routes/pages/admin/AdminServicesPage').then((m) => ({ default: m.AdminServicesPage })),
);
const AdminHoursPage = lazy(() =>
  import('./routes/pages/admin/AdminHoursPage').then((m) => ({ default: m.AdminHoursPage })),
);
const AdminSettingsPage = lazy(() =>
  import('./routes/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
);
const ProductsPage = lazy(() =>
  import('./routes/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const AdminProductsPage = lazy(() =>
  import('./routes/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
);
const AdminSlidesPage = lazy(() =>
  import('./routes/pages/admin/AdminSlidesPage').then((m) => ({ default: m.AdminSlidesPage })),
);
const AboutPage = lazy(() =>
  import('./routes/pages/AboutPage').then((m) => ({ default: m.AboutPage })),
);
const AdminAboutPage = lazy(() =>
  import('./routes/pages/admin/AdminAboutPage').then((m) => ({ default: m.AdminAboutPage })),
);
const AdminStatsPage = lazy(() =>
  import('./routes/pages/admin/AdminStatsPage').then((m) => ({ default: m.AdminStatsPage })),
);
const AdminAgendaPage = lazy(() =>
  import('./routes/pages/admin/AdminAgendaPage').then((m) => ({ default: m.AdminAgendaPage })),
);
const AdminLocationsPage = lazy(() =>
  import('./routes/pages/admin/AdminLocationsPage').then((m) => ({ default: m.AdminLocationsPage })),
);
const AdminStaffPage = lazy(() =>
  import('./routes/pages/admin/AdminStaffPage').then((m) => ({ default: m.AdminStaffPage })),
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingEffect />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Rotte di autenticazione (senza header/footer, schermo intero) */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<FullPageSpinner />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/registrati"
              element={
                <Suspense fallback={<FullPageSpinner />}>
                  <SignupPage />
                </Suspense>
              }
            />

            {/* Rotte con cornice del sito (header ospite / sidebar loggato) */}
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="servizi" element={<ServicesPage />} />
              <Route path="prenota" element={<BookingPage />} />
              <Route path="chi-siamo" element={<AboutPage />} />
              <Route path="prodotti" element={<ProductsPage />} />

              {/* Solo utenti autenticati */}
              <Route
                path="account"
                element={
                  <RequireAuth>
                    <AccountPage />
                  </RequireAuth>
                }
              />
              <Route
                path="le-mie-prenotazioni"
                element={
                  <RequireAuth>
                    <MyBookingsPage />
                  </RequireAuth>
                }
              />

              {/* Solo admin */}
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminBookingsPage />} />
                <Route path="agenda" element={<AdminAgendaPage />} />
                <Route path="sedi" element={<AdminLocationsPage />} />
                <Route path="operatori" element={<AdminStaffPage />} />
                <Route path="servizi" element={<AdminServicesPage />} />
                <Route path="orari" element={<AdminHoursPage />} />
                <Route path="impostazioni" element={<AdminSettingsPage />} />
                <Route path="statistiche" element={<AdminStatsPage />} />
                <Route path="prodotti" element={<AdminProductsPage />} />
                <Route path="slide" element={<AdminSlidesPage />} />
                <Route path="contenuti" element={<AdminAboutPage />} />
              </Route>

              <Route path="404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
