import { defineStore } from 'pinia'
import * as reviewsService from '@/services/reviews.service'
import * as adminService from '@/services/admin.service'

export const useReviewsStore = defineStore('reviews', {
  state: () => ({
    reviews: [],
    categories: [],
    loading: false,
    error: null,
  }),

  getters: {
    myReview: (state) => (userId) => state.reviews.find((r) => r.user_id === userId) || null,
  },

  actions: {
    async fetchCategories() {
      if (this.categories.length) return
      const { data } = await reviewsService.listIncidentCategories()
      this.categories = data || []
    },

    async fetchForRoute(routeId) {
      this.loading = true
      this.error = null

      const { data, error } = await reviewsService.listReviewsForRoute(routeId)

      if (error) this.error = error.message
      this.reviews = data || []
      this.loading = false
    },

    // Incidents are replaced wholesale — simpler than diffing, and there are at most three.
    async save({ routeId, userId, rating, perceivedDifficulty, completed, reviewText, incidents }) {
      this.error = null

      const { data: review, error } = await reviewsService.upsertReview({
        routeId,
        userId,
        rating,
        perceivedDifficulty,
        completed,
        reviewText,
      })

      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }

      await reviewsService.deleteIncidentsForReview(review.id)

      if (incidents.length) {
        const { error: incidentError } = await reviewsService.insertIncidents(review.id, routeId, incidents)
        if (incidentError) {
          this.error = incidentError.message
          await this.recalcStats(routeId)
          return { success: false, error: incidentError.message }
        }
      }

      await this.recalcStats(routeId)
      await this.fetchForRoute(routeId)
      return { success: true }
    },

    async remove(reviewId, routeId) {
      const { error } = await reviewsService.deleteReview(reviewId)
      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }
      await this.recalcStats(routeId)
      await this.fetchForRoute(routeId)
      return { success: true }
    },

    // The review itself is already saved, so a failure here only leaves the
    // route's averages stale until the next review; it does not fail the save.
    async recalcStats(routeId) {
      const { error } = await reviewsService.recalcRouteStats(routeId)
      if (error) console.warn(`Could not refresh stats for route ${routeId}:`, error.message)
    },

    async fetchAllForModeration() {
      this.loading = true
      const { data, error } = await adminService.listReviewsForModeration()
      if (error) this.error = error.message
      this.reviews = data || []
      this.loading = false
    },

    async removeIncident(incidentId, routeId) {
      const { error } = await adminService.deleteIncident(incidentId)
      if (error) {
        this.error = error.message
        return false
      }
      await this.recalcStats(routeId)
      return true
    },
  },
})
