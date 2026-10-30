-- =============================================================================
-- 0005_v2.sql — Nuove funzionalità v2
--   • Pacchetti (estensione di services)
--   • Prodotti (vetrina, non acquistabili)
--   • Slide carosello home
--   • Contenuti "Chi siamo" + contatti (su settings)
--   • Snapshot prezzo sulle prenotazioni + statistiche admin
--   • Storage bucket immagini + policy
-- Eseguire dopo 0004. Idempotente dove possibile.
-- =============================================================================

-- 1) SERVICES → supporto pacchetti -------------------------------------------
alter table public.services add column if not exists is_package boolean not null default false;
alter table public.services add column if not exists description_long text;
alter table public.services add column if not exists image_url text;
create index if not exists services_package_idx on public.services (is_package, is_active, sort_order);

-- 2) PRODUCTS → listino vetrina ----------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price_cents int  not null default 0 check (price_cents >= 0),
  image_url   text,
  category    text,
  is_active   boolean not null default true,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists products_active_sort_idx on public.products (is_active, sort_order);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 3) HOME_SLIDES → carosello --------------------------------------------------
create table if not exists public.home_slides (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  title      text,
  subtitle   text,
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists home_slides_active_sort_idx on public.home_slides (is_active, sort_order);

-- 4) SETTINGS → contenuti "Chi siamo" + contatti -----------------------------
alter table public.settings add column if not exists address text;
alter table public.settings add column if not exists phone text;
alter table public.settings add column if not exists email text;
alter table public.settings add column if not exists about_description text;
alter table public.settings add column if not exists about_history text;
alter table public.settings add column if not exists socials jsonb not null default '{}'::jsonb;

-- 5) BOOKINGS → snapshot prezzo ----------------------------------------------
alter table public.bookings add column if not exists price_cents int not null default 0;
update public.bookings b
   set price_cents = s.price_cents
  from public.services s
 where s.id = b.service_id and b.price_cents = 0;

-- create_booking aggiornata: salva anche lo snapshot del prezzo --------------
create or replace function public.create_booking(
  p_service_id     uuid,
  p_starts_at      timestamptz,
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text default null,
  p_notes          text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_duration     int;
  v_service_name text;
  v_price        int;
  v_ends_at      timestamptz;
  v_tz           text;
  v_min_notice   int;
  v_max_advance  int;
  v_local_date   date;
  v_dow          int;
  v_valid        boolean := false;
  b              record;
  v_open         timestamptz;
  v_close        timestamptz;
  v_row          public.bookings;
begin
  if v_uid is null then
    raise exception 'Devi effettuare l''accesso per prenotare.' using errcode = '28000';
  end if;

  select name, duration_min, price_cents
    into v_service_name, v_duration, v_price
  from services where id = p_service_id and is_active = true;
  if v_duration is null then
    raise exception 'Servizio non disponibile.' using errcode = 'P0002';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  select timezone, min_notice_min, max_advance_days
    into v_tz, v_min_notice, v_max_advance
  from settings where id = true;

  if p_starts_at < now() + make_interval(mins => v_min_notice) then
    raise exception 'Lo slot scelto è troppo vicino o nel passato.' using errcode = 'P0001';
  end if;
  if p_starts_at > now() + make_interval(days => v_max_advance) then
    raise exception 'Lo slot scelto è troppo lontano nel tempo.' using errcode = 'P0001';
  end if;

  v_local_date := (p_starts_at at time zone v_tz)::date;
  v_dow := extract(dow from v_local_date)::int;
  for b in
    select open_time, close_time from business_hours where weekday = v_dow
  loop
    v_open  := (v_local_date + b.open_time)  at time zone v_tz;
    v_close := (v_local_date + b.close_time) at time zone v_tz;
    if p_starts_at >= v_open and v_ends_at <= v_close then
      v_valid := true;
    end if;
  end loop;
  if not v_valid then
    raise exception 'Orario fuori dagli orari di apertura.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from closures c
    where tstzrange(c.starts_at, c.ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'Attività chiusa in questo orario.' using errcode = 'P0001';
  end if;

  insert into bookings (
    service_id, customer_id, starts_at, ends_at, status,
    service_name, price_cents, customer_name, customer_email, customer_phone, notes
  ) values (
    p_service_id, v_uid, p_starts_at, v_ends_at, 'confirmed',
    v_service_name, coalesce(v_price, 0), p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'Questo slot è appena stato prenotato. Scegline un altro.'
      using errcode = 'P0001';
end;
$$;

-- 6) RLS per le nuove tabelle (clienti sola lettura) -------------------------
alter table public.products    enable row level security;
alter table public.home_slides enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_active or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists slides_public_read on public.home_slides;
create policy slides_public_read on public.home_slides
  for select using (is_active or public.is_admin());
drop policy if exists slides_admin_write on public.home_slides;
create policy slides_admin_write on public.home_slides
  for all using (public.is_admin()) with check (public.is_admin());

-- 7) RPC statistiche (aggregati, solo admin) ---------------------------------
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz      text;
  v_clients int;
  v_total   int;
  v_revenue bigint;
  v_by_month jsonb;
begin
  if not public.is_admin() then
    raise exception 'Non autorizzato' using errcode = '42501';
  end if;

  select timezone into v_tz from settings where id = true;
  select count(*) into v_clients from profiles where role = 'client';
  select count(*), coalesce(sum(price_cents), 0)
    into v_total, v_revenue
  from bookings where status in ('confirmed', 'completed');

  with months as (
    select (date_trunc('month', (now() at time zone v_tz)) - make_interval(months => g))::date as m
    from generate_series(0, 11) g
  ),
  agg as (
    select date_trunc('month', (starts_at at time zone v_tz))::date as m,
           count(*) as c,
           coalesce(sum(price_cents), 0) as rev
    from bookings
    where status in ('confirmed', 'completed')
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object(
             'month', to_char(months.m, 'YYYY-MM'),
             'count', coalesce(agg.c, 0),
             'revenue_cents', coalesce(agg.rev, 0)
           ) order by months.m
         )
    into v_by_month
  from months
  left join agg on agg.m = months.m;

  return jsonb_build_object(
    'total_clients', v_clients,
    'total_bookings', v_total,
    'revenue_cents', v_revenue,
    'by_month', coalesce(v_by_month, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_admin_stats() to authenticated;

-- 8) STORAGE: bucket immagini + policy ---------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
