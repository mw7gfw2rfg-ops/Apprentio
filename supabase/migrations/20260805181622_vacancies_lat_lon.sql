-- Store coordinates from the FAA API address directly so distance filtering
-- doesn't need a geocoding call per vacancy on every discovery-view request.
alter table public.vacancies
  add column latitude double precision,
  add column longitude double precision;
