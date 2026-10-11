import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import * as routesService from '@/services/routes.service'
import * as adminService from '@/services/admin.service'

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
      const { data, error } = await routesService.listRoutes()
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
      const { data, error } = await routesService.listRouteGeometries()
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

      const { data: route, error: routeError } = await routesService.getRoute(id)

      if (routeError) {
        this.error = routeError.message
        this.loading = false
        return
      }

      const [days, points, warnings] = await Promise.all([
        routesService.listItineraryDays(id),
        routesService.listRoutePoints(id),
        routesService.listRouteWarnings(id),
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
      const { data } = await routesService.getRoute(this.currentRoute.id)
      if (data) this.currentRoute = data

      const { data: warnings } = await routesService.listRouteWarnings(this.currentRoute.id)
      this.warnings = warnings || []
    },

    async updateSafetyStatus(routeId, status, note) {
      const { error } = await adminService.updateSafetyStatus(routeId, status, note)
      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }
      return { success: true }
    },
  },
})
