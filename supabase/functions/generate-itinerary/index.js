/* global Deno */
// Edge function: builds a day-by-day itinerary for a route using OpenAI.
// Runs on Supabase (Deno), so the OpenAI key never reaches the browser.
// Only signed-in users can call it (Supabase checks their login token).
//
// Request body: { route_id, start_date: 'YYYY-MM-DD', days: 1-14, pace }
// Response:     { summary, days: [...], tips: [...] }  or  { error }

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.js'

const MODEL = 'gpt-4.1-mini'
const PACES = ['relaxed', 'moderate', 'fast']

// Longest itinerary allowed for a route: 1.5x its usual duration, never
// below 14 or above 60 days. Keep in sync with maxDaysFor() in
// src/controller/itineraryController.js.
const MIN_MAX_DAYS = 14
const ABSOLUTE_MAX_DAYS = 60

// Above this many days, ask the model for shorter day entries so the reply
// stays small enough to finish reliably.
const LONG_ITINERARY_DAYS = 14

function maxDaysFor(route) {
  const usual = Number(route.duration_days)
  if (!usual) {
    return MIN_MAX_DAYS
  }
  return Math.min(ABSOLUTE_MAX_DAYS, Math.max(MIN_MAX_DAYS, Math.ceil(usual * 1.5)))
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function validate(body) {
  if (!body.route_id) {
    return 'route_id is required.'
  }
  // The upper limit depends on the route, so it's checked after loading it.
  if (!Number.isInteger(body.days) || body.days < 1) {
    return 'days must be a whole number of at least 1.'
  }
  if (!PACES.includes(body.pace)) {
    return `pace must be one of: ${PACES.join(', ')}.`
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.start_date) || isNaN(Date.parse(body.start_date))) {
    return 'start_date must be a date in YYYY-MM-DD format.'
  }
  return null
}

// Everything the model knows about the route comes from our database,
// not from text the user typed.
function buildPrompt(route, points, { start_date, days, pace }) {
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
Difficulty: ${route.technical_rating ?? 'unknown'}
Safety status: ${route.safety_status ?? 'unknown'}
Permit required: ${route.permit_required ? 'yes' : 'no'}
Guide required: ${route.guide_required ? 'yes' : 'no'}

Checkpoints in order:
${stops}

Plan this hike over ${days} day(s), starting on ${start_date}, at a ${pace} pace.${
    days > LONG_ITINERARY_DAYS
      ? '\nThis is a long itinerary, so keep each day brief: "notes" is one sentence and "highlights" has at most 2 items.'
      : ''
  }`
}

const SYSTEM_PROMPT = `You are an experienced hiking guide. Create a realistic day-by-day itinerary.
Use the listed checkpoints as start/end points and camps where possible, in order.
Split the distance and elevation sensibly across the days for the requested pace.
Reply with JSON only, in exactly this shape:
{
  "summary": "2-3 sentence overview",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "short title",
      "start": "place",
      "end": "place",
      "distance_km": 0,
      "elevation_gain_m": 0,
      "est_hours": 0,
      "highlights": ["..."],
      "notes": "practical advice for the day"
    }
  ],
  "tips": ["general tips for this route"]
}
The "days" array must have exactly one entry per day, with consecutive dates from the start date.`

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

  const maxDays = maxDaysFor(route)
  if (body.days > maxDays) {
    return json({ error: `This route can be planned over at most ${maxDays} days.` }, 400)
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
        max_tokens: 16000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(route, points, body) },
        ],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('OpenAI error', response.status, detail)
      return json({ error: 'The itinerary service is unavailable. Please try again later.' }, 502)
    }

    const result = await response.json()
    const itinerary = JSON.parse(result.choices[0].message.content)
    return json(itinerary)
  } catch (err) {
    console.error('Itinerary generation failed', err)
    return json({ error: 'Could not generate an itinerary. Please try again.' }, 502)
  }
})
