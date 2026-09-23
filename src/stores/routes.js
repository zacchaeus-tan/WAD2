import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

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
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('routes').select('*').order('name')
      if (error) {
        this.error = error.message
      } else {
        this.routes = data
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
