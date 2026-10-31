-- A small, ready-to-draw copy of each route's line for the browse tiles, so browse
-- no longer downloads every full geometry. It is an SVG path fitted to a 400×240 box,
-- made by geometryToPath() in src/lib/routeLine.js. Filled by
-- scripts/build-route-line-svg.mjs, which writes 0013_route_line_svg_data.sql.

alter table public.routes
  add column if not exists line_svg text;

-- When a route's line changes, its old preview is wrong. Clear it so the tile shows
-- the placeholder until the build script is run again. An update that sets both
-- columns at once keeps the new preview.
create or replace function public.routes_clear_line_svg()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.geometry is distinct from old.geometry
     and new.line_svg is not distinct from old.line_svg then
    new.line_svg := null;
  end if;
  return new;
end;
$$;

drop trigger if exists routes_clear_line_svg on public.routes;
create trigger routes_clear_line_svg
  before update of geometry on public.routes
  for each row execute function public.routes_clear_line_svg();
