import { supabase } from '@/lib/supabase'
import { withEstimatedRouteDuration } from '@/lib/route-duration'

const ROUTE_LIST_COLUMNS = [
  'id',
  'name',
  'country',
  'distance_km',
  'elevation_gain_m',
  'duration_days',
  'is_multiday',
  'technical_rating',
  'altitude_m',
  'latitude',
  'longitude',
  'permit_required',
  'guide_required',
  'safety_status',
  'safety_status_note',
  'created_at',
  'official_difficulty',
  'avg_rating',
  'avg_perceived_difficulty',
  'review_count',
  'completion_rate',
  'effective_difficulty',
  'community_hazard_level',
  'community_hazard_note',
  'stats_updated_at',
  'osm_id',
].join(',')

const TRAIL_BUCKET = 'route-geojson'
const TRAIL_FILES = [
  'indonesia-routes.geojson',
  'malaysia-routes.geojson',
  'phillipines-routes.geojson',
  'singapore-routes.geojson',
  'thailand-routes.geojson',
  'vietnam-routes.geojson',
]

export async function listRoutes() {
  const { data, error } = await supabase.from('routes').select(ROUTE_LIST_COLUMNS).order('name')
  return { data: data?.map(withEstimatedRouteDuration) ?? data, error }
}

export function listRouteGeometries() {
  return supabase.from('routes').select('id, geometry').order('name')
}

export async function getRoute(id) {
  const { data, error } = await supabase.from('routes').select('*').eq('id', id).single()
  return { data: data ? withEstimatedRouteDuration(data) : data, error }
}

export function listItineraryDays(routeId) {
  return supabase.from('itinerary_days').select('*').eq('route_id', routeId).order('day_number')
}

export function listRoutePoints(routeId) {
  return supabase.from('route_points').select('*').eq('route_id', routeId).order('sequence')
}

export function listRouteWarnings(routeId) {
  return supabase.from('route_point_warnings').select('*').eq('route_id', routeId)
}

// Every mapped trail from the raw OpenStreetMap exports in Storage, merged into
// one FeatureCollection for the globe's "show all trails" layer.
export async function fetchAllTrails() {
  const collections = await Promise.all(
    TRAIL_FILES.map(async (filename) => {
      const { data } = supabase.storage.from(TRAIL_BUCKET).getPublicUrl(filename)
      const response = await fetch(data.publicUrl)
      if (!response.ok) throw new Error(`Could not load ${filename}`)
      return response.json()
    }),
  )

  return {
    type: 'FeatureCollection',
    features: collections
      .flatMap((collection) => collection.features)
      .filter((feature) => ['LineString', 'MultiLineString'].includes(feature.geometry?.type)),
  }
}
