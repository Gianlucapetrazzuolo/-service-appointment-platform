-- =============================================================================
-- 0002_rls.sql — Row Level Security e policy
-- Eseguire dopo 0001_init.sql.
--
-- Principio: i clienti vedono SOLO le proprie prenotazioni. La disponibilità
-- degli slot non passa mai da una SELECT su bookings, ma dalla funzione
-- get_available_slots (0003) che restituisce solo orari liberi, senza PII.
-- =============================================================================

-- Helper: l'utente corrente è admin?
-- SECURITY DEFINER così la lettura di profiles non innesca ricorsione di RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Abilita RLS su tutte le tabelle -------------------------------------------
alter table public.profiles       enable row level security;
alter table public.services       enable row level security;
alter table public.business_hours enable row level security;
alter table public.closures       enable row level security;
alter table public.settings       enable row level security;
alter table public.bookings       enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- services: lettura pubblica dei servizi attivi; scrittura solo admin --------
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select using (is_active or public.is_admin());

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- business_hours: lettura pubblica; scrittura solo admin ---------------------
drop policy if exists hours_public_read on public.business_hours;
create policy hours_public_read on public.business_hours
  for select using (true);

drop policy if exists hours_admin_write on public.business_hours;
create policy hours_admin_write on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());

-- closures: lettura pubblica (serve al calcolo slot); scrittura solo admin ---
drop policy if exists closures_public_read on public.closures;
create policy closures_public_read on public.closures
  for select using (true);

drop policy if exists closures_admin_write on public.closures;
create policy closures_admin_write on public.closures
  for all using (public.is_admin()) with check (public.is_admin());

-- settings: lettura pubblica (brand/orari); aggiornamento solo admin ---------
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (true);

drop policy if exists settings_admin_update on public.settings;
create policy settings_admin_update on public.settings
  for update using (public.is_admin()) with check (public.is_admin());

-- bookings: il cliente vede solo le proprie; nessun INSERT/UPDATE diretto
-- (la creazione passa dalla RPC create_booking, l'annullamento da cancel_booking).
-- L'admin può tutto.
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());
