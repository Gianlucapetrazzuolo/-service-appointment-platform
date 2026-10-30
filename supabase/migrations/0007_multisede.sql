-- =============================================================================
-- 0007_multisede.sql — Multi-sede + Multi-operatore
--   • Tabelle locations (sedi) e staff (operatori, risorse senza login)
--   • Colonne location_id su business_hours/closures, location_id+staff_id+snapshot
--     su bookings
--   • Anti-sovrapposizione PER OPERATORE
--   • Motore slot per-sede/per-operatore; create/reschedule/stats aggiornati
--   • Backfill: sede + operatore di default per i dati esistenti (zero rotture)
-- Eseguire dopo 0006_agenda.sql. Idempotente dove possibile.
-- =============================================================================

-- 1) LOCATIONS (sedi) ---------------------------------------------------------
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  timezone    text not null default 'Europe/Rome',
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists locations_active_sort_idx on public.locations (is_active, sort_order);
drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

-- 2) STAFF (operatori, risorse senza login) ----------------------------------
create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  full_name   text not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists staff_location_idx on public.staff (location_id, is_active, sort_order);
drop trigger if exists staff_set_updated_at on public.staff;
create trigger staff_set_updated_at before update on public.staff
  for each row execute function public.set_updated_at();

-- 3) RLS per locations e staff (lettura pubblica se attivo; scrittura admin) --
alter table public.locations enable row level security;
alter table public.staff     enable row level security;

drop policy if exists locations_public_read on public.locations;
create policy locations_public_read on public.locations
  for select using (is_active or public.is_admin());
drop policy if exists locations_admin_write on public.locations;
create policy locations_admin_write on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists staff_public_read on public.staff;
create policy staff_public_read on public.staff
  for select using (is_active or public.is_admin());
drop policy if exists staff_admin_write on public.staff;
create policy staff_admin_write on public.staff
  for all using (public.is_admin()) with check (public.is_admin());

-- 4) BACKFILL: sede + operatore di default -----------------------------------
insert into public.locations (name, timezone, sort_order)
select coalesce(nullif(s.business_name, ''), 'Sede principale'), s.timezone, 0
from public.settings s
where s.id = true and not exists (select 1 from public.locations);

insert into public.staff (location_id, full_name, sort_order)
select (select id from public.locations order by sort_order, created_at limit 1), 'Operatore', 0
where not exists (select 1 from public.staff)
  and exists (select 1 from public.locations);

-- 5) business_hours → per-sede -----------------------------------------------
alter table public.business_hours
  add column if not exists location_id uuid references public.locations(id) on delete cascade;
update public.business_hours
  set location_id = (select id from public.locations order by sort_order, created_at limit 1)
  where location_id is null;
alter table public.business_hours alter column location_id set not null;
create index if not exists business_hours_loc_weekday_idx on public.business_hours (location_id, weekday);

-- 6) closures → location opzionale (null = tutte le sedi) --------------------
alter table public.closures
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

-- 7) bookings → sede + operatore + snapshot ----------------------------------
alter table public.bookings add column if not exists location_id   uuid references public.locations(id);
alter table public.bookings add column if not exists staff_id      uuid references public.staff(id);
alter table public.bookings add column if not exists location_name text;
alter table public.bookings add column if not exists staff_name    text;

update public.bookings set
  location_id = coalesce(location_id, (select id from public.locations order by sort_order, created_at limit 1)),
  staff_id    = coalesce(staff_id,    (select id from public.staff order by sort_order, created_at limit 1))
where location_id is null or staff_id is null;

update public.bookings b set location_name = l.name
  from public.locations l where l.id = b.location_id and b.location_name is null;
update public.bookings b set staff_name = s.full_name
  from public.staff s where s.id = b.staff_id and b.staff_name is null;

alter table public.bookings alter column location_id set not null;
alter table public.bookings alter column staff_id set not null;
alter table public.bookings alter column location_name set not null;
alter table public.bookings alter column staff_name set not null;

create index if not exists bookings_staff_idx on public.bookings (staff_id, starts_at);
create index if not exists bookings_location_idx on public.bookings (location_id, starts_at);

-- 8) Anti-sovrapposizione PER OPERATORE --------------------------------------
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings drop constraint if exists bookings_no_overlap_staff;
alter table public.bookings add constraint bookings_no_overlap_staff
  exclude using gist (staff_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status <> 'cancelled');

