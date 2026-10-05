-- Globe: links a curated route to its OpenStreetMap trail and stores the
-- trail line on the route row, so the globe draws from `routes` instead of
-- the raw GeoJSON exports in the route-geojson storage bucket.

alter table public.routes
  add column if not exists osm_id   text,
  add column if not exists geometry jsonb;

-- GeoJSON geometry object. Routes without one are drawn as a marker at
-- latitude/longitude.
alter table public.routes drop constraint if exists routes_geometry_check;
alter table public.routes add constraint routes_geometry_check
  check (geometry is null or geometry->>'type' in ('LineString','MultiLineString'));
