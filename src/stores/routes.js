import { defineStore } from 'pinia'
import { markRaw } from 'vue'
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

export const useRoutesStore = defineStore('routes', {
  state: () => ({
    routes: [],
    currentRoute: null,
    itineraryDays: [],
    points: [],
    warnings: [],
    loading: false,
    error: null,
  }),

  getters: {
    warningsForDay: (state) => (dayNumber) =>
      state.warnings.filter((w) => w.day_number === dayNumber),
  },

  actions: {
    async fetchRoutes() {
      // Both /routes and /globe use this store. Avoid a second request when
      // navigation between the pages happens during the same session.
      if (this.routes.length || this.loading) return

      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('routes').select(ROUTE_LIST_COLUMNS).order('name')
      if (error) {
        this.error = error.message
      } else {
        this.routes = data || []
      }
      this.loading = false
    },

    async fetchRouteGeometries() {
      await this.fetchRoutes()
      if (this.error || this.routes.every((route) => route.geometry !== undefined)) return

      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('routes').select('id, geometry').order('name')
      if (error) {
        this.error = error.message
      } else {
        const geometryById = new Map(
          (data || []).map((route) => [
            route.id,
            route.geometry ? markRaw(route.geometry) : null,
          ]),
        )
        this.routes = this.routes.map((route) => ({
          ...route,
          geometry: geometryById.get(route.id) ?? null,
        }))
      }
      this.loading = false
    },

    async fetchRouteById(id) {
      this.loading = true
      this.error = null

      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single()

      if (routeError) {
        this.error = routeError.message
        this.loading = false
        return
      }

      const [days, points, warnings] = await Promise.all([
        supabase.from('itinerary_days').select('*').eq('route_id', id).order('day_number'),
        supabase.from('route_points').select('*').eq('route_id', id).order('sequence'),
        supabase.from('route_point_warnings').select('*').eq('route_id', id),
      ])

      this.currentRoute = route
      this.itineraryDays = days.data || []
      this.points = points.data || []
      this.warnings = warnings.data || []
      this.loading = false
    },

    // Called after a review changes so the page shows the recalculated figures.
    async refreshCurrentRouteStats() {
      if (!this.currentRoute) return
      const { data } = await supabase
        .from('routes')
        .select('*')
        .eq('id', this.currentRoute.id)
        .single()
      if (data) this.currentRoute = data

      const { data: warnings } = await supabase
        .from('route_point_warnings')
        .select('*')
        .eq('route_id', this.currentRoute.id)
      this.warnings = warnings || []
    },

    async updateSafetyStatus(routeId, status, note) {
      const { error } = await supabase
        .from('routes')
        .update({ safety_status: status, safety_status_note: note })
        .eq('id', routeId)
      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }
      return { success: true }
    },
  },
})
