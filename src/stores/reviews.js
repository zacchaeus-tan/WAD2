import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useReviewsStore = defineStore('reviews', {
  state: () => ({
    reviews: [],
  }),
  actions: {
    async fetchReviewsForRoute(routeId) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('route_id', routeId)
      if (!error) this.reviews = data
    },
  },
})