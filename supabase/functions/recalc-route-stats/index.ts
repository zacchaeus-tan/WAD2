// Recomputes a route's community stats (feature 4) and saves them on `routes`.
//
// Runs on Supabase's servers with the service-role key, so signed-in users
// never need permission to write to `routes`. The only input is a route id and
// the figures always come from the real reviews, so calling it can't be used
// to plant fake numbers.
//
// Called by src/services/reviews.service.js after a review or incident note
// is saved or deleted.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { computeRouteStats } from '../_shared/route-stats.ts'

// Incident notes older than this no longer count towards the hazard level.
const INCIDENT_WINDOW_MONTHS = 24

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { routeId } = await req.json().catch(() => ({}))
  if (typeof routeId !== 'string') return json({ error: 'routeId is required' }, 400)

  // Injected automatically by Supabase; never sent to the browser.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: route, error: routeError } = await admin
    .from('routes')
    .select('official_difficulty')
    .eq('id', routeId)
    .maybeSingle()
  if (routeError) return json({ error: routeError.message }, 500)
  if (!route) return json({ error: 'Route not found' }, 404)

  const { data: reviews, error: reviewsError } = await admin
    .from('reviews')
    .select('rating, perceived_difficulty, completed')
    .eq('route_id', routeId)
  if (reviewsError) return json({ error: reviewsError.message }, 500)

  // Filter by the parent review's route rather than review_incidents.route_id,
  // so a note can only ever count towards the route its review is about.
  const since = new Date()
  since.setMonth(since.getMonth() - INCIDENT_WINDOW_MONTHS)
  const { data: incidentRows, error: incidentsError } = await admin
    .from('review_incidents')
    .select('reviews!inner(route_id, user_id), incident_categories(label, severity)')
    .eq('reviews.route_id', routeId)
    .gt('created_at', since.toISOString())
  if (incidentsError) return json({ error: incidentsError.message }, 500)

  const incidents = (incidentRows ?? []).map((row) => ({
    severity: row.incident_categories.severity,
    label: row.incident_categories.label,
    userId: row.reviews.user_id,
  }))

  const stats = computeRouteStats(route.official_difficulty, reviews ?? [], incidents)

  const { error: updateError } = await admin.from('routes').update(stats).eq('id', routeId)
  if (updateError) return json({ error: updateError.message }, 500)

  return json(stats)
})
