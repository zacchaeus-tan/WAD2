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

// 2. split into existing vs new
const { data: existing, error: e1 } = await supabase
  .from('routes').select('osm_id').not('osm_id', 'is', null)
if (e1) throw e1
const existingIds = new Set(existing.map(r => r.osm_id))

const toUpdate = [...byId.values()].filter(r => existingIds.has(r.osm_id))
const toInsert = [...byId.values()].filter(r => !existingIds.has(r.osm_id))

// 3. update existing (calculated fields + geometry + country, names untouched)
for (const r of toUpdate) {
  const { error } = await supabase.from('routes')
    .update({
      geometry: r.geometry,
      country: r.country,
      distance_km: r.distance_km,
      latitude: r.latitude,
      longitude: r.longitude,
    })
    .eq('osm_id', r.osm_id)
  if (error) throw error
}

// 4. insert new in batches
for (let i = 0; i < toInsert.length; i += 25) {
  const { error } = await supabase.from('routes').insert(toInsert.slice(i, i + 25))
  if (error) throw error
}

console.log(`Updated ${toUpdate.length}, inserted ${toInsert.length}`)
