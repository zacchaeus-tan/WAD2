import { defineStore } from 'pinia'
import * as matchingService from '@/services/matching.service'

export const useMatchStore = defineStore('match', {
  state: () => ({
    result: null,
    loading: false,
    error: null,
  }),

  actions: {
    async computeForRoute(route, profile) {
      this.loading = true
      this.error = null
      this.result = null

      if (!profile?.fitness_score) {
        this.loading = false
        return
      }

      const demand = matchingService.calcRouteDemand(route)
      const verdict = matchingService.calcMatchVerdict(profile.fitness_score, demand)
      const { explanation, tips, model } = matchingService.explainMatch(route, profile, demand)

      this.result = {
        fitness_score: Number(profile.fitness_score),
        route_demand: Number(demand),
        verdict,
        explanation,
        tips,
        effective_difficulty: route.effective_difficulty,
      }

      await matchingService.saveMatchResult({
        user_id: profile.id,
        route_id: route.id,
        fitness_score: profile.fitness_score,
        route_demand: demand,
        verdict,
        explanation,
        tips,
        effective_difficulty: route.effective_difficulty,
        model,
      })

      this.loading = false
    },
  },
})
