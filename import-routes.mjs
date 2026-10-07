// import-routes.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY)
const projectDir = path.dirname(fileURLToPath(import.meta.url))
const geojsonDirectories = [
  path.join(projectDir, 'public', 'geojson'),
  path.join(projectDir, 'dist', 'geojson'),
]
const dir = geojsonDirectories.find((candidate) => fs.existsSync(candidate))
if (!dir) {
  throw new Error(
    `GeoJSON directory not found. Expected one of: ${geojsonDirectories.join(', ')}`,
  )
}

const countryNames = {
  indonesia: 'Indonesia', malaysia: 'Malaysia', phillipines: 'Philippines',
  singapore: 'Singapore', thailand: 'Thailand', vietnam: 'Vietnam',
}

const EARTH_RADIUS_KM = 6371
const ELEVATION_API_URL = process.env.ELEVATION_API_URL ?? 'https://api.opentopodata.org/v1/srtm90m'
const ELEVATION_SAMPLES = Number(process.env.ELEVATION_SAMPLES ?? 50)
const ELEVATION_DELAY_MS = Number(process.env.ELEVATION_DELAY_MS ?? 1500)
const ELEVATION_MAX_RETRIES = 5

function haversineKm([lon1, lat1], [lon2, lat2]) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const latDelta = toRadians(lat2 - lat1)
  const lonDelta = toRadians(lon2 - lon1)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lonDelta / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

function routeStats(geometry) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
  const firstPoint = lines[0]?.[0]

  if (!firstPoint) return { distance_km: null, latitude: null, longitude: null }

  let distance = 0
  for (const line of lines) {
    for (let index = 1; index < line.length; index += 1) {
      distance += haversineKm(line[index - 1], line[index])
    }
  }

  return {
    distance_km: Math.round(distance * 100) / 100,
    longitude: firstPoint[0],
    latitude: firstPoint[1],
  }
}

function pathForElevation(geometry) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
  return lines
    .filter((line) => line.length > 1)
    .map((line) => {
      // Open Topo Data rejects requests with too many path locations. Keep a
      // representative set of points and always preserve both endpoints.
      const pointCount = Math.min(line.length, 90)
      const points = Array.from({ length: pointCount }, (_, index) => {
        const sourceIndex = Math.round((index * (line.length - 1)) / (pointCount - 1))
        return line[sourceIndex]
      })
      return points.map(([longitude, latitude]) => `${latitude},${longitude}`).join('|')
    })
}

async function elevationStats(geometry) {
  const elevations = []

  for (const locations of pathForElevation(geometry)) {
    let response
    for (let attempt = 0; attempt <= ELEVATION_MAX_RETRIES; attempt += 1) {
      response = await fetch(ELEVATION_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locations, samples: ELEVATION_SAMPLES }),
      })

      if (response.status !== 429 || attempt === ELEVATION_MAX_RETRIES) break

      const retryAfter = Number(response.headers.get('retry-after'))
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : ELEVATION_DELAY_MS * 2 ** attempt
      console.warn(`Elevation API rate limit reached; retrying in ${Math.ceil(backoff / 1000)}s`)
      await wait(backoff)
    }

    if (!response.ok) throw new Error(`Elevation API returned ${response.status}`)
    const payload = await response.json()
    if (payload.status !== 'OK') throw new Error(payload.error || 'Elevation API request failed')

    elevations.push(
      ...payload.results
        .map((result) => result.elevation)
        .filter((elevation) => Number.isFinite(elevation)),
    )
  }

  if (!elevations.length) return { altitude_m: null, elevation_gain_m: null }

  // Ignore tiny DEM fluctuations when calculating ascent.
  let elevationGain = 0
  for (let index = 1; index < elevations.length; index += 1) {
    const increase = elevations[index] - elevations[index - 1]
    if (increase > 2) elevationGain += increase
  }

  return {
    altitude_m: Math.round(Math.max(...elevations)),
    elevation_gain_m: Math.round(elevationGain),
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

// 1. read GeoJSON
const byId = new Map()
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.geojson'))) {
  const key = file.split('-')[0]
  const country = countryNames[key] ?? key
  const fc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  for (const f of fc.features) {
    if (!['LineString', 'MultiLineString'].includes(f.geometry?.type)) continue
    const osmId = f.properties['@id']
    const stats = routeStats(f.geometry)
    byId.set(osmId, {
      osm_id: osmId,
      name: f.properties.name || `Unnamed route ${osmId}`,
      country,
      geometry: f.geometry,
      ...stats,
    })
  }
}

// 2. Query terrain elevation outside the Vue app. This can be skipped when
// needed with SKIP_ELEVATION=1, for example while testing the importer.
if (process.env.SKIP_ELEVATION !== '1') {
  for (const route of byId.values()) {
    try {
      Object.assign(route, await elevationStats(route.geometry))
    } catch (error) {
      console.warn(`Could not query elevation for ${route.osm_id}: ${error.message}`)
    }
    await wait(ELEVATION_DELAY_MS)
  }
}

// 3. split into existing vs new
const { data: existing, error: e1 } = await supabase
  .from('routes').select('osm_id').not('osm_id', 'is', null)
if (e1) throw e1
const existingIds = new Set(existing.map(r => r.osm_id))

const toUpdate = [...byId.values()].filter(r => existingIds.has(r.osm_id))
const toInsert = [...byId.values()].filter(r => !existingIds.has(r.osm_id))

// 4. update existing (calculated fields + geometry + country, names untouched)
for (const r of toUpdate) {
  const { error } = await supabase.from('routes')
    .update({
      geometry: r.geometry,
      country: r.country,
      distance_km: r.distance_km,
      latitude: r.latitude,
      longitude: r.longitude,
      altitude_m: r.altitude_m,
      elevation_gain_m: r.elevation_gain_m,
    })
    .eq('osm_id', r.osm_id)
  if (error) throw error
}

// 5. insert new in batches
for (let i = 0; i < toInsert.length; i += 25) {
  const { error } = await supabase.from('routes').insert(toInsert.slice(i, i + 25))
  if (error) throw error
}

console.log(`Updated ${toUpdate.length}, inserted ${toInsert.length}`)
