-- =============================================================================
-- 0009_day_schedule.sql — Agenda del giorno per operatore (vista cliente)
--   Dato servizio + sede + giorno, ritorna PER OGNI OPERATORE attivo della sede
--   le sue fasce OCCUPATE e LIBERE, riusando le stesse regole del motore slot
--   (orari, durata, passo, preavviso, anticipo, pause, chiusure, fuso).
--
--   PRIVACY (inderogabile): le righe restituite contengono SOLO
--     staff_id, staff_name, is_free, starts_at, ends_at.
--   La query delle fasce occupate legge da `bookings` ESCLUSIVAMENTE
--   starts_at/ends_at (+ nome operatore da `staff`). NESSUN dato cliente
--   (customer_name/email/phone/notes) viene letto o restituito, nessun join a
--   `profiles`. La prenotazione resta sempre sulla RPC create_booking.
-- Eseguire dopo 0008_month_availability.sql.
-- =============================================================================

create or replace function public.get_day_schedule(
  p_service_id  uuid,
  p_location_id uuid,
  p_date        date
)
returns table (
  staff_id   uuid,
  staff_name text,
  is_free    boolean,
  starts_at  timestamptz,
  ends_at    timestamptz
)
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
  v_today       date;
  v_dow         int;
  s             record;
  h             record;
  v_open        timestamptz;
  v_close       timestamptz;
  v_slot        timestamptz;
begin
  select timezone into v_tz from locations where id = p_location_id and is_active;
  if v_tz is null then return; end if;

  select slot_step_min, min_notice_min, max_advance_days
    into v_step, v_min_notice, v_max_advance
  from settings where id = true;

  select duration_min into v_duration
  from services where id = p_service_id and is_active = true;
  if v_duration is null then return; end if;
  v_dur := make_interval(mins => v_duration);

  v_today    := (now() at time zone v_tz)::date;
  v_earliest := now() + make_interval(mins => v_min_notice);
  if p_date < v_today or p_date > v_today + v_max_advance then return; end if;

  v_dow := extract(dow from p_date)::int;

  for s in
    select id, full_name from staff
    where location_id = p_location_id and is_active
    order by sort_order, full_name
  loop
    -- FASCE OCCUPATE — SOLO orari + nome operatore. Nessun dato cliente.
    return query
      select s.id, s.full_name, false, bk.starts_at, bk.ends_at
      from bookings bk
      where bk.staff_id = s.id
        and bk.status <> 'cancelled'
        and (bk.starts_at at time zone v_tz)::date = p_date
      order by bk.starts_at;

    -- FASCE LIBERE — slot prenotabili dell'operatore.
    for h in
      select open_time, close_time from business_hours
      where location_id = p_location_id and weekday = v_dow
      order by open_time
    loop
      v_open  := (p_date + h.open_time)  at time zone v_tz;
      v_close := (p_date + h.close_time) at time zone v_tz;
      v_slot  := v_open;
      while v_slot + v_dur <= v_close loop
        if v_slot >= v_earliest
           and not exists (
             select 1 from closures c
             where (c.location_id is null or c.location_id = p_location_id)
               and tstzrange(c.starts_at, c.ends_at) && tstzrange(v_slot, v_slot + v_dur)
           )
           and not exists (
             select 1 from bookings bk
             where bk.staff_id = s.id and bk.status <> 'cancelled'
               and tstzrange(bk.starts_at, bk.ends_at) && tstzrange(v_slot, v_slot + v_dur)
           )
        then
          staff_id := s.id; staff_name := s.full_name; is_free := true;
          starts_at := v_slot; ends_at := v_slot + v_dur;
          return next;
        end if;
        v_slot := v_slot + make_interval(mins => v_step);
      end loop;
    end loop;
  end loop;

  return;
end;
$$;

grant execute on function public.get_day_schedule(uuid, uuid, date) to anon, authenticated;
