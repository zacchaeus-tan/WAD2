import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useRoutesStore = defineStore('routes', {
  state: () => ({
    routes: [],
    currentRoute: null,
    itineraryDays: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchRoutes() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('routes').select('*')
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

      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('route_id', id)
        .order('day_number', { ascending: true })

      this.currentRoute = route
      this.itineraryDays = daysError ? [] : days
      this.loading = false
    },
  },
})