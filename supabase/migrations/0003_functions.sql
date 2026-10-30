-- =============================================================================
-- 0003_functions.sql — Funzioni RPC (disponibilità, creazione, annullamento)
-- Eseguire dopo 0002_rls.sql.
--
-- Tutte SECURITY DEFINER: la logica sensibile (calcolo slot, validazione,
-- inserimento) gira lato server senza esporre le prenotazioni altrui.
-- =============================================================================

-- get_available_slots ---------------------------------------------------------
-- Restituisce SOLO gli orari di inizio liberi (timestamptz) per un servizio in
-- una data, calcolati su: orari di apertura, durata del servizio, passo slot,
-- preavviso minimo, anticipo massimo, chiusure e prenotazioni esistenti.
create or replace function public.get_available_slots(
  p_service_id uuid,
  p_date date
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
    return; -- servizio inesistente o disattivato
  end if;
  v_dur := make_interval(mins => v_duration);

  v_today_local := (now() at time zone v_tz)::date;
  v_earliest := now() + make_interval(mins => v_min_notice);

  -- fuori dalla finestra prenotabile
  if p_date < v_today_local or p_date > v_today_local + v_max_advance then
    return;
  end if;

  v_dow := extract(dow from p_date)::int;  -- 0=Dom .. 6=Sab

  for b in
    select open_time, close_time
    from business_hours
    where weekday = v_dow
    order by open_time
  loop
    -- interpreta l'orario di apertura come "ora locale" del fuso attività
    v_open  := (p_date + b.open_time)  at time zone v_tz;
    v_close := (p_date + b.close_time) at time zone v_tz;

    v_slot := v_open;
    while v_slot + v_dur <= v_close loop
      if v_slot >= v_earliest
         and not exists (
           select 1 from bookings bk
           where bk.status <> 'cancelled'
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

grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;

-- create_booking --------------------------------------------------------------
-- Crea una prenotazione confermata ri-validando la disponibilità in transazione.
-- Il vincolo di esclusione bookings_no_overlap è la rete di sicurezza finale
-- contro le race condition (due prenotazioni concorrenti sullo stesso slot).
create or replace function public.create_booking(
  p_service_id    uuid,
  p_starts_at     timestamptz,
  p_customer_name text,
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

  select name, duration_min into v_service_name, v_duration
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

  -- deve rientrare interamente in una fascia di apertura del giorno
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
    service_name, customer_name, customer_email, customer_phone, notes
  ) values (
    p_service_id, v_uid, p_starts_at, v_ends_at, 'confirmed',
    v_service_name, p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  returning * into v_row;

  return v_row;
exception
  when exclusion_violation then
    raise exception 'Questo slot è appena stato prenotato. Scegline un altro.'
      using errcode = 'P0001';
end;
$$;

grant execute on function public.create_booking(uuid, timestamptz, text, text, text, text)
  to authenticated;

-- cancel_booking --------------------------------------------------------------
-- Annulla una prenotazione confermata: il cliente solo le proprie, l'admin tutte.
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.bookings;
begin
  if v_uid is null then
    raise exception 'Accesso richiesto.' using errcode = '28000';
  end if;

  update bookings
     set status = 'cancelled'
   where id = p_booking_id
     and status = 'confirmed'
     and (customer_id = v_uid or public.is_admin())
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Prenotazione non trovata o non annullabile.' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
