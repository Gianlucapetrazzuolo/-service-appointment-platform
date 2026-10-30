-- =============================================================================
-- 0006_agenda.sql — Agenda gestionale admin
--   • get_available_slots: parametro opzionale per escludere un appuntamento
--     (necessario allo spostamento, così il suo orario attuale non risulta
--     occupato da sé stesso)
--   • reschedule_booking: sposta un appuntamento (admin-only, ri-valida tutto)
-- Eseguire dopo 0005_v2.sql.
-- =============================================================================

-- 1) get_available_slots con esclusione di un booking ------------------------
drop function if exists public.get_available_slots(uuid, date);

create function public.get_available_slots(
  p_service_id uuid,
  p_date date,
  p_exclude_booking_id uuid default null
)
returns setof timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz          text;
  v_step        int;
  v_min_notice  int;
  v_max_advance int;
  v_duration    int;
  v_dur         interval;
  v_earliest    timestamptz;
  v_today_local date;
  v_dow         int;
  b             record;
  v_open        timestamptz;
  v_close       timestamptz;
  v_slot        timestamptz;
begin
  select timezone, slot_step_min, min_notice_min, max_advance_days
    into v_tz, v_step, v_min_notice, v_max_advance
  from settings where id = true;

  select duration_min into v_duration
  from services where id = p_service_id and is_active = true;
  if v_duration is null then
    return;
  end if;
  v_dur := make_interval(mins => v_duration);

  v_today_local := (now() at time zone v_tz)::date;
  v_earliest := now() + make_interval(mins => v_min_notice);

  if p_date < v_today_local or p_date > v_today_local + v_max_advance then
    return;
  end if;

  v_dow := extract(dow from p_date)::int;

  for b in
    select open_time, close_time
    from business_hours
    where weekday = v_dow
    order by open_time
  loop
    v_open  := (p_date + b.open_time)  at time zone v_tz;
    v_close := (p_date + b.close_time) at time zone v_tz;

    v_slot := v_open;
    while v_slot + v_dur <= v_close loop
      if v_slot >= v_earliest
         and not exists (
           select 1 from bookings bk
           where bk.status <> 'cancelled'
             and bk.id is distinct from p_exclude_booking_id   -- esclude sé stesso
             and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(v_slot, v_slot + v_dur)
         )
         and not exists (
           select 1 from closures c
           where tstzrange(c.starts_at, c.ends_at) && tstzrange(v_slot, v_slot + v_dur)
         )
      then
        return next v_slot;
      end if;
      v_slot := v_slot + make_interval(mins => v_step);
    end loop;
  end loop;

  return;
end;
$$;

grant execute on function public.get_available_slots(uuid, date, uuid) to anon, authenticated;

-- 2) reschedule_booking (admin-only) -----------------------------------------
-- Sposta un appuntamento a un nuovo orario ri-validando fasce, chiusure e
-- anti-sovrapposizione (escludendo sé stesso). Servizio/durata/prezzo invariati.
create or replace function public.reschedule_booking(
  p_booking_id    uuid,
  p_new_starts_at timestamptz
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration   int;
  v_service_id uuid;
  v_status     public.booking_status;
  v_new_ends   timestamptz;
  v_tz         text;
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

  select service_id, status into v_service_id, v_status
  from bookings where id = p_booking_id;
  if v_service_id is null then
    raise exception 'Prenotazione non trovata.' using errcode = 'P0002';
  end if;
  if v_status <> 'confirmed' then
    raise exception 'Solo le prenotazioni confermate possono essere spostate.' using errcode = 'P0001';
  end if;

  select duration_min into v_duration from services where id = v_service_id;
  if v_duration is null then
    raise exception 'Servizio non disponibile.' using errcode = 'P0002';
  end if;

  v_new_ends := p_new_starts_at + make_interval(mins => v_duration);
  select timezone into v_tz from settings where id = true;

  -- Deve rientrare interamente in una fascia di apertura del giorno.
  v_local_date := (p_new_starts_at at time zone v_tz)::date;
  v_dow := extract(dow from v_local_date)::int;
  for b in
    select open_time, close_time from business_hours where weekday = v_dow
  loop
    v_open  := (v_local_date + b.open_time)  at time zone v_tz;
    v_close := (v_local_date + b.close_time) at time zone v_tz;
    if p_new_starts_at >= v_open and v_new_ends <= v_close then
      v_valid := true;
    end if;
  end loop;
  if not v_valid then
    raise exception 'Orario fuori dagli orari di apertura.' using errcode = 'P0001';
  end if;

  -- Chiusure.
  if exists (
    select 1 from closures c
    where tstzrange(c.starts_at, c.ends_at) && tstzrange(p_new_starts_at, v_new_ends)
  ) then
    raise exception 'Attività chiusa in questo orario.' using errcode = 'P0001';
  end if;

  -- Sovrapposizione con ALTRE prenotazioni (esclude sé stesso).
  if exists (
    select 1 from bookings bk
    where bk.id <> p_booking_id
      and bk.status <> 'cancelled'
      and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(p_new_starts_at, v_new_ends)
  ) then
    raise exception 'Lo slot scelto si sovrappone a un altro appuntamento.' using errcode = 'P0001';
  end if;

  update bookings
     set starts_at = p_new_starts_at,
         ends_at   = v_new_ends
   where id = p_booking_id
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'Lo slot è appena stato occupato. Scegline un altro.' using errcode = 'P0001';
end;
$$;

grant execute on function public.reschedule_booking(uuid, timestamptz) to authenticated;
