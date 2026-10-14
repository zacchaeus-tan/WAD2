import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'

const port = Number(process.env.PORT || 3000)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

const itinerarySchema = {
  type: 'object',
  additionalProperties: false,

  properties: {
    summary: {
      type: 'string'
    },

    safety_note: {
      type: 'string'
    },

    days: {
      type: 'array',
      minItems: 1,

      items: {
        type: 'object',
        additionalProperties: false,

        properties: {
          day_number: {
            type: 'integer',
            minimum: 1
          },

          start_checkpoint: {
            type: 'string'
          },

          end_checkpoint: {
            type: 'string'
          },

          checkpoints: {
            type: 'array',
            items: {
              type: 'string'
            }
          },

          title: {
            type: 'string'
          },

          distance_km: {
            type: 'number',
            minimum: 0
          },

          estimated_hours: {
            type: 'number',
            minimum: 0
          },

          overnight_stop: {
            type: 'string'
          },

          accommodation: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,

              properties: {
                name: {
                  type: 'string'
                },

                type: {
                  type: 'string'
                },

                distance_from_route_km: {
                  type: 'number',
                  minimum: 0
                },

                facilities: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },

                booking_info: {
                  type: 'string'
                },

                source_url: {
                  type: 'string'
                }
              },

              required: [
                'name',
                'type',
                'distance_from_route_km',
                'facilities',
                'booking_info',
                'source_url'
              ]
            }
          },

          trail_facilities: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,

              properties: {
                name: {
                  type: 'string'
                },

                type: {
                  type: 'string'
                },

                location: {
                  type: 'string'
                },

                source_url: {
                  type: 'string'
                }
              },

              required: [
                'name',
                'type',
                'location',
                'source_url'
              ]
            }
          },

          highlights: {
            type: 'array',
            items: {
              type: 'string'
            }
          },

          notes: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },

        required: [
          'day_number',
          'start_checkpoint',
          'end_checkpoint',
          'checkpoints',
          'title',
          'distance_km',
          'estimated_hours',
          'overnight_stop',
          'accommodation',
          'trail_facilities',
          'highlights',
          'notes'
        ]
      }
    }
  },

  required: [
    'summary',
    'safety_note',
    'days'
  ]
};

const compactWeather = (weather) => weather ? {
  current: weather.current,
  days: (weather.days || []).map(({ date, max, min, rain }) => ({ date, max, min, rain })),
} : null

function routeDurationDays(route) {
  const storedDays = Number(route.duration_days)
  if (storedDays > 1) return storedDays

  const distance = Number(route.distance_km)
  const elevationGain = Math.max(Number(route.elevation_gain_m) || 0, 0)
  if (!Number.isFinite(distance) || distance <= 0) return 1

  const estimatedHours = (distance / 4 + elevationGain / 600) * 1.2
  return Math.max(1, Math.ceil(estimatedHours / 7))
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return JSON.parse(body || '{}')
}

function responseText(response) {
  if (typeof response.output_text === 'string') return response.output_text
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .find((part) => part.type === 'output_text' && typeof part.text === 'string')?.text
}

