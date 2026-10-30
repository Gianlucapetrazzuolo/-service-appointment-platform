# COMPONENTI.md — Documentazione tecnica di `src/`

Documentazione di **ogni** file in `src/` (componenti, hook, moduli), basata sul
codice reale. Per ogni file: percorso, responsabilità, props/parametri, con chi
comunica (import, chi lo usa, hook, RPC/tabelle Supabase, stato/dati), e note utili
per le modifiche.

Convenzioni del progetto:
- **Data layer**: hook React Query (`@tanstack/react-query`) che usano il client
  `supabase` (`src/lib/supabase.ts`). Le `queryKey` sono usate per cache e
  invalidazione; le mutation invalidano le key correlate in `onSuccess`.
- **Stile**: Tailwind con design-token CSS (`src/index.css`) e helper `cn`.
- **Sicurezza**: lettura pubblica via RLS; scritture admin via policy/RPC
  `SECURITY DEFINER`. Le prenotazioni passano sempre dalle RPC
  `create_booking` / `reschedule_booking` / `cancel_booking`.

---

## Indice

1. [Avvio & configurazione](#1-avvio--configurazione) — `main.tsx`, `App.tsx`, `vite-env.d.ts`, `index.css`, `brand.config.ts`
2. [lib/](#2-lib) — `supabase.ts`, `queryClient.ts`, `utils.ts`, `useThemeColor.ts`
3. [theme/](#3-theme) — `applyBrand.ts`
4. [types/](#4-types) — `database.types.ts`, `domain.ts`
5. [context/](#5-context) — `auth-context.ts`, `AuthProvider.tsx`
6. [components/ui/](#6-componentsui) — Button, buttonClasses, Card, Badge, Input, Select, Dialog, Spinner, States, ImageUpload
7. [components/layout/](#7-componentslayout) — Container, Header, Footer, Sidebar, SiteLayout
8. [routes/ (infra)](#8-routes-infrastruttura) — guards, ScrollToTop, PlaceholderPage
9. [routes/pages/ (cliente)](#9-routespages-cliente)
10. [routes/pages/admin/](#10-routespagesadmin)
11. [features/auth/](#11-featuresauth)
12. [features/settings/](#12-featuressettings)
13. [features/services/](#13-featuresservices)
14. [features/products/](#14-featuresproducts)
15. [features/home/](#15-featureshome)
16. [features/locations/](#16-featureslocations)
17. [features/staff/](#17-featuresstaff)
18. [features/storage/](#18-featuresstorage)
19. [features/stats/](#19-featuresstats)
20. [features/booking/](#20-featuresbooking)
21. [features/admin/ (data layer & form)](#21-featuresadmin-data-layer--form)
22. [features/admin/agenda/](#22-featuresadminagenda)

---

## 1. Avvio & configurazione

### `src/main.tsx`
- **Cosa fa**: entry point. Crea la root React, applica il tema brand di default e renderizza `<App />` in `StrictMode`.
- **Parametri**: nessuno.
- **Comunica con**: importa `./index.css`, `App`, `brandConfig` (`brand.config`), `applyBrand` (`theme/applyBrand`). Chiama `applyBrand(brandConfig.theme)` prima del render. Nessuna query/RPC.
- **Note fix**: il tema "live" da DB viene applicato dopo da `BrandingEffect`; qui c'è solo il default build-time. Lancia errore se manca `#root`.

### `src/App.tsx`
- **Cosa fa**: radice dell'app. Monta i provider e definisce **tutto il routing** (React Router) con **lazy loading** di ogni pagina.
- **Parametri**: nessuno (componente `default`).
- **Comunica con**: avvolge tutto in `QueryClientProvider` (`lib/queryClient`) + `AuthProvider` + `BrowserRouter`. Monta `BrandingEffect` e `ScrollToTop`. Usa i guard `RequireAuth`/`RequireAdmin` (`routes/guards`) e il layout `SiteLayout`. `Suspense` con `FullPageSpinner` come fallback. Tutte le pagine sono `lazy(() => import(...))`.
- **Rotte**: `/login`, `/registrati` (fuori layout); dentro `SiteLayout`: `/` (Home), `/servizi`, `/prenota`, `/chi-siamo`, `/prodotti`, `/account` (auth), `/le-mie-prenotazioni` (auth), e gruppo `/admin/*` (admin) con `AdminLayout` + sottorotte (`index`=prenotazioni, `agenda`, `sedi`, `operatori`, `servizi`, `orari`, `impostazioni`, `statistiche`, `prodotti`, `slide`, `contenuti`), `/404` e catch-all `*`.
- **Note fix**: per aggiungere una pagina → creare il lazy import + la `<Route>`. Le rotte admin sono protette da `RequireAdmin`. Le voci di menu sono separate (vedi `Sidebar`/`Header`): aggiungere una rotta non aggiunge il link.

### `src/vite-env.d.ts`
- **Cosa fa**: dichiarazioni di tipo per le variabili d'ambiente Vite (`ImportMetaEnv`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Note fix**: aggiungendo nuove `VITE_*` vanno dichiarate qui per la tipizzazione.

### `src/index.css`
- **Cosa fa**: importa Tailwind (`base/components/utilities`) e definisce i **design-token** come CSS custom properties in `:root` (palette "Sabbia & Espresso", in canali RGB), il tema `.dark`, e regole base (focus ring, safe-area, font).
- **Comunica con**: i token sono mappati su Tailwind in `tailwind.config.ts`; sovrascritti a runtime da `applyBrand`/`BrandingEffect`.
- **Note fix**: per cambiare la palette di default modifica le variabili `--color-*` qui. Non hard-codare colori nei componenti: usa i token (`bg-primary`, `text-muted-foreground`, …).

### `src/brand.config.ts`
- **Cosa fa**: configurazione brand **build-time** (default). Esporta i tipi `BrandTheme`, `BrandColorToken`, `BrandConfig` e l'oggetto `brandConfig` (`name`, `tagline`, `logoUrl`, `theme`).
- **Comunica con**: usato da `main.tsx` (applica `theme`), `useBranding` (fallback nome/logo/tagline), `applyBrand` (tipo `BrandTheme`).
- **Note fix**: i valori del DB (`settings`) hanno precedenza sui default qui. Per ribrandizzare staticamente, modifica `brandConfig`.

---

## 2. lib/

### `src/lib/supabase.ts`
- **Cosa fa**: crea il **client Supabase tipizzato** (`createClient<Database>`) singleton, con `persistSession`, `autoRefreshToken`, `detectSessionInUrl`. Lancia errore se mancano le env.
- **Comunica con**: importa `Database` (`types/database.types`). **Usato da quasi tutti i data layer** e da `AuthProvider`.
- **Note fix**: unico punto di accesso a Supabase. Cambi di config auth/headers vanno qui.

### `src/lib/queryClient.ts`
- **Cosa fa**: istanzia il `QueryClient` di React Query con default (`staleTime` 30s, `retry` 1, `refetchOnWindowFocus: false`).
- **Comunica con**: usato da `App.tsx` in `QueryClientProvider`.
- **Note fix**: i default qui valgono per tutte le query salvo override locali (es. molte query usano `staleTime: 15_000`).

### `src/lib/utils.ts`
- **Cosa fa**: utility pure: `cn(...)` (merge classi Tailwind via `clsx`+`twMerge`), `formatPrice(cents)` (Intl, EUR/it-IT), `formatDuration(min)` (es. "1h 30min").
- **Comunica con**: `cn` usato **ovunque**; `formatPrice`/`formatDuration` in card servizi/prodotti/pacchetti, BookingForm, BookingsChart, ecc.
- **Note fix**: `formatPrice` lavora in **centesimi**. Cambiare valuta/locale qui.

### `src/lib/useThemeColor.ts`
- **Cosa fa**: hook `useThemeColor(token, fallback)` che legge un design-token colore da `getComputedStyle(document.documentElement)` e lo restituisce come `rgb(r g b)` (usabile in SVG/Recharts).
- **Parametri**: `token` (es. `'primary'`), `fallback` (default `'rgb(111 78 55)'`).
- **Comunica con**: usato da `BookingsChart` per colorare il grafico rispettando il brand. Stato: `useState` + `useEffect`.
- **Note fix**: legge il valore **una volta** al mount (e quando cambia `token`); se il tema cambia a runtime dopo il mount, il colore del grafico non si aggiorna finché non si rimonta.

---

## 3. theme/

### `src/theme/applyBrand.ts`
- **Cosa fa**: `applyBrand(theme)` inietta le CSS custom properties (`--color-*`, `--font-*`, `--radius`) su `<html>` per ribrandizzare a runtime.
- **Parametri**: `theme: BrandTheme | null | undefined`.
- **Comunica con**: importa `BrandTheme` (`brand.config`). Usato da `main.tsx` (default) e `BrandingEffect` (valori da `settings.theme`). Nessuna query.
- **Note fix**: i colori devono essere in formato canali RGB ("R G B"). Aggiunge/aggiorna solo i token presenti nel `theme`.

---

## 4. types/

### `src/types/database.types.ts`
- **Cosa fa**: tipi del database scritti a mano (`Database`) coerenti con le migration Supabase: **Tabelle** (`profiles`, `services`, `products`, `home_slides`, `locations`, `staff`, `business_hours`, `closures`, `settings`, `bookings`) con `Row/Insert/Update`; **Functions** (`get_available_slots`, `get_month_availability`, `get_day_schedule`, `reschedule_booking`, `create_booking`, `cancel_booking`, `is_admin`, `get_admin_stats`) con `Args/Returns`; tipi `UserRole`, `BookingStatus`, `AdminStats`, `DayScheduleRow`.
- **Comunica con**: usato da `lib/supabase` (generic del client), `types/domain`, vari hook (`DayScheduleRow`, `SlideUpdate`).
- **Note fix**: **da tenere allineato a mano** con le migration SQL. Se cambi colonne/firme RPC nel DB, aggiorna qui o i tipi mentiranno.

### `src/types/domain.ts`
- **Cosa fa**: alias di dominio derivati da `Database['public']['Tables'][..]['Row']`: `Profile`, `Service`, `Product`, `HomeSlide`, `Location`, `Staff`, `BusinessHour`, `Closure`, `Settings`, `Booking`. Re-export `UserRole`, `BookingStatus`, `AdminStats`. Costante `WEEKDAY_LABELS` (0=Domenica…6=Sabato).
- **Comunica con**: importato da praticamente tutti i componenti che maneggiano entità.
- **Note fix**: `WEEKDAY_LABELS` segue la convenzione JS `Date.getDay()` (0=Dom). Gli orari (`business_hours.weekday`) usano la stessa convenzione.

---

## 5. context/

### `src/context/auth-context.ts`
- **Cosa fa**: definisce `AuthContext` e l'hook `useAuth()`. Tipo `AuthContextValue`: `loading`, `session`, `user`, `profile`, `isAdmin`, `signIn`, `signUp`, `signOut`, `refreshProfile`.
- **Parametri**: `useAuth()` non prende argomenti; lancia errore se usato fuori da `<AuthProvider>`.
- **Comunica con**: `useAuth` è usato da guards, Header, Sidebar, SiteLayout, BookingForm, BookingPage, AccountPage, ecc.
- **Note fix**: separato da `AuthProvider` per il fast-refresh. Per aggiungere campi al contesto, aggiorna sia il tipo qui sia il provider.

### `src/context/AuthProvider.tsx`
- **Cosa fa**: provider che gestisce la **sessione** e il **profilo**. Carica la sessione iniziale, ascolta `onAuthStateChange`, carica il `profile` da DB; espone `signIn`/`signUp`/`signOut`/`refreshProfile` e `isAdmin`.
- **Props**: `{ children }`.
- **Comunica con**: `supabase.auth.*` (getSession, onAuthStateChange, signInWithPassword, signUp con metadata `full_name`/`phone`, signOut); legge **tabella `profiles`** (`select * eq id`). Stato: `loading`, `session`, `profile`, `fetchSeq` (ref anti-race).
- **Note fix**: `isAdmin = profile?.role === 'admin'`. Il profilo viene creato lato DB da un trigger su signup; qui viene solo letto. La race tra fetch profilo concorrenti è gestita con `fetchSeq`.

---

## 6. components/ui/

### `src/components/ui/buttonClasses.ts`
- **Cosa fa**: `buttonClasses({variant, size, className})` restituisce le classi di un bottone; esporta i tipi `ButtonVariant` (`primary|secondary|outline|ghost|destructive`) e `ButtonSize` (`sm|md|lg|icon`). Permette di stilare `<Link>` come bottone senza `asChild`.
- **Comunica con**: usato da `Button` e da molti `<Link>` (Header, Sidebar non lo usa, HomePage, AccountPage, PlaceholderPage, ServiceCard, PackageCard, MyBookingsPage, BookingPage, LoginPage/SignupPage tramite footer, ProductsPage no).
- **Note fix**: per nuove varianti/size aggiorna qui (è la fonte di stile dei bottoni e dei Link-bottone).

### `src/components/ui/Button.tsx`
- **Cosa fa**: `<Button>` HTML con `variant`, `size`, `isLoading` (mostra spinner e disabilita). Usa `buttonClasses`.
- **Props**: `ButtonProps` = attributi `<button>` + `variant?`, `size?`, `isLoading?`.
- **Comunica con**: usato **trasversalmente** (form, dialog, pagine admin, agenda, ecc.).
- **Note fix**: `disabled` è vero anche con `isLoading`. Per Link-bottone usare `buttonClasses` su `<Link>`.

### `src/components/ui/Card.tsx`
- **Cosa fa**: primitive card: `Card`, `CardHeader`, `CardTitle` (usa `font-display`), `CardDescription`, `CardContent`, `CardFooter`.
- **Props**: attributi `div`/`h3`/`p` standard + `className`.
- **Comunica con**: usato **ovunque** (liste, form, agenda, pagine).
- **Note fix**: `Card` ha `shadow-card` e bordo token; lo stile premium si regola da `tailwind.config.ts` (ombre) e tema.

### `src/components/ui/Badge.tsx`
- **Cosa fa**: `<Badge tone>` etichetta colorata. `tone`: `default|success|warning|destructive|muted`.
- **Props**: attributi `span` + `tone?`.
- **Comunica con**: ServiceCard, PackageCard, ProductCard, AgendaDay, MyBookingsPage, AdminBookingsPage, AdminServicesPage/ProductsPage/LocationsPage/StaffPage/SlidesPage, AccountPage. I toni sono allineati a `STATUS_META` (`features/booking/status`).
- **Note fix**: i colori dei toni usano i token (`success`, `warning`, ecc.).

### `src/components/ui/Input.tsx`
- **Cosa fa**: campi form `Input` e `Textarea` (forwardRef) con `label`, `error`, `hint`, `required`, `id` auto (`useId`), stile token e `aria-invalid`.
- **Props**: attributi nativi `<input>`/`<textarea>` + `label?`, `error?`, `hint?`, `required?`.
- **Comunica con**: usato da tutti i form (Booking, Service, Product, Slide, Location, Staff, AdminSettings, AdminAbout, AdminHours, LoginPage, SignupPage).
- **Note fix**: pensati per `react-hook-form` (`{...register(...)}` passa `name/onChange/onBlur/ref`). `error` ha precedenza su `hint`.

### `src/components/ui/Select.tsx`
- **Cosa fa**: `<Select>` (forwardRef) con `label`/`error`/`hint`, freccia `ChevronDown`, stile coerente con Input.
- **Props**: attributi `<select>` + `label?`, `error?`, `hint?`; `children` = `<option>`.
- **Comunica con**: usato da LocationForm, StaffForm, AdminSettingsPage, AdminHoursPage, AdminAgendaPage, `LocationSelect`, `DayScheduleDialog` (no, usa tab), RescheduleDialog.
- **Note fix**: `appearance-none` + freccia custom; compatibile con `register`.

### `src/components/ui/Dialog.tsx`
- **Cosa fa**: **modale accessibile**: chiusura con **Esc**, **click sul backdrop**, blocco scroll del body, focus al pannello, header con titolo/descrizione e bottone X. Su mobile è un bottom-sheet (`items-end`), su desktop centrato.
- **Props**: `open`, `onClose`, `title`, `description?`, `children`, `className?`.
- **Comunica con**: usato da AdminServicesPage, AdminProductsPage, AdminSlidesPage, AdminLocationsPage, AdminStaffPage, AdminHoursPage (chiusure), AdminAgendaPage (conferma cancellazione), `RescheduleDialog`, `DayScheduleDialog`.
- **Note fix**: ritorna `null` se `!open`. `className` allarga il pannello (default `max-w-lg`, es. `DayScheduleDialog` usa `sm:max-w-2xl`). Non rende il contenuto se chiuso (utile per resettare lo stato dei figli).

### `src/components/ui/Spinner.tsx`
- **Cosa fa**: `Spinner` (icona rotante) e `FullPageSpinner` (centrato, `role=status`).
- **Props**: `Spinner({ className })`.
- **Comunica con**: usato **ovunque** per stati di caricamento; `FullPageSpinner` è fallback `Suspense` in `App`/`SiteLayout`/`AdminLayout` e loading delle pagine.
- **Note fix**: nessuna logica; solo presentazione.

### `src/components/ui/States.tsx`
- **Cosa fa**: `EmptyState` e `ErrorState` (stati vuoto/errore) con icona, titolo, descrizione, azione opzionale (entrambi usano `StateShell` interno).
- **Props**: `{ title, description?, action?, className? }` (ErrorState ha default IT).
- **Comunica con**: usato da liste/picker (ServiceList, ServicePicker, LocationPicker, SlotPicker, DayScheduleDialog) e pagine admin.
- **Note fix**: `action` riceve un nodo (es. un `<Button>`/`<Link>`).

### `src/components/ui/ImageUpload.tsx`
- **Cosa fa**: campo **upload immagine** con anteprima, carica/sostituisci/rimuovi; carica su Storage e comunica l'URL pubblico via `onChange`.
- **Props**: `value: string|null`, `onChange(url|null)`, `folder: string`, `label?`, `aspect?: 'video'|'square'`, `className?`.
- **Comunica con**: chiama `uploadImage` (`features/storage/uploadImage`) → **Storage bucket `media`**. Stato: `uploading`, `error`, ref all'`<input type=file>`. Usato da ServiceForm (`services/`), ProductForm (`products/`), SlideForm (`slides/`), AdminSettingsPage (`branding/`).
- **Note fix**: l'upload richiede ruolo admin (RLS Storage) e migration che crea il bucket `media`. Validazione tipo/dimensione è in `uploadImage` (max 5MB, solo immagini).

---

## 7. components/layout/

### `src/components/layout/Container.tsx`
- **Cosa fa**: contenitore centrato responsive (`max-w-5xl`, padding) coerente in tutta l'app.
- **Props**: attributi `div` + `className`.
- **Comunica con**: usato da Header, Footer, AdminLayout, PlaceholderPage, AuthShell, HeroCarousel e molte pagine.
- **Note fix**: per cambiare la larghezza massima globale del contenuto, agire qui.

### `src/components/layout/Header.tsx`
- **Cosa fa**: **header pubblico** (utenti non loggati). Logo/brand, nav desktop (Servizi, Prodotti, Chi siamo + voci auth), bottone "Prenota", menu **mobile a tendina** (hamburger). Gestisce logout.
- **Props**: nessuna.
- **Comunica con**: `useAuth` (session/profile/isAdmin/signOut), `useBranding` (nome/logo), `useNavigate`/`useLocation`. Usa `Container`, `Button`, `buttonClasses`, `NavLink`/`Link`. Stato: `menuOpen`, `signingOut`. Sottocomponente `MobileLink`.
- **Usato da**: `SiteLayout` (ramo ospite).
- **Note fix**: mostrato **solo agli ospiti** (i loggati vedono la `Sidebar`). Per cambiare le voci pubbliche, modificare qui (e specularmente la `Sidebar` per i loggati).

### `src/components/layout/Footer.tsx`
- **Cosa fa**: footer con nome attività e anno.
- **Props**: nessuna.
- **Comunica con**: `useBranding` (businessName), `Container`.
- **Usato da**: `SiteLayout` (entrambi i rami).

### `src/components/layout/Sidebar.tsx`
- **Cosa fa**: **navigazione post-login** (contenuto condiviso desktop + drawer mobile). Voci cliente (Vetrina, Prenota, Chi siamo, Le mie prenotazioni, Account) e, per admin, gruppo "Gestione" (Agenda, Statistiche, Prenotazioni, Sedi, Operatori, Servizi/Pacchetti, Prodotti, Home/Slide, Chi siamo, Orari, Impostazioni). In fondo: utente + logout.
- **Props**: `onNavigate?: () => void` (chiamato al click, usato per chiudere il drawer mobile).
- **Comunica con**: `useAuth`, `useBranding`, `useNavigate`, `NavLink`. Liste `clientItems`/`adminItems` (con `icon` Lucide). `itemClass` gestisce lo stato attivo.
- **Usato da**: `SiteLayout` (ramo autenticato, sia sidebar fissa sia drawer).
- **Note fix**: per aggiungere una voce admin → aggiungere a `adminItems` **e** la rotta in `App.tsx`. L'ordine delle voci è quello dell'array.

### `src/components/layout/SiteLayout.tsx`
- **Cosa fa**: layout principale del sito. **Ospite** → `Header` + `Outlet` + `Footer`. **Autenticato** → `AuthenticatedShell`: sidebar fissa (desktop) o **drawer hamburger** (mobile) + top-bar mobile + `Outlet` + `Footer`. Include `SkipLink` accessibilità e `Suspense`.
- **Props**: nessuna (usa `<Outlet>`).
- **Comunica con**: `useAuth` (session), `useBranding`, `Header`, `Footer`, `Sidebar`, `FullPageSpinner`. Stato (in `AuthenticatedShell`): `drawerOpen` (+ Esc/scroll-lock/chiusura al cambio pagina).
- **Usato da**: `App.tsx` come elemento della rotta che racchiude le pagine del sito.
- **Note fix**: il discriminante ospite/loggato è `session`. Il breakpoint sidebar/drawer è `lg`.

---

## 8. routes/ (infrastruttura)

### `src/routes/guards.tsx`
- **Cosa fa**: `RequireAuth` (richiede login, altrimenti redirect a `/login` con `state.from`) e `RequireAdmin` (richiede `isAdmin`, altrimenti redirect a `/` o `/login`).
- **Props**: `{ children }`.
- **Comunica con**: `useAuth` (loading/session/isAdmin), `Navigate`/`useLocation`, `FullPageSpinner` durante `loading`.
- **Usato da**: `App.tsx` per le rotte protette.
- **Note fix**: durante `loading` mostra spinner (evita flicker/redirect prematuri). `RequireAdmin` reindirizza alla home se loggato ma non admin.

### `src/routes/ScrollToTop.tsx`
- **Cosa fa**: riporta la pagina in cima ad ogni cambio di `pathname`. Ritorna `null`.
- **Comunica con**: `useLocation`. Usato in `App.tsx` dentro il Router.
- **Note fix**: usa `behavior: 'instant'`.

### `src/routes/pages/PlaceholderPage.tsx`
- **Cosa fa**: esporta `PlaceholderPage({title, stage})` (segnaposto "in arrivo") e **`NotFoundPage`** (404).
- **Props**: `PlaceholderPage`: `title`, `stage`.
- **Comunica con**: `Container`, `buttonClasses` (Link "Torna alla home").
- **Usato da**: `App.tsx` importa `NotFoundPage` per `/404`. `PlaceholderPage` non è più referenziato dal router attuale (resta come utility).
- **Note fix**: `NotFoundPage` è la pagina 404 reale.

---

## 9. routes/pages/ (cliente)

### `src/routes/pages/HomePage.tsx` — Vetrina
- **Cosa fa**: home pubblica: `HeroCarousel` con CTA (Prenota / Vedi i servizi), griglia "feature" statiche, anteprima **Pacchetti** (`PackagesPreview`) e **Servizi in evidenza** (`ServiceList kind=services limit=3`), e **Prodotti in vetrina** (`ProductsPreview`).
- **Props**: nessuna.
- **Comunica con**: `useBranding` (nome/tagline), `HeroCarousel`, `ServiceList`, `useServices` (per decidere se ci sono pacchetti), `useProducts` + `ProductCard`, `Container`, `Card`, `buttonClasses`, `Link`.
- **Note fix**: le sezioni pacchetti/prodotti si **nascondono** se vuote. La Home è "Vetrina": non toccarla salvo richiesta esplicita.

### `src/routes/pages/ServicesPage.tsx`
- **Cosa fa**: catalogo pubblico: sezione **Pacchetti** (`ServiceList kind=packages hideIfEmpty`) + griglia **Servizi singoli** (`ServiceList kind=services`) + colonna **OpeningHours**.
- **Comunica con**: `Container`, `ServiceList`, `OpeningHours`.
- **Note fix**: i dati arrivano da `useServices` (via `ServiceList`). La card "Prenota" porta a `/prenota?service=<id>`.

### `src/routes/pages/ProductsPage.tsx`
- **Cosa fa**: vetrina **prodotti** (sola esposizione) con **filtro categoria** dinamico e griglia `ProductCard`.
- **Comunica con**: `useProducts` (tabella `products`), `ProductCard`, `Container`, `States`, `FullPageSpinner`. Stato: `category` (filtro), `categories` memo. Sottocomponente `FilterChip`.
- **Note fix**: nessun carrello/acquisto. Le categorie derivano dai prodotti.

### `src/routes/pages/AboutPage.tsx` — Chi siamo
- **Cosa fa**: pagina pubblica a **due colonne**: sinistra = descrizione (`about_description`) + social; destra = **"Dove siamo"** (elenco di **tutte le sedi attive** con indirizzo→Maps, telefono) + **OpeningHours**. Mostra anche l'email generale (`settings.email`).
- **Comunica con**: `useSettings` (descrizione/email/social), `useLocations` (elenco sedi → indirizzi), `OpeningHours`, `Container`, `Card`. Costante `SOCIALS` (icone). Helper `mapsUrl(address)`.
- **Note fix**: gli indirizzi vengono dalle **Sedi** (`locations`), non da `settings`. La sezione "la nostra storia" (`about_history`) è **volutamente non mostrata**. Su mobile le colonne si impilano.

### `src/routes/pages/AccountPage.tsx`
- **Cosa fa**: pagina account (protetta): mostra dati profilo (nome/email/telefono), badge "Admin", link a "Le mie prenotazioni" e "Nuova prenotazione".
- **Comunica con**: `useAuth` (user/profile/isAdmin), `Container`, `Card`, `Badge`, `buttonClasses`.
- **Note fix**: sola lettura del profilo; il logout è nell'header/sidebar.

### `src/routes/pages/LoginPage.tsx`
- **Cosa fa**: form di **login** (email/password) con validazione zod; al successo naviga a `from` (o `/`).
- **Comunica con**: `useAuth().signIn`, `AuthShell`, `translateAuthError`, `Input`/`Button`, `useNavigate`/`useLocation`, `react-hook-form`+`zod`. Stato: `formError`.
- **Note fix**: `from` arriva da `location.state` (impostato dai guard / dal flusso prenotazione).

### `src/routes/pages/SignupPage.tsx`
- **Cosa fa**: form di **registrazione** (nome, telefono opzionale, email, password) con zod; se serve conferma email mostra schermata dedicata, altrimenti naviga a `/`.
- **Comunica con**: `useAuth().signUp`, `AuthShell`, `translateAuthError`, `Input`/`Button`+`buttonClasses`, `react-hook-form`+`zod`. Stato: `formError`, `emailSent`.
- **Note fix**: passa `fullName`/`phone` come metadata; il profilo viene creato dal trigger DB.

### `src/routes/pages/MyBookingsPage.tsx`
- **Cosa fa**: lista **"Le mie prenotazioni"** (protetta) con stato (badge), data/ora **nel fuso della sede**, sede+operatore, e bottone **Annulla** per gli appuntamenti futuri confermati.
- **Comunica con**: `useMyBookings` (tabella `bookings`, RLS = solo proprie), `useCancelBooking` (RPC `cancel_booking`), `useSettings`+`useLocations` (fuso per sede), `STATUS_META`, `formatBookingDateTime`/`formatSlotTime`, `Container`/`Card`/`Badge`/`Button`/`States`. Sottocomponente `BookingRow`.
- **Note fix**: il fuso usato è quello della sede del booking (`tzFor(location_id)`), con fallback `settings.timezone`. L'annullamento è permesso solo per `confirmed` e futuri.

### `src/routes/pages/BookingPage.tsx` — Prenota
- **Cosa fa**: **wizard di prenotazione** cliente, sorgente di verità negli **URL params** (`service`, `location`, `date`, `slot`, `staff`). Flusso: **Servizio** (`ServicePicker`) → **Sede** (`LocationPicker`, con riepilogo "Cambia") → **Calendario** (`AvailabilityCalendar`) → al click giorno apre il **popup** (`DayScheduleDialog`) con agenda per-operatore → click fascia verde imposta `slot`+`staff` → **conferma** (`BookingForm` se loggato, altrimenti invito al login mantenendo la scelta) → schermata **successo** (`BookingSuccess`).
- **Props**: nessuna.
- **Comunica con**: `useSearchParams`, `useAuth` (session), `useService`, `useSettings` (fuso fallback/`max_advance_days`), `useLocations` (sede selezionata→fuso/nome), `useStaff` (nome operatore per il riepilogo). Componenti: `ServicePicker`, `LocationPicker`, `AvailabilityCalendar`, `DayScheduleDialog`, `BookingForm`. Helper data: `formatBookingDateTime`, `formatSlotTime`. Stato locale: `booking` (esito), `dayOpen` (popup). Sottocomponenti `Section`, `SummaryRow`, `BookingSuccess`.
- **Note fix**: **l'operatore si sceglie cliccando una fascia verde** nel popup (non c'è più uno step "operatore"). Il fuso è quello della **sede**. La prenotazione passa da `create_booking` (in `BookingForm`). NON toccare Home/Vetrina, card servizio e step sede salvo richiesta.

---

## 10. routes/pages/admin/

> Tutte protette da `RequireAdmin` e rese dentro `AdminLayout`. Pattern comune CRUD: lista (`useAdmin*`) + `Dialog` con form + conferma eliminazione.

### `AdminBookingsPage.tsx`
- **Cosa fa**: lista **tutte le prenotazioni** con tab (Prossime/Passate/Tutte), badge stato, sede+operatore, contatti cliente, note, azioni di stato (Completata / Non presentato / Annulla) per i `confirmed`.
- **Comunica con**: `useAdminBookings` (tabella `bookings`), `useUpdateBookingStatus` (UPDATE `bookings.status`), `useSettings` (fuso), `STATUS_META`, date utils, `Card/Badge/Button/States`. Stato: `tab`.
- **Note fix**: il fuso usato è globale `settings.timezone` (non per-sede qui). Le azioni cambiano `status` direttamente (admin via RLS).

### `AdminAgendaPage.tsx` — Agenda
- **Cosa fa**: **agenda** con filtri **sede** (`LocationSelect`) e **operatore** (`Select`), viste Giorno/Settimana/Mese (`AgendaToolbar` + `AgendaDay`/`AgendaWeek`/`AgendaMonth`), spostamento (`RescheduleDialog`) e cancellazione (Dialog → `cancel_booking`).
- **Comunica con**: `useAdminLocations`, `useStaff`, `useAdminBookings`, `useCancelBooking`, `useSettings`. Helper: `dateKey`/`zonedDateKey`/`todayInTz`/`formatDayLong`. Stato: `view`, `cursor`, `picked` (sede), `staffFilter`, `toCancel`, `toReschedule`. Memo `byDay` raggruppa per giorno nel **fuso della sede**.
- **Note fix**: l'agenda è **per sede** (fuso della sede selezionata). Gli appuntamenti `cancelled` sono esclusi. Lo spostamento è gestito da `RescheduleDialog`.

### `AdminServicesPage.tsx`
- **Cosa fa**: CRUD **servizi/pacchetti**: lista (con miniatura, badge "Pacchetto"/"Disattivato"), `Dialog` con `ServiceForm`, conferma eliminazione.
- **Comunica con**: `useAdminServices`, `useDeleteService` (tabella `services`), `ServiceForm`. Stato: `editing`, `creating`, `toDelete`.
- **Note fix**: eliminare un servizio con prenotazioni fallisce (FK restrict) → messaggio "disattivalo".

### `AdminProductsPage.tsx`
- **Cosa fa**: CRUD **prodotti** (lista con miniatura/categoria, `Dialog` con `ProductForm`, conferma eliminazione).
- **Comunica con**: `useAdminProducts`, `useDeleteProduct` (tabella `products`), `ProductForm`. Stato: `editing`, `creating`, `toDelete`.

### `AdminSlidesPage.tsx`
- **Cosa fa**: gestione **slide carosello home**: lista con miniatura, **riordino** su/giù, mostra/nascondi, modifica (`SlideForm`), elimina.
- **Comunica con**: `useAdminSlides`, `useSwapSlideOrder`, `useUpdateSlide`, `useDeleteSlide` (tabella `home_slides`), `SlideForm`. Stato: `editing`, `creating`, `toDelete`. Calcola `nextOrder`.
- **Note fix**: il riordino scambia `sort_order` tra due slide (`useSwapSlideOrder`).

### `AdminLocationsPage.tsx`
- **Cosa fa**: CRUD **sedi** (lista con indirizzo/fuso/attiva, `Dialog` con `LocationForm`, conferma eliminazione).
- **Comunica con**: `useAdminLocations`, `useDeleteLocation` (tabella `locations`), `LocationForm`. Stato: `editing`, `creating`, `toDelete`.
- **Note fix**: eliminare una sede con prenotazioni fallisce (FK) → disattivala. Cancellare cascata su staff/orari.

### `AdminStaffPage.tsx`
- **Cosa fa**: CRUD **operatori** (lista con sede di appartenenza, `Dialog` con `StaffForm`, conferma eliminazione). Richiede almeno una sede.
- **Comunica con**: `useAdminStaff`, `useDeleteStaff` (tabella `staff`), `useAdminLocations` (per nome sede + per il form). Stato: `editing`, `creating`, `toDelete`, mappa `locationName`.
- **Note fix**: operatori = risorse senza login. Eliminazione bloccata se hanno prenotazioni (FK) → disattiva.

### `AdminHoursPage.tsx`
- **Cosa fa**: **orari per sede** + **chiusure**. Selettore sede (`LocationSelect`), per ogni giorno (`DayHoursCard`) fasce **modificabili inline** (`HourRangeRow`) + "Aggiungi fascia" (default mattina/pomeriggio per la pausa pranzo); sezione **chiusure** (`ClosuresSection`) con `Dialog` di aggiunta (per sede o tutte).
- **Comunica con**: `useAdminLocations`, `useAdminHours(locationId)`, `useCreateHour`/`useUpdateHour`/`useDeleteHour` (tabella `business_hours`), `useAdminClosures`/`useCreateClosure`/`useDeleteClosure` (tabella `closures`), `useForm` (closure), `formatBookingDateTime`. Stato: `picked` (sede), inline per riga.
- **Note fix**: le fasce sono **per sede**. Due fasce nello stesso giorno = pausa pranzo (intervallo centrale non prenotabile). Le chiusure con `location_id=null` valgono per **tutte** le sedi. *(File modificato di recente dall'utente — vedi versione corrente.)*

### `AdminSettingsPage.tsx`
- **Cosa fa**: impostazioni **Brand** (nome, **logo via `ImageUpload`**, colori primario/accento con color picker → salvati come canali RGB nel `theme`) e **regole prenotazione** (fuso, `slot_step_min`, `min_notice_min`, `max_advance_days`).
- **Comunica con**: `useSettings`, `useUpdateSettings` (tabella `settings`), `ImageUpload`, `Input`/`Select`/`Card`/`Button`, `react-hook-form`. Helper hex↔canali RGB. Stato: `saved`.
- **Note fix**: i colori sono convertiti hex↔"R G B". Il salvataggio aggiorna `settings.theme`; il tema live è applicato da `BrandingEffect`.

### `AdminAboutPage.tsx` — Contenuti "Chi siamo"
- **Cosa fa**: editor dei contenuti pubblici: **descrizione**, **contatti** (indirizzo/telefono/email — generali) e **social** (Instagram/Facebook/TikTok/WhatsApp). (Niente "storia".)
- **Comunica con**: `useSettings`, `useUpdateSettings` (tabella `settings`: `about_description`, `address`, `phone`, `email`, `socials`), `Input`/`Textarea`/`Card`/`Button`, `react-hook-form`. Stato: `saved`.
- **Note fix**: gli **indirizzi delle sedi** si gestiscono in **Sedi** (non qui); qui resta l'email generale, la descrizione e i social. Il campo `about_history` non è usato.

### `AdminStatsPage.tsx` — Statistiche
- **Cosa fa**: dashboard admin con **selettore sede** ("Tutte"/sede), KPI (clienti iscritti, fatturato stimato, prenotazioni) e grafico (`BookingsChart`).
- **Comunica con**: `useAdminStats(locationId)` (RPC `get_admin_stats`), `LocationSelect`, `BookingsChart`, `Card`/`States`/`FullPageSpinner`. Stato: `locationId`. Sottocomponente `StatCard`.
- **Note fix**: dati aggregati lato server (no PII). "Clienti iscritti" è globale; fatturato/prenotazioni filtrati per sede. Recharts è in un chunk separato (lazy).

---

## 11. features/auth/

### `src/features/auth/AuthShell.tsx`
- **Cosa fa**: cornice centrata per login/registrazione (logo/brand + card con titolo/sottotitolo + footer link).
- **Props**: `title`, `subtitle?`, `children`, `footer?`.
- **Comunica con**: `useBranding` (nome/logo), `Container`, `Card`, `Link`. Usato da `LoginPage` e `SignupPage`.
- **Note fix**: presentazionale; la logica è nelle pagine.

### `src/features/auth/authErrors.ts`
- **Cosa fa**: `translateAuthError(message)` traduce i messaggi di Supabase Auth in italiano (credenziali errate, email non confermata, già registrato, password corta, rate limit, email non valida).
- **Comunica con**: usato da `LoginPage` e `SignupPage`.
- **Note fix**: matching per sottostringa (case-insensitive); fallback = messaggio originale.

---

## 12. features/settings/

### `src/features/settings/queries.ts`
- **Cosa fa**: `useSettings()` (riga singola `settings`, `queryKey ['settings']`) e `useBusinessHours(locationId)` (orari di **una sede**, `queryKey ['business_hours', locationId]`).
- **Tabelle**: `settings`, `business_hours`.
- **Comunica con**: usato da `useBranding`, `BrandingEffect`, `OpeningHours`, BookingPage, MyBookingsPage, pagine admin.
- **Note fix**: `useBusinessHours` è abilitato solo con `locationId`. `staleTime` 5 min.

### `src/features/settings/useBranding.ts`
- **Cosa fa**: hook selettore puro: combina `settings` (DB) con `brandConfig` (default) → `{ businessName, tagline, logoUrl }`.
- **Comunica con**: `useSettings`, `brandConfig`. Usato da Header, Footer, Sidebar, SiteLayout, AuthShell, HomePage.
- **Note fix**: nessun effetto collaterale (gli effetti sono in `BrandingEffect`). `tagline` viene solo dal `brandConfig`.

### `src/features/settings/BrandingEffect.tsx`
- **Cosa fa**: componente "effetto" (ritorna `null`) che applica `settings.theme` via `applyBrand` e imposta `document.title` col nome attività. Va montato una volta.
- **Comunica con**: `useSettings`, `applyBrand`. Montato in `App.tsx`.
- **Note fix**: è il punto in cui il **tema live da DB** sovrascrive i default build-time.

### `src/features/settings/OpeningHours.tsx`
- **Cosa fa**: card **orari di apertura** di una sede; se `locationId` non passato, usa la **prima sede attiva** (e ne mostra il nome se ci sono più sedi).
- **Props**: `locationId?: string`.
- **Comunica con**: `useLocations`, `useBusinessHours`, `WEEKDAY_LABELS`, `Card`. Usato da `ServicesPage` e `AboutPage`.
- **Note fix**: ordine giorni Lun→Dom; più fasce/giorno mostrate separate da "·"; "Chiuso" se nessuna fascia.

---

## 13. features/services/

### `src/features/services/queries.ts`
- **Cosa fa**: `useServices()` (servizi **attivi**, ordinati per `sort_order`/`name`, `queryKey ['services','active']`) e `useService(id)` (singolo servizio attivo).
- **Tabelle**: `services`.
- **Comunica con**: usato da `ServiceList`, `ServicePicker`, `HomePage`, `BookingPage` (useService).
- **Note fix**: include sia servizi sia pacchetti (filtro `is_package` lato client in `ServiceList`).

### `src/features/services/ServiceCard.tsx`
- **Cosa fa**: card servizio (immagine opzionale, nome, durata badge, descrizione, prezzo, bottone "Prenota" → `/prenota?service=<id>`).
- **Props**: `{ service: Service }`.
- **Comunica con**: `Card`, `Badge`, `buttonClasses`, `formatDuration`/`formatPrice`, `Link`. Usato da `ServiceList`.

### `src/features/services/PackageCard.tsx`
- **Cosa fa**: card **pacchetto** ricca (immagine grande, badge "Pacchetto", `description_long`, durata/prezzo, "Prenota").
- **Props**: `{ service: Service }`.
- **Comunica con**: come ServiceCard. Usato da `ServiceList` (kind=packages).
- **Note fix**: mostra `description_long || description`.

### `src/features/services/ServiceList.tsx`
- **Cosa fa**: griglia responsive di servizi o pacchetti con stati loading/errore/vuoto; `limit` (anteprima) e `hideIfEmpty`.
- **Props**: `limit?`, `kind?: 'services'|'packages'` (default services), `hideIfEmpty?`.
- **Comunica con**: `useServices`, `ServiceCard`/`PackageCard`, `Card`/`States`. Sottocomponente `ServiceSkeleton`. Usato da `HomePage` e `ServicesPage`.
- **Note fix**: filtra per `is_package` in base a `kind`; i pacchetti sono impilati, i servizi in griglia 1/2/3.

---

## 14. features/products/

### `src/features/products/queries.ts`
- **Cosa fa**: `useProducts()` (prodotti **attivi**, `queryKey ['products','active']`).
- **Tabelle**: `products`.
- **Comunica con**: usato da `ProductsPage` e `HomePage` (anteprima).

### `src/features/products/ProductCard.tsx`
- **Cosa fa**: card prodotto da vetrina (immagine quadrata, categoria badge, nome, descrizione, prezzo). **Niente acquisto.**
- **Props**: `{ product: Product }`.
- **Comunica con**: `Card`, `Badge`, `formatPrice`. Usato da `ProductsPage` e `HomePage`.

---

## 15. features/home/

### `src/features/home/slidesQueries.ts`
- **Cosa fa**: `useSlides()` (slide **attive** del carosello, `queryKey ['home_slides','active']`, ordinate).
- **Tabelle**: `home_slides`.
- **Comunica con**: usato da `HeroCarousel`.

### `src/features/home/HeroCarousel.tsx`
- **Cosa fa**: hero con **carosello di immagini di sfondo** (auto-avanzamento ~5,5s, dissolvenza, pausa su hover/focus, frecce desktop, indicatori). Senza slide → sfondo sfumato di fallback. Contenuto (titolo/sottotitolo + CTA) sovrapposto.
- **Props**: `fallbackTitle`, `fallbackSubtitle`, `children` (le CTA).
- **Comunica con**: `useSlides`, `Container`, `cn`. Stato: `idx`, `paused`. Sottocomponente `CarouselArrow`. Usato da `HomePage`.
- **Note fix**: titolo/sottotitolo della slide hanno precedenza sui fallback. Le slide si gestiscono in `AdminSlidesPage`.

---

## 16. features/locations/

### `src/features/locations/queries.ts`
- **Cosa fa**: `useLocations()` (sedi **attive**, `queryKey ['locations','active']`, ordinate).
- **Tabelle**: `locations`.
- **Comunica con**: usato da LocationPicker, BookingPage, AboutPage, OpeningHours, MyBookingsPage, RescheduleDialog.

### `src/features/locations/LocationSelect.tsx`
- **Cosa fa**: `<Select>` di sedi per l'admin (usa l'elenco **completo** incl. inattive); opzione "Tutte le sedi" con `allowAll`.
- **Props**: `value: string|null`, `onChange(id|null)`, `allowAll?`, `label?`, `className?`.
- **Comunica con**: `useAdminLocations`, `Select`. Usato da AdminStatsPage, AdminAgendaPage, AdminHoursPage.
- **Note fix**: per l'admin (mostra anche inattive con "(inattiva)"). Per i clienti si usa `LocationPicker`.

---

## 17. features/staff/

### `src/features/staff/queries.ts`
- **Cosa fa**: `useStaff(locationId)` (operatori **attivi** di una sede, `queryKey ['staff','active',locationId]`).
- **Tabelle**: `staff`.
- **Comunica con**: usato da BookingPage (nome operatore), DayScheduleDialog (via dati), RescheduleDialog, AdminAgendaPage (filtro).
- **Note fix**: abilitato solo con `locationId`.

---

## 18. features/storage/

### `src/features/storage/uploadImage.ts`
- **Cosa fa**: `uploadImage(file, folder)` carica un'immagine su **Storage bucket `media`/<folder>** e ritorna l'URL pubblico. Valida tipo (immagine) e dimensione (max 5MB).
- **Parametri**: `file: File`, `folder: string`.
- **Comunica con**: `supabase.storage.from('media')`. Usato da `ImageUpload`.
- **Note fix**: la scrittura richiede ruolo admin (RLS su `storage.objects`). Nome file = UUID + estensione.

---

## 19. features/stats/

### `src/features/stats/queries.ts`
- **Cosa fa**: `useAdminStats(locationId=null)` → **RPC `get_admin_stats`** (aggregati, solo admin), `queryKey ['admin-stats', locationId]`.
- **Comunica con**: usato da `AdminStatsPage`.
- **Note fix**: `null` = tutte le sedi. Dati senza PII.

### `src/features/stats/BookingsChart.tsx`
- **Cosa fa**: grafico Recharts (`ComposedChart`): barre = prenotazioni/mese, linea = fatturato/mese; colori dal tema via `useThemeColor`.
- **Props**: `{ byMonth: AdminStats['by_month'] }`.
- **Comunica con**: `recharts`, `useThemeColor`, `formatPrice`, `date-fns` (label mesi IT). Usato da `AdminStatsPage`.
- **Note fix**: i colori seguono i token brand. Recharts è pesante → tenere lazy la pagina.

---

## 20. features/booking/

### `src/features/booking/queries.ts` — **cuore del flusso**
- **Cosa fa**: data layer prenotazioni.
  - `useAvailableSlots(serviceId, date, {locationId, staffId, excludeBookingId})` → **RPC `get_available_slots`** (slot liberi). `queryKey ['availability', service, date, location, staff, exclude]`.
  - `useMonthAvailability(serviceId, locationId, year, month)` → **RPC `get_month_availability`** → `Set` di date (`['month-availability', ...]`).
  - `useDaySchedule(serviceId, locationId, date)` → **RPC `get_day_schedule`** → righe per-operatore (no PII) (`['day-schedule', ...]`).
  - `useCreateBooking()` → **RPC `create_booking`** (mutation; invalida `availability`, `my-bookings`).
  - `useMyBookings()` → tabella `bookings` (RLS = proprie) (`['my-bookings']`).
  - `useCancelBooking()` → **RPC `cancel_booking`** (invalida `my-bookings`, `availability`, `admin-bookings`).
- **Tipi**: `SlotOptions`, `CreateBookingInput`.
- **Comunica con**: usato da SlotPicker, AvailabilityCalendar, DayScheduleDialog, BookingForm, MyBookingsPage, AgendaPage (cancel), RescheduleDialog (via SlotPicker).
- **Note fix**: tutte le scritture passano dalle RPC (validazione lato server, anti-overlap per operatore). `staffId=null` = "qualsiasi operatore" (assegnato dal server). Invalida `['availability']` per refresh disponibilità.

### `src/features/booking/dateUtils.ts`
- **Cosa fa**: utility date/fuso (date-fns + date-fns-tz). `todayInTz`, `buildDayOptions` (per `DaySelector`), `formatSlotTime` ("HH:mm" nel fuso), `formatBookingDateTime`, `formatDayLong`, `zonedDateKey` (yyyy-MM-dd nel fuso), `dateKey` (yyyy-MM-dd da `Date` locale). Tipo `DayOption`.
- **Comunica con**: usato da SlotPicker, DaySelector, AvailabilityCalendar, DayScheduleDialog, BookingForm, BookingPage, MyBookingsPage, AgendaMonth/Week/Day, AdminAgendaPage, RescheduleDialog, AdminBookingsPage, AdminHoursPage.
- **Note fix**: distinzione chiave: `zonedDateKey` converte un **istante** nel fuso sede; `dateKey` formatta un `Date` **locale** senza conversione (usato per il cursore del calendario).

### `src/features/booking/status.ts`
- **Cosa fa**: `STATUS_META` (mappa `BookingStatus` → `{label, tone}`) condivisa; tipo `StatusTone`.
- **Comunica con**: usato da AgendaDay, AdminBookingsPage, MyBookingsPage.
- **Note fix**: fonte unica per etichette/colori stato prenotazione.

### `src/features/booking/ServicePicker.tsx`
- **Cosa fa**: griglia di **scelta servizio** (card cliccabili).
- **Props**: `onSelect(serviceId)`.
- **Comunica con**: `useServices`, `Spinner`/`States`, `formatDuration`/`formatPrice`. Usato da `BookingPage` (step 1). **Da non modificare** (richiesta esplicita: le card servizio piacciono così).

### `src/features/booking/LocationPicker.tsx`
- **Cosa fa**: griglia di **scelta sede** (card con nome/indirizzo).
- **Props**: `onSelect(locationId)`.
- **Comunica con**: `useLocations`, `Spinner`/`States`. Usato da `BookingPage` (step 2).

### `src/features/booking/DaySelector.tsx`
- **Cosa fa**: striscia orizzontale di giorni (chip). **Legacy nel flusso cliente** (sostituito dal calendario); usato ora dal `RescheduleDialog` admin.
- **Props**: `options: DayOption[]`, `selected: string|null`, `onSelect(dateStr)`.
- **Comunica con**: tipi da `dateUtils`. Usato da `RescheduleDialog`.
- **Note fix**: per il flusso cliente si usa `AvailabilityCalendar`, non questo.

### `src/features/booking/SlotPicker.tsx`
- **Cosa fa**: griglia di **slot orari liberi** (chip) per servizio/data/sede/operatore.
- **Props**: `serviceId`, `date`, `timezone`, `selectedSlot`, `onSelect(iso)`, `locationId?`, `staffId?`, `excludeBookingId?`.
- **Comunica con**: `useAvailableSlots` (RPC `get_available_slots`), `formatSlotTime`, `Spinner`/`States`. Usato dal `RescheduleDialog` admin (nel flusso cliente è stato sostituito da `DayScheduleDialog`).
- **Note fix**: `excludeBookingId` serve allo spostamento (ignora l'appuntamento che si sta muovendo).

### `src/features/booking/AvailabilityCalendar.tsx`
- **Cosa fa**: **calendario mensile** con i giorni disponibili evidenziati/cliccabili (pallino), gli altri disabilitati; navigazione mesi nel limite `maxAdvanceDays`; mostra **solo il mese corrente** (celle vuote prima/dopo).
- **Props**: `serviceId`, `locationId`, `timezone`, `maxAdvanceDays`, `selectedDate`, `onSelectDate(dateStr)`.
- **Comunica con**: `useMonthAvailability` (RPC `get_month_availability`), `dateUtils` (`dateKey`/`todayInTz`), `date-fns`, `Card`/`Spinner`. Stato: `cursor` (mese). Usato da `BookingPage`.
- **Note fix**: i giorni disponibili = quelli ritornati dalla RPC (≥1 slot libero per la sede). Settimana Lun-prima. Mese corrente only (no giorni adiacenti).

### `src/features/booking/DayScheduleDialog.tsx`
- **Cosa fa**: **popup** "agenda del giorno per operatore": chip **verdi** (libere, cliccabili → scelgono operatore+orario) e fasce **occupate** mostrate in modo defilato ("Occupato: …", **solo orario, mai dati cliente**). Su desktop operatori affiancati (colonne), su mobile **tab** per operatore.
- **Props**: `open`, `onClose`, `serviceId`, `locationId`, `date`, `timezone`, `onSelect(staffId, iso)`.
- **Comunica con**: `useDaySchedule` (RPC `get_day_schedule`), `Dialog`, `Spinner`/`States`, `formatDayLong`/`formatSlotTime`. Stato: `tab` (operatore attivo mobile). Sottocomponente `OperatorBlock`. Usato da `BookingPage`.
- **Note fix**: la RPC `get_day_schedule` **non espone PII**; non aggiungere campi cliente. Caricamento abilitato solo quando `open` (passa `date` o `null`). Click verde → `onSelect(staffId, iso)` (l'operatore concreto entra nel flusso).

---

## 21. features/admin/ (data layer & form)

### `src/features/admin/AdminLayout.tsx`
- **Cosa fa**: wrapper delle pagine admin (`Container` + `Suspense` + `Outlet`). La nav è nella `Sidebar`.
- **Comunica con**: `Container`, `FullPageSpinner`, `Outlet`. Usato da `App.tsx` come layout di `/admin`.

### `src/features/admin/servicesAdmin.ts`
- **Cosa fa**: `useAdminServices` (tutti, incl. disattivati), `useSaveService` (insert/update), `useDeleteService` (gestione FK 23503). Tipo `ServiceInput`.
- **Tabelle**: `services`. Invalida `['services']`.
- **Comunica con**: usato da `AdminServicesPage` e `ServiceForm`.

### `src/features/admin/productsAdmin.ts`
- **Cosa fa**: `useAdminProducts`, `useSaveProduct`, `useDeleteProduct`. Tipo `ProductInput`.
- **Tabelle**: `products`. Invalida `['products']`.
- **Comunica con**: `AdminProductsPage`, `ProductForm`.

### `src/features/admin/slidesAdmin.ts`
- **Cosa fa**: `useAdminSlides`, `useCreateSlide`, `useUpdateSlide`, `useDeleteSlide`, `useSwapSlideOrder` (scambio `sort_order`). Tipo `SlideInput`.
- **Tabelle**: `home_slides`. Invalida `['home_slides']`.
- **Comunica con**: `AdminSlidesPage`, `SlideForm`.

### `src/features/admin/settingsAdmin.ts`
- **Cosa fa**: `useUpdateSettings(patch)` (update riga singola). Tipo `SettingsPatch` (brand, regole slot, contatti, about, social).
- **Tabelle**: `settings`. Invalida `['settings']`.
- **Comunica con**: `AdminSettingsPage`, `AdminAboutPage`.

### `src/features/admin/locationsAdmin.ts`
- **Cosa fa**: `useAdminLocations` (tutte), `useSaveLocation`, `useDeleteLocation` (FK 23503). Tipo `LocationInput`.
- **Tabelle**: `locations`. Invalida `['locations']`, `['staff']`, `['availability']`.
- **Comunica con**: `AdminLocationsPage`, `LocationForm`, `LocationSelect`, `StaffForm`/`AdminStaffPage`, `AdminHoursPage`, `AdminAgendaPage`.

### `src/features/admin/staffAdmin.ts`
- **Cosa fa**: `useAdminStaff` (tutti), `useSaveStaff`, `useDeleteStaff` (FK 23503). Tipo `StaffInput`.
- **Tabelle**: `staff`. Invalida `['staff']`, `['availability']`.
- **Comunica con**: `AdminStaffPage`, `StaffForm`.

### `src/features/admin/hoursAdmin.ts`
- **Cosa fa**: orari + chiusure. `useAdminHours(locationId)`, `useCreateHour` (default sede se assente), `useUpdateHour`, `useDeleteHour`; `useAdminClosures`, `useCreateClosure`, `useDeleteClosure`. Helper `defaultLocationId`. Tipi `HourInput`, `ClosureInput`.
- **Tabelle**: `business_hours`, `closures`, (read `locations`). Invalida `['business_hours']`/`['closures']` + `['availability']`.
- **Comunica con**: `AdminHoursPage`.
- **Note fix**: `useCreateHour` se non riceve `location_id` usa la prima sede (compatibilità). Le chiusure con `location_id=null` = tutte le sedi.

### `src/features/admin/bookingsAdmin.ts`
- **Cosa fa**: `useAdminBookings` (tutte, ordinate), `useRescheduleBooking` (**RPC `reschedule_booking`**, orario e/o operatore), `useUpdateBookingStatus` (UPDATE `bookings.status`).
- **Tabelle/RPC**: `bookings`, RPC `reschedule_booking`. Invalida `['admin-bookings']`, `['availability']`, `['my-bookings']`.
- **Comunica con**: `AdminBookingsPage`, `AdminAgendaPage`, `RescheduleDialog`.
- **Note fix**: lo spostamento passa dalla RPC (ri-valida orari/chiusure/anti-overlap dell'operatore, admin-only).

### `src/features/admin/ServiceForm.tsx`
- **Cosa fa**: form servizio/pacchetto (toggle "è un pacchetto", descrizione breve/estesa, **immagine**, durata, prezzo €, ordine, attivo).
- **Props**: `service?: Service`, `onDone()`.
- **Comunica con**: `useSaveService`, `ImageUpload` (`services/`), `Input`/`Textarea`/`Button`, `react-hook-form`+`zod`. Stato via `watch` (is_package, image_url).
- **Note fix**: prezzo in € → salvato in centesimi (`* 100`).

### `src/features/admin/ProductForm.tsx`
- **Cosa fa**: form prodotto (immagine `square`, nome, descrizione, prezzo €, categoria, ordine, attivo).
- **Props**: `product?: Product`, `onDone()`.
- **Comunica con**: `useSaveProduct`, `ImageUpload` (`products/`), `react-hook-form`+`zod`.

### `src/features/admin/SlideForm.tsx`
- **Cosa fa**: form slide (immagine **obbligatoria**, titolo/sottotitolo opzionali). Crea (con `nextOrder`) o aggiorna.
- **Props**: `slide?: HomeSlide`, `nextOrder: number`, `onDone()`.
- **Comunica con**: `useCreateSlide`/`useUpdateSlide`, `ImageUpload` (`slides/`), `Input`/`Button`. Stato locale controllato (`imageUrl`/`title`/`subtitle`).

### `src/features/admin/LocationForm.tsx`
- **Cosa fa**: form sede (nome, indirizzo, telefono, **fuso**, ordine, attiva).
- **Props**: `location?: Location`, `onDone()`.
- **Comunica con**: `useSaveLocation`, `Input`/`Select`/`Button`, `react-hook-form`+`zod`. Lista `TIMEZONES`.

### `src/features/admin/StaffForm.tsx`
- **Cosa fa**: form operatore (nome, **sede** via select, ordine, attivo).
- **Props**: `staff?: Staff`, `locations: Location[]`, `onDone()`.
- **Comunica con**: `useSaveStaff`, `Input`/`Select`/`Button`, `react-hook-form`+`zod`.
- **Note fix**: `locations` passate dalla pagina (`AdminStaffPage`).

---

## 22. features/admin/agenda/

### `src/features/admin/agenda/AgendaToolbar.tsx`
- **Cosa fa**: barra agenda: switch viste (Giorno/Settimana/Mese) + navigazione (‹ Oggi ›) + titolo periodo. Tipo `AgendaView`.
- **Props**: `view`, `onViewChange`, `title`, `onPrev`, `onNext`, `onToday`.
- **Comunica con**: `Button`. Usato da `AdminAgendaPage`.

### `src/features/admin/agenda/AgendaMonth.tsx`
- **Cosa fa**: vista **mese** dell'agenda admin (griglia 7×N, badge conteggio appuntamenti per giorno, oggi evidenziato). Click giorno → vista Giorno.
- **Props**: `cursor: Date`, `byDay: Map<string, Booking[]>`, `todayKey`, `onSelectDate(d)`.
- **Comunica con**: `date-fns`, `dateKey`, `Card`. Usato da `AdminAgendaPage`.
- **Note fix**: include i giorni dei mesi adiacenti (a differenza del calendario cliente).

### `src/features/admin/agenda/AgendaWeek.tsx`
- **Cosa fa**: vista **settimana**: desktop = 7 colonne con chip appuntamento; mobile = elenco per giorno. Click → vista Giorno.
- **Props**: `cursor`, `byDay`, `todayKey`, `timezone`, `onSelectDate(d)`.
- **Comunica con**: `date-fns`, `dateKey`/`formatSlotTime`, `Card`. Sottocomponente `WeekChip` (mostra orario, servizio, nome cliente — **vista admin**, dati visibili all'admin).
- **Note fix**: `byDay` è già nel fuso sede (calcolato in `AdminAgendaPage`).

### `src/features/admin/agenda/AgendaDay.tsx`
- **Cosa fa**: vista **giorno**: timeline appuntamenti con orario, stato (badge), **operatore**, cliente, contatti (mailto/tel), note, e azioni **Sposta**/**Cancella** (solo `confirmed`).
- **Props**: `bookings: Booking[]`, `timezone`, `onReschedule?(b)`, `onCancel?(b)`.
- **Comunica con**: `STATUS_META`, `formatSlotTime`, `Card`/`Badge`/`Button`/`EmptyState`. Usato da `AdminAgendaPage`.
- **Note fix**: questa è **vista admin**, quindi mostra i dati cliente (a differenza del popup cliente `DayScheduleDialog`).

### `src/features/admin/agenda/RescheduleDialog.tsx`
- **Cosa fa**: dialog di **spostamento** appuntamento: scelta nuovo **operatore** (Select) + nuovo giorno (`DaySelector`) + nuovo orario (`SlotPicker`, con `excludeBookingId` e sede/operatore del booking); conferma → `reschedule_booking`.
- **Props**: `booking: Booking|null`, `onClose()`.
- **Comunica con**: `useSettings`/`useLocations` (fuso sede del booking), `useStaff` (operatori della sede), `useRescheduleBooking` (RPC), `DaySelector`/`SlotPicker`, `Dialog`/`Select`/`Button`, `dateUtils`. Stato: `date`, `slot`, `staffId`. Usato da `AdminAgendaPage`.
- **Note fix**: il fuso/orari sono quelli della **sede del booking**. Lo slot picker usa `locationId`+`staffId` del booking ed esclude l'appuntamento stesso.

---

## Riepilogo copertura

Totale file in `src/` documentati: **101** (tutti i `.ts`/`.tsx`/`.css`).
Suddivisione: 5 avvio/config · 4 lib · 1 theme · 2 types · 2 context · 10 components/ui · 5 components/layout · 3 routes(infra) · 9 routes/pages(cliente) · 11 routes/pages/admin · 2 auth · 4 settings · 4 services · 2 products · 2 home · 2 locations · 1 staff · 1 storage · 2 stats · 11 booking · 12 admin(data/form/layout) · 4 admin/agenda · (`index.css`, `vite-env.d.ts` inclusi in §1).

Nessun file è stato omesso.
