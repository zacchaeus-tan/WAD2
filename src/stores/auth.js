import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useRoutesStore = defineStore('routes', {
  state: () => ({
    routes: [],
    loading: false,
  }),
  actions: {
    async fetchRoutes() {
      this.loading = true
      const { data, error } = await supabase.from('routes').select('*')
      if (!error) this.routes = data
      this.loading = false
    },
  },
})