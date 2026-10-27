/* global Deno */
// Edge function: builds a gear checklist for a route using OpenAI.
// Runs on Supabase (Deno), so the OpenAI key never reaches the browser.
// Only signed-in users can call it (Supabase checks their login token).
//
// Request body: { route_id }
// Response:     { items: [{ label, category, quantity, reason }] }  or  { error }

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.js'

const MODEL = 'gpt-4.1-mini'

const CATEGORIES = ['clothing', 'safety', 'navigation', 'water_food', 'shelter', 'documents', 'other']

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function validate(body) {
  if (!body?.route_id) {
    return 'route_id is required.'
  }
  return null
}

// Everything the model knows about the route comes from our database,
// not from text the user typed. The community hazard note is left out on
// purpose because it is written by users.
function buildPrompt(route, points) {
  const stops = points.length
    ? points
        .map((p) => {
          const day = p.day_number ? ` (day ${p.day_number})` : ''
          const alt = p.altitude_m ? `, ${p.altitude_m} m` : ''
          return `- ${p.sequence}. ${p.name} [${p.point_type}${alt}]${day}`
        })
        .join('\n')
    : 'No checkpoints recorded.'

  return `Route: ${route.name}
Country: ${route.country ?? 'unknown'}
Distance: ${route.distance_km ?? 'unknown'} km
Elevation gain: ${route.elevation_gain_m ?? 'unknown'} m
Maximum altitude: ${route.altitude_m ?? 'unknown'} m
Usual duration: ${route.duration_days ?? 'unknown'} days
Multiday: ${route.is_multiday ? 'yes' : 'no'}
Official rating: ${route.technical_rating ?? 'unknown'}
Community-adjusted difficulty (1 easy to 4 strenuous): ${route.effective_difficulty ?? 'unknown'}
Safety status: ${route.safety_status ?? 'unknown'}
Safety note: ${route.safety_status_note ?? 'none'}
Community hazard level: ${route.community_hazard_level ?? 'unknown'}
Permit required: ${route.permit_required ? 'yes' : 'no'}
Guide required: ${route.guide_required ? 'yes' : 'no'}

Checkpoints in order:
${stops}

Create a gear packing checklist for this hike.`
}

const SYSTEM_PROMPT = `You are an experienced hiking guide for Southeast Asia. Create a practical gear packing checklist tailored to the route described.
Base the items on the route facts: distance, elevation, altitude, duration, hazards, permits, guide requirement and the checkpoints (such as camps).
Reply with JSON only, in exactly this shape:
{
  "items": [
    {
      "label": "item name",
      "category": "one of: ${CATEGORIES.join(', ')}",
      "quantity": "short text such as 1, 3L or 2 pairs",
      "reason": "one short sentence tied to this route"
    }
  ]
}
Rules:
- Give 10 to 20 items.
- "quantity" is always a short non-empty string.
- Include documents (permit, ID) only if a permit or guide is required.
- Include shelter items only if the route is multiday or has camps.
- Do not repeat items.`

Deno.serve(async (req) => {
  // Browser preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400)
  }

  const invalid = validate(body)
  if (invalid) {
    return json({ error: invalid }, 400)
  }

  // routes and route_points are publicly readable, so the anon key is enough.
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'))

  const { data: route, error: routeError } = await supabase
    .from('routes')
    .select('*')
    .eq('id', body.route_id)
    .maybeSingle()

  if (routeError) {
    return json({ error: routeError.message }, 500)
  }
  if (!route) {
    return json({ error: 'Route not found.' }, 404)
  }

  const { data: points, error: pointsError } = await supabase
    .from('route_points')
    .select('sequence, name, point_type, day_number, altitude_m')
    .eq('route_id', route.id)
    .order('sequence')

  if (pointsError) {
    return json({ error: pointsError.message }, 500)
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return json({ error: 'OPENAI_API_KEY is not set on the server.' }, 500)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        // Caps the reply length so one request can't run away in time or cost.
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(route, points) },
        ],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('OpenAI error', response.status, detail)
      return json({ error: 'The checklist service is unavailable. Please try again later.' }, 502)
    }

    const result = await response.json()
    const parsed = JSON.parse(result.choices[0].message.content)
    if (!Array.isArray(parsed.items)) {
      console.error('Unexpected checklist shape', parsed)
      return json({ error: 'Could not generate a checklist. Please try again.' }, 502)
    }
    return json({ items: parsed.items })
  } catch (err) {
    console.error('Checklist generation failed', err)
    return json({ error: 'Could not generate a checklist. Please try again.' }, 502)
  }
})