-- =============================================================================
-- 0001_init.sql — Schema base (tabelle, vincoli, trigger)
-- Eseguire per primo nello SQL Editor di Supabase.
-- Convenzione giorni settimana: 0 = Domenica ... 6 = Sabato (come JS Date.getDay()).
-- =============================================================================

-- Estensioni -----------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists btree_gist;    -- vincolo di esclusione anti-overlap

-- Tipi enumerati -------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('confirmed', 'cancelled', 'completed', 'no_show');
exception when duplicate_object then null; end $$;

-- Funzione trigger: aggiorna updated_at -------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles (1-a-1 con auth.users) -------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now()
);

-- Crea automaticamente il profilo alla registrazione di un utente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- services (catalogo) --------------------------------------------------------
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  duration_min int  not null check (duration_min > 0 and duration_min <= 600),
  price_cents  int  not null default 0 check (price_cents >= 0),
  is_active    boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists services_active_sort_idx on public.services (is_active, sort_order);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- business_hours (orari settimanali ricorrenti, più fasce per giorno) --------
create table if not exists public.business_hours (
  id         uuid primary key default gen_random_uuid(),
  weekday    int  not null check (weekday between 0 and 6),
  open_time  time not null,
  close_time time not null,
  check (open_time < close_time)
);
create index if not exists business_hours_weekday_idx on public.business_hours (weekday);

-- closures (chiusure straordinarie / ferie / blocchi) ------------------------
create table if not exists public.closures (
  id        uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  reason    text,
  check (starts_at < ends_at)
);

-- settings (riga singola: configurazione attività + brand) -------------------
create table if not exists public.settings (
  id               boolean primary key default true,
  business_name    text not null default 'La mia attività',
  slug             text,
  timezone         text not null default 'Europe/Rome',
  slot_step_min    int  not null default 15 check (slot_step_min between 5 and 120),
  min_notice_min   int  not null default 120 check (min_notice_min >= 0),
  max_advance_days int  not null default 60 check (max_advance_days between 1 and 365),
  logo_url         text,
  theme            jsonb not null default '{}'::jsonb,
  updated_at       timestamptz not null default now(),
  constraint settings_singleton check (id)  -- forza un'unica riga (id = true)
);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id) values (true) on conflict (id) do nothing;

-- bookings (prenotazioni — risorsa unica) ------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  service_id     uuid not null references public.services(id) on delete restrict,
  customer_id    uuid not null references public.profiles(id) on delete cascade,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         public.booking_status not null default 'confirmed',
  service_name   text not null,            -- snapshot storico (immutabile)
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  notes          text,
  created_at     timestamptz not null default now(),
  check (starts_at < ends_at)
);
create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
create index if not exists bookings_customer_idx on public.bookings (customer_id, starts_at desc);

-- Anti-sovrapposizione a livello DB: due prenotazioni non cancellate non
-- possono occupare intervalli che si intersecano (garanzia race-safe).
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
  where (status <> 'cancelled');
