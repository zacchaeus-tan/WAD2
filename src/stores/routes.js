import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'
import { supabase } from '@/lib/supabase'

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

export const useRoutesStore = defineStore('routes', () => {
  const routes = ref([])
  const currentRoute = ref(null)
  const itineraryDays = ref([])
  const points = ref([])
  const warnings = ref([])
  const loading = ref(false)
  const error = ref(null)

  const warningsForDay = (dayNumber) =>
    warnings.value.filter((warning) => warning.day_number === dayNumber)

  async function fetchRoutes() {
    if (routes.value.length || loading.value) return

    loading.value = true
    error.value = null
    const { data, error: routesError } = await supabase
      .from('routes')
      .select(ROUTE_LIST_COLUMNS)
      .order('name')

    if (routesError) {
      error.value = routesError.message
    } else {
      routes.value = data || []
    }

    loading.value = false
  }

  async function fetchRouteGeometries() {
    await fetchRoutes()
    if (error.value || routes.value.every((route) => route.geometry !== undefined)) return

    loading.value = true
    error.value = null
    const { data, error: geometriesError } = await supabase
      .from('routes')
      .select('id, geometry')
      .order('name')

    if (geometriesError) {
      error.value = geometriesError.message
    } else {
      const geometryById = new Map(
        (data || []).map((route) => [
          route.id,
          route.geometry ? markRaw(route.geometry) : null,
        ]),
      )

      routes.value = routes.value.map((route) => ({
        ...route,
        geometry: geometryById.get(route.id) ?? null,
      }))
    }

    loading.value = false
  }

  async function fetchRouteById(id) {
    loading.value = true
    error.value = null

    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single()

    if (routeError) {
      error.value = routeError.message
      loading.value = false
      return
    }

    const [days, routePoints, routeWarnings] = await Promise.all([
      supabase.from('itinerary_days').select('*').eq('route_id', id).order('day_number'),
      supabase.from('route_points').select('*').eq('route_id', id).order('sequence'),
      supabase.from('route_point_warnings').select('*').eq('route_id', id),
    ])

    currentRoute.value = route
    itineraryDays.value = days.data || []
    points.value = routePoints.data || []
    warnings.value = routeWarnings.data || []
    loading.value = false
  }

  async function refreshCurrentRouteStats() {
    if (!currentRoute.value) return

    const { data } = await supabase
      .from('routes')
      .select('*')
      .eq('id', currentRoute.value.id)
      .single()

    if (data) currentRoute.value = data

    const { data: routeWarnings } = await supabase
      .from('route_point_warnings')
      .select('*')
      .eq('route_id', currentRoute.value.id)

    warnings.value = routeWarnings || []
  }

  async function updateSafetyStatus(routeId, status, note) {
    const { error: updateError } = await supabase
      .from('routes')
      .update({ safety_status: status, safety_status_note: note })
      .eq('id', routeId)

    if (updateError) {
      error.value = updateError.message
      return { success: false, error: updateError.message }
    }

    return { success: true }
  }

  return {
    routes,
    currentRoute,
    itineraryDays,
    points,
    warnings,
    loading,
    error,
    warningsForDay,
    fetchRoutes,
    fetchRouteGeometries,
    fetchRouteById,
    refreshCurrentRouteStats,
    updateSafetyStatus,
  }
})
