-- =============================================================================
-- 0008_month_availability.sql — Disponibilità mensile (calendario cliente)
--   Una sola RPC di sola lettura che, dato servizio/sede/operatore e un mese,
--   ritorna i GIORNI con almeno uno slot libero. Riusa get_available_slots
--   (sede, operatore, "qualsiasi operatore", orari, pause, chiusure, preavviso,
--   anticipo, fuso) → niente duplicazione di logica, un solo round-trip.
-- Eseguire dopo 0007_multisede.sql.
-- =============================================================================

create or replace function public.get_month_availability(
  p_service_id  uuid,
  p_location_id uuid,
  p_year        int,
  p_month       int,
  p_staff_id    uuid default null   -- null = qualsiasi operatore
)
returns setof date
language sql
stable
security definer
set search_path = public
as $$
  select d::date
  from generate_series(
    make_date(p_year, p_month, 1),
    (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date,
    interval '1 day'
  ) as d
  where exists (
    select 1
    from public.get_available_slots(p_service_id, d::date, p_location_id, p_staff_id)
    limit 1
  );
$$;

grant execute on function public.get_month_availability(uuid, uuid, int, int, uuid)
  to anon, authenticated;
