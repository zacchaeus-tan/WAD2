import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

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
      const { data } = await supabase
        .from('incident_categories')
        .select('*')
        .order('sort_order')
      this.categories = data || []
    },

    async fetchForRoute(routeId) {
      this.loading = true
      this.error = null

      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(display_name), review_incidents(*, route_points(name))')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false })

      if (error) this.error = error.message
      this.reviews = data || []
      this.loading = false
    },

    // One review per user per route, so this upserts on that pair. Incidents are
    // replaced wholesale — simpler than diffing, and there are at most three.
    async save({ routeId, userId, rating, perceivedDifficulty, completed, reviewText, incidents }) {
      this.error = null

      const { data: review, error } = await supabase
        .from('reviews')
        .upsert(
          {
            route_id: routeId,
            user_id: userId,
            rating,
            perceived_difficulty: perceivedDifficulty,
            completed,
            review_text: reviewText,
          },
          { onConflict: 'route_id,user_id' },
        )
        .select()
        .single()

      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }

      await supabase.from('review_incidents').delete().eq('review_id', review.id)

      if (incidents.length) {
        const { error: incidentError } = await supabase.from('review_incidents').insert(
          incidents.map((i) => ({
            review_id: review.id,
            route_id: routeId,
            point_id: i.pointId || null,
            category: i.category,
            note: i.note,
          })),
        )
        if (incidentError) {
          this.error = incidentError.message
          return { success: false, error: incidentError.message }
        }
      }

      await this.fetchForRoute(routeId)
      return { success: true }
    },

    async remove(reviewId, routeId) {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }
      await this.fetchForRoute(routeId)
      return { success: true }
    },

    async fetchAllForModeration() {
      this.loading = true
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(display_name), routes(name), review_incidents(*)')
        .order('created_at', { ascending: false })
      if (error) this.error = error.message
      this.reviews = data || []
      this.loading = false
    },

    async removeIncident(incidentId) {
      const { error } = await supabase.from('review_incidents').delete().eq('id', incidentId)
      if (error) this.error = error.message
      return !error
    },
  },
})