async function generateItinerary(req, res) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return send(res, 401, { error: 'Sign in to generate an itinerary' })
    if (!process.env.OPENAI_API_KEY) return send(res, 500, { error: 'OPENAI_API_KEY is not configured on the server' })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return send(res, 401, { error: 'Your session has expired. Sign in again.' })

    const { routeId, weather } = await readJson(req)
    if (typeof routeId !== 'string') return send(res, 400, { error: 'routeId is required' })
    const { data: route, error: routeError } = await supabase.from('routes')
      .select('id, name, country, distance_km, elevation_gain_m, altitude_m, duration_days, is_multiday, technical_rating, official_difficulty, safety_status, safety_status_note, permit_required, guide_required')
      .eq('id', routeId).maybeSingle()
    if (routeError) throw routeError
    if (!route) return send(res, 404, { error: 'Route not found' })
    const requestedDays = routeDurationDays(route)
    route.duration_days = requestedDays
    route.is_multiday = requestedDays > 1
    const { data: points, error: pointsError } = await supabase
      .from('route_points')
      .select(`
        day_number,
        sequence,
        name,
        point_type,
        altitude_m,
        latitude,
        longitude,
        notes
      `)
      .eq('route_id', routeId)
      .order('sequence');
    if (pointsError) throw pointsError

    const prompt = [
    'You are a hiking itinerary planner with access to web search.',

    `Create a practical hiking itinerary across exactly ${requestedDays} days using the verified route data provided below.`,

    `Return exactly ${requestedDays} day entries numbered 1 through ${requestedDays}. Never combine the route into fewer days.`,

    'ROUTE DATA RULES:',
    '- Treat the supplied route and checkpoint data as the authoritative source for route distance, coordinates, and checkpoint names.',
    '- Do not replace verified route metrics with estimates from websites unless clearly identifying a discrepancy.',
    '- When no official daily split exists, divide the route into realistic daily stages based on checkpoint order, altitude changes, terrain, available overnight accommodation, and hiking time.',
    '- Use the supplied checkpoint sequence to choose a real start and end checkpoint for every day. Do not invent generic stage names such as Camp 1 or Camp 2.',
    '- Copy checkpoint names exactly as provided in the Checkpoints JSON; do not paraphrase, rename, or invent checkpoint names.',
    '- Do not split the route into equal distance by default. Natural days should be uneven when checkpoint spacing, terrain, or overnight options make them uneven.',
    '- Include the intermediate named checkpoints passed during each day in the checkpoints array.',
    '- Prefer daily endpoints where hikers can legally and realistically stay overnight.',

    'WEB RESEARCH REQUIREMENTS:',
    '- Search the web for real, currently documented places to stay overnight along or reasonably close to the route.',
    '- Look for official campsites, mountain huts, refuges, shelters, hostels, guesthouses, lodges, hotels, or other legitimate accommodation.',
    '- Prefer official park, tourism, accommodation-provider, government, or trail-authority sources.',
    '- For each overnight location, verify its name and location using web sources before including it.',
    '- Never invent an accommodation or facility.',
    '- Do not turn generic labels such as "Camp 1" or "Camp 2" into named overnight stops unless a source explicitly identifies them as legal, documented overnight locations.',
    '- Do not reuse one accommodation listing for multiple different camps unless the source explicitly confirms that it serves each location.',
    '- If no verified overnight accommodation can be found near a suitable stopping point, explicitly state "No verified overnight accommodation found".',
    '- Do not assume that wild camping is legal. Only recommend camping when a reliable source indicates that camping is permitted.',

    'FACILITIES:',
    '- Research useful facilities at or near each daily stage and overnight stop.',
    '- Check specifically for toilets, drinking water, food, restaurants/cafes, grocery or resupply options, showers, electricity/charging, shelters, and public transport where relevant.',
    '- Only list a facility when it can be supported by a web source.',
    '- If a facility cannot be verified, return "Not specified" rather than guessing.',
    '- Distinguish between facilities directly on the trail and facilities that require a detour.',

    'ACCOMMODATION DETAILS:',
    '- For each overnight stay, provide the accommodation name, type, approximate distance from the route, and known facilities.',
    '- Include the official website or authoritative source URL where available.',
    '- If reservations are required or recommended, only state this when supported by a current source.',
    '- Do not invent prices, availability, booking requirements, opening periods, or contact information.',

    'DAILY ITINERARY:',
    '- For every day include the starting checkpoint, ending checkpoint, estimated distance, estimated hiking duration, major checkpoints passed, overnight location, accommodation options, and facilities.',
    '- Estimate hiking duration conservatively using route distance, terrain, and known route difficulty rather than assuming a constant walking speed.',
    '- Clearly label calculated or estimated values as estimates.',

    'WEATHER AND SAFETY:',
    '- Use the supplied weather data as a short-term planning signal only.',
    '- Do not treat forecasts as a guarantee of safe hiking conditions.',
    '- Mention relevant weather concerns for each day when supported by the supplied forecast.',
    '- Advise hikers to verify current trail conditions, closures, warnings, and weather with the relevant authorities before departure.',

    'SOURCE REQUIREMENTS:',
    '- Every researched accommodation, campsite, hut, facility, access restriction, or transport option must include a supporting source URL.',
    '- Prefer primary and official sources over blogs, forums, or user-generated content.',
    '- Do not cite a source unless it actually supports the claim being made.',
    '- If reliable information cannot be found, say "Not specified".',

    'OUTPUT:',
    '- Return valid JSON only.',
    '- Do not include Markdown or commentary outside the JSON.',
    '- Keep researched facts separate from estimates.',
    '- Never fabricate information merely to complete the itinerary.',

    `Route: ${JSON.stringify(Object.fromEntries(Object.entries(route).filter(([key]) => key !== 'elevation_gain_m')))}`,
    `Checkpoints: ${JSON.stringify(points || [])}`,
    `Weather: ${JSON.stringify(compactWeather(weather))}`,
    ].join('\\n');
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',

        // Give the model access to live web search
        tools: [
          {
            type: 'web_search',
            search_context_size: 'medium'
          }
        ],

        // Your itinerary requires web research, so force tool usage
        tool_choice: 'required',

        // Return the sources consulted by web search
        include: [
          'web_search_call.action.sources'
        ],

        input: [
          {
            role: 'system',
            content: [
              'You are a careful hiking itinerary planner.',
              'Accuracy and clear uncertainty are more important than creativity.',
              'You have access to web search.',
              'You MUST research real accommodation and facilities before creating the itinerary.',
              'Never invent accommodation, campsites, huts, facilities, or URLs.'
            ].join(' ')
          },

          {
            role: 'user',
            content: prompt
          }
        ],

        text: {
          format: {
            type: 'json_schema',
            name: 'hiking_itinerary',
            strict: true,
            schema: itinerarySchema
          }
        }
      }),
    });
    if (!openAiResponse.ok) throw new Error(`OpenAI returned ${openAiResponse.status}`)
    const response = await openAiResponse.json()
    // Log the raw response for debugging purposes
    console.log(
      '===== OPENAI RAW RESPONSE ====='
    )

    console.dir(response, {
      depth: null
    })

    console.log(
      '===== MODEL USED ====='
    )

    console.log(response.model)

    console.log(
      '===== OUTPUT TEXT ====='
    )

    console.log(responseText(response))
    
    const text = responseText(response)
    if (!text) return send(res, 502, { error: 'The model did not return an itinerary.' })
    const itinerary = JSON.parse(text)
    if (itinerary.days?.length !== requestedDays) {
      return send(res, 502, { error: `The model returned ${itinerary.days?.length || 0} days instead of ${requestedDays}. Please regenerate.` })
    }
    return send(res, 200, { ...itinerary, model: response.model })
  } catch (error) {
    console.error('Itinerary generation failed:', error instanceof Error ? error.message : error)
    return send(res, 502, { error: 'The itinerary service is temporarily unavailable.' })
  }
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true })
  if (req.method === 'POST' && req.url === '/api/itinerary') return generateItinerary(req, res)
  return send(res, 404, { error: 'Not found' })
}).listen(port, () => console.log(`Itinerary API listening on http://localhost:${port}`))
