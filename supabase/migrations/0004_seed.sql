-- =============================================================================
-- 0004_seed.sql — Dati di esempio (facoltativo, utile in sviluppo)
-- Eseguire dopo 0003_functions.sql. È idempotente: non duplica se già presenti.
-- =============================================================================

-- Servizi di esempio ---------------------------------------------------------
insert into public.services (name, description, duration_min, price_cents, sort_order)
select v.name, v.description, v.duration_min, v.price_cents, v.sort_order
from (values
  ('Taglio uomo',     'Taglio classico o moderno con styling finale.', 30, 2000, 1),
  ('Taglio + Barba',  'Taglio capelli e sistemazione barba.',          45, 3000, 2),
  ('Barba',           'Rifinitura e modellatura barba con panno caldo.',20, 1500, 3),
  ('Colore',          'Colorazione completa.',                          90, 5000, 4)
) as v(name, description, duration_min, price_cents, sort_order)
where not exists (select 1 from public.services);

-- Orari di apertura ----------------------------------------------------------
-- Lun–Ven (1–5): 09:00–13:00 e 15:00–19:00 · Sab (6): 09:00–13:00 · Dom (0): chiuso
insert into public.business_hours (weekday, open_time, close_time)
select v.weekday, v.open_time::time, v.close_time::time
from (values
  (1, '09:00', '13:00'), (1, '15:00', '19:00'),
  (2, '09:00', '13:00'), (2, '15:00', '19:00'),
  (3, '09:00', '13:00'), (3, '15:00', '19:00'),
  (4, '09:00', '13:00'), (4, '15:00', '19:00'),
  (5, '09:00', '13:00'), (5, '15:00', '19:00'),
  (6, '09:00', '13:00')
) as v(weekday, open_time, close_time)
where not exists (select 1 from public.business_hours);

-- Nome attività di default ---------------------------------------------------
update public.settings
   set business_name = 'Barber Demo'
 where id = true and business_name = 'La mia attività';