-- 9) RPC: rimozione vecchie firme + nuove ------------------------------------
drop function if exists public.get_available_slots(uuid, date);
drop function if exists public.get_available_slots(uuid, date, uuid);
drop function if exists public.create_booking(uuid, timestamptz, text, text, text, text);
drop function if exists public.reschedule_booking(uuid, timestamptz);
drop function if exists public.get_admin_stats();

-- get_available_slots: per-sede e per-operatore ------------------------------
-- p_location_id null → sede di default (transizione). p_staff_id null → "qualsiasi
-- operatore" (slot libero se almeno un operatore della sede è libero).
create function public.get_available_slots(
  p_service_id         uuid,
  p_date               date,
  p_location_id        uuid default null,
  p_staff_id           uuid default null,
  p_exclude_booking_id uuid default null
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_loc         uuid;
  v_tz          text;
  v_step        int;
  v_min_notice  int;
  v_max_advance int;
  v_duration    int;
  v_dur         interval;
  v_earliest    timestamptz;
  v_today_local date;
  v_dow         int;
  v_staff_count int;
  b             record;
  v_open        timestamptz;
  v_close       timestamptz;
  v_slot        timestamptz;
  v_busy        int;
  v_ok          boolean;
begin
  v_loc := p_location_id;
  if v_loc is null then
    select id into v_loc from locations where is_active order by sort_order, created_at limit 1;
  end if;
  if v_loc is null then return; end if;

  select timezone into v_tz from locations where id = v_loc;
  select slot_step_min, min_notice_min, max_advance_days
    into v_step, v_min_notice, v_max_advance
  from settings where id = true;

  select duration_min into v_duration from services where id = p_service_id and is_active = true;
  if v_duration is null then return; end if;
  v_dur := make_interval(mins => v_duration);

  v_staff_count := (select count(*) from staff where location_id = v_loc and is_active);
  if p_staff_id is null and v_staff_count = 0 then return; end if;

  v_today_local := (now() at time zone v_tz)::date;
  v_earliest := now() + make_interval(mins => v_min_notice);
  if p_date < v_today_local or p_date > v_today_local + v_max_advance then return; end if;

  v_dow := extract(dow from p_date)::int;

  for b in
    select open_time, close_time from business_hours
    where location_id = v_loc and weekday = v_dow order by open_time
  loop
    v_open  := (p_date + b.open_time)  at time zone v_tz;
    v_close := (p_date + b.close_time) at time zone v_tz;

    v_slot := v_open;
    while v_slot + v_dur <= v_close loop
      v_ok := v_slot >= v_earliest
        and not exists (
          select 1 from closures c
          where (c.location_id is null or c.location_id = v_loc)
            and tstzrange(c.starts_at, c.ends_at) && tstzrange(v_slot, v_slot + v_dur)
        );

      if v_ok then
        if p_staff_id is not null then
          v_ok := not exists (
            select 1 from bookings bk
            where bk.staff_id = p_staff_id
              and bk.status <> 'cancelled'
              and bk.id is distinct from p_exclude_booking_id
              and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(v_slot, v_slot + v_dur)
          );
        else
          v_busy := (
            select count(distinct bk.staff_id) from bookings bk
            where bk.location_id = v_loc
              and bk.status <> 'cancelled'
              and bk.id is distinct from p_exclude_booking_id
              and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(v_slot, v_slot + v_dur)
          );
          v_ok := v_busy < v_staff_count;
        end if;
      end if;

      if v_ok then return next v_slot; end if;
      v_slot := v_slot + make_interval(mins => v_step);
    end loop;
  end loop;

  return;
end;
$$;

grant execute on function public.get_available_slots(uuid, date, uuid, uuid, uuid) to anon, authenticated;

-- create_booking: valida per-sede e assegna l'operatore ----------------------
create function public.create_booking(
  p_service_id     uuid,
  p_starts_at      timestamptz,
  p_customer_name  text,
  p_customer_email text,
  p_location_id    uuid default null,
  p_staff_id       uuid default null,
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
  v_loc          uuid;
  v_loc_name     text;
  v_staff        uuid;
  v_staff_name   text;
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

  v_loc := p_location_id;
  if v_loc is null then
    select id into v_loc from locations where is_active order by sort_order, created_at limit 1;
  end if;
  select name, timezone into v_loc_name, v_tz from locations where id = v_loc and is_active;
  if v_loc_name is null then
    raise exception 'Sede non disponibile.' using errcode = 'P0002';
  end if;

  select name, duration_min, price_cents into v_service_name, v_duration, v_price
  from services where id = p_service_id and is_active = true;
  if v_duration is null then
    raise exception 'Servizio non disponibile.' using errcode = 'P0002';
  end if;
  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  select min_notice_min, max_advance_days into v_min_notice, v_max_advance
  from settings where id = true;
  if p_starts_at < now() + make_interval(mins => v_min_notice) then
    raise exception 'Lo slot scelto è troppo vicino o nel passato.' using errcode = 'P0001';
  end if;
  if p_starts_at > now() + make_interval(days => v_max_advance) then
    raise exception 'Lo slot scelto è troppo lontano nel tempo.' using errcode = 'P0001';
  end if;

  -- entro una fascia di apertura della sede
  v_local_date := (p_starts_at at time zone v_tz)::date;
  v_dow := extract(dow from v_local_date)::int;
  for b in
    select open_time, close_time from business_hours where location_id = v_loc and weekday = v_dow
  loop
    v_open  := (v_local_date + b.open_time)  at time zone v_tz;
    v_close := (v_local_date + b.close_time) at time zone v_tz;
    if p_starts_at >= v_open and v_ends_at <= v_close then v_valid := true; end if;
  end loop;
  if not v_valid then
    raise exception 'Orario fuori dagli orari di apertura.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from closures c
    where (c.location_id is null or c.location_id = v_loc)
      and tstzrange(c.starts_at, c.ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'Attività chiusa in questo orario.' using errcode = 'P0001';
  end if;

  -- operatore: dato (verifica) oppure auto (meno carico) -----------------------
  if p_staff_id is not null then
    select id, full_name into v_staff, v_staff_name
    from staff where id = p_staff_id and location_id = v_loc and is_active;
    if v_staff is null then
      raise exception 'Operatore non valido per questa sede.' using errcode = 'P0002';
    end if;
    if exists (
      select 1 from bookings bk
      where bk.staff_id = v_staff and bk.status <> 'cancelled'
        and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(p_starts_at, v_ends_at)
    ) then
      raise exception 'L''operatore è già occupato in questo orario.' using errcode = 'P0001';
    end if;
  else
    select s.id, s.full_name into v_staff, v_staff_name
    from staff s
    where s.location_id = v_loc and s.is_active
      and not exists (
        select 1 from bookings bk
        where bk.staff_id = s.id and bk.status <> 'cancelled'
          and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(p_starts_at, v_ends_at)
      )
    order by (
      select count(*) from bookings b2
      where b2.staff_id = s.id and b2.status <> 'cancelled'
        and (b2.starts_at at time zone v_tz)::date = v_local_date
    ) asc, s.sort_order asc
    limit 1;
    if v_staff is null then
      raise exception 'Nessun operatore disponibile in questo orario.' using errcode = 'P0001';
    end if;
  end if;

  insert into bookings (
    service_id, customer_id, location_id, staff_id, starts_at, ends_at, status,
    service_name, location_name, staff_name, price_cents,
    customer_name, customer_email, customer_phone, notes
  ) values (
    p_service_id, v_uid, v_loc, v_staff, p_starts_at, v_ends_at, 'confirmed',
    v_service_name, v_loc_name, v_staff_name, coalesce(v_price, 0),
    p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'L''operatore è appena stato occupato. Scegli un altro orario.' using errcode = 'P0001';
end;
$$;

grant execute on function public.create_booking(uuid, timestamptz, text, text, uuid, uuid, text, text)
  to authenticated;

-- reschedule_booking: nuovo orario e/o nuovo operatore (admin-only) ----------
create function public.reschedule_booking(
  p_booking_id    uuid,
  p_new_starts_at timestamptz,
  p_new_staff_id  uuid default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loc        uuid;
  v_service_id uuid;
  v_status     public.booking_status;
  v_duration   int;
  v_new_ends   timestamptz;
  v_tz         text;
  v_staff      uuid;
  v_staff_name text;
  v_local_date date;
  v_dow        int;
  v_valid      boolean := false;
  b            record;
  v_open       timestamptz;
  v_close      timestamptz;
  v_row        public.bookings;
begin
  if not public.is_admin() then
    raise exception 'Non autorizzato' using errcode = '42501';
  end if;

  select location_id, service_id, status, staff_id
    into v_loc, v_service_id, v_status, v_staff
  from bookings where id = p_booking_id;
  if v_service_id is null then
    raise exception 'Prenotazione non trovata.' using errcode = 'P0002';
  end if;
  if v_status <> 'confirmed' then
    raise exception 'Solo le prenotazioni confermate possono essere spostate.' using errcode = 'P0001';
  end if;

  select duration_min into v_duration from services where id = v_service_id;
  v_new_ends := p_new_starts_at + make_interval(mins => v_duration);
  select timezone into v_tz from locations where id = v_loc;

  -- operatore target (nuovo o invariato), deve appartenere alla sede ed essere attivo
  if p_new_staff_id is not null then v_staff := p_new_staff_id; end if;
  select full_name into v_staff_name from staff where id = v_staff and location_id = v_loc and is_active;
  if v_staff_name is null then
    raise exception 'Operatore non valido per questa sede.' using errcode = 'P0002';
  end if;

  v_local_date := (p_new_starts_at at time zone v_tz)::date;
  v_dow := extract(dow from v_local_date)::int;
  for b in
    select open_time, close_time from business_hours where location_id = v_loc and weekday = v_dow
  loop
    v_open  := (v_local_date + b.open_time)  at time zone v_tz;
    v_close := (v_local_date + b.close_time) at time zone v_tz;
    if p_new_starts_at >= v_open and v_new_ends <= v_close then v_valid := true; end if;
  end loop;
  if not v_valid then
    raise exception 'Orario fuori dagli orari di apertura.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from closures c
    where (c.location_id is null or c.location_id = v_loc)
      and tstzrange(c.starts_at, c.ends_at) && tstzrange(p_new_starts_at, v_new_ends)
  ) then
    raise exception 'Attività chiusa in questo orario.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from bookings bk
    where bk.id <> p_booking_id and bk.staff_id = v_staff and bk.status <> 'cancelled'
      and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(p_new_starts_at, v_new_ends)
  ) then
    raise exception 'L''operatore ha già un appuntamento in questo orario.' using errcode = 'P0001';
  end if;

  update bookings
     set starts_at = p_new_starts_at, ends_at = v_new_ends,
         staff_id = v_staff, staff_name = v_staff_name
   where id = p_booking_id
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'L''operatore è appena stato occupato. Scegli un altro orario.' using errcode = 'P0001';
end;
$$;

grant execute on function public.reschedule_booking(uuid, timestamptz, uuid) to authenticated;

-- get_admin_stats: filtro opzionale per sede ---------------------------------
create function public.get_admin_stats(p_location_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz       text;
  v_clients  int;
  v_total    int;
  v_revenue  bigint;
  v_by_month jsonb;
begin
  if not public.is_admin() then
    raise exception 'Non autorizzato' using errcode = '42501';
  end if;

  select timezone into v_tz from settings where id = true;
  select count(*) into v_clients from profiles where role = 'client';
  select count(*), coalesce(sum(price_cents), 0)
    into v_total, v_revenue
  from bookings
  where status in ('confirmed', 'completed')
    and (p_location_id is null or location_id = p_location_id);

  with months as (
    select (date_trunc('month', (now() at time zone v_tz)) - make_interval(months => g))::date as m
    from generate_series(0, 11) g
  ),
  agg as (
    select date_trunc('month', (starts_at at time zone v_tz))::date as m,
           count(*) as c, coalesce(sum(price_cents), 0) as rev
    from bookings
    where status in ('confirmed', 'completed')
      and (p_location_id is null or location_id = p_location_id)
    group by 1
  )
  select jsonb_agg(
           jsonb_build_object('month', to_char(months.m, 'YYYY-MM'),
                              'count', coalesce(agg.c, 0),
                              'revenue_cents', coalesce(agg.rev, 0)) order by months.m
         )
    into v_by_month
  from months left join agg on agg.m = months.m;

  return jsonb_build_object(
    'total_clients', v_clients,
    'total_bookings', v_total,
    'revenue_cents', v_revenue,
    'by_month', coalesce(v_by_month, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_admin_stats(uuid) to authenticated;
