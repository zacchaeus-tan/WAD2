import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { difficultyLabel } from '@/lib/format'

// The verdict comes from the database functions, not from prose generation.
// The explanation is assembled here; swapping it for an LLM call later only
// replaces buildExplanation().
function buildExplanation(route, profile, demand) {
  const gap = Number(profile.fitness_score) - Number(demand)
  const parts = []

  parts.push(
    `${route.name} asks for ${route.elevation_gain_m} m of climbing over ` +
      `${route.distance_km} km across ${route.duration_days} day${route.duration_days > 1 ? 's' : ''}, ` +
      `topping out at ${route.altitude_m} m.`,
  )

  if (profile.longest_distance_km || profile.max_elevation_gain_m) {
    parts.push(
      `Your longest hike so far is ${profile.longest_distance_km || 0} km with ` +
        `${profile.max_elevation_gain_m || 0} m of gain.`,
    )
  }

  if (gap < -20) {
    parts.push('That is a large step up from what you have described — treat this as a goal to build towards, not a trip to book yet.')
  } else if (gap < -5) {
    parts.push('That is a meaningful step up, so give yourself a training block before committing.')
  } else if (gap < 10) {
    parts.push('That sits close to what you have already done, so it should be manageable with normal preparation.')
  } else {
    parts.push('That is comfortably within what you have already handled.')
  }

  if (Number(route.effective_difficulty) > Number(route.official_difficulty)) {
    parts.push(
      `Hikers rate this harder than its official ${difficultyLabel(route.official_difficulty)} grade, ` +
        `so the match uses an effective difficulty of ${route.effective_difficulty} (${difficultyLabel(route.effective_difficulty)}).`,
    )
  }

  if (route.community_hazard_level !== 'low' && route.community_hazard_note) {
    parts.push(`Community hazard reports are ${route.community_hazard_level}: ${route.community_hazard_note}.`)
  }

  return parts.join(' ')
}

function buildTips(route, profile) {
  const tips = []
  if (Number(route.elevation_gain_m) > Number(profile.max_elevation_gain_m || 0) * 1.5) {
    tips.push(`Build up to a ${Math.round(route.elevation_gain_m / (route.duration_days || 1))} m gain day with a loaded pack.`)
  }
  if (Number(route.altitude_m) > 2500 && Number(profile.highest_altitude_m || 0) < 2500) {
    tips.push('You have not been this high before — plan for a slow first day and watch for altitude symptoms.')
  }
  if (route.duration_days > 1) {
    tips.push('Practise at least one back-to-back weekend so consecutive days are not a surprise.')
  }
  if (route.guide_required) tips.push('A guide is mandatory on this route — book before you travel.')
  return tips.slice(0, 3)
}

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

      const { data: demand, error: demandError } = await supabase.rpc('calc_route_demand', {
        p_distance_km: route.distance_km,
        p_elevation_gain: route.elevation_gain_m,
        p_altitude_m: route.altitude_m,
        p_duration_days: route.duration_days,
        p_difficulty: route.effective_difficulty,
      })

      if (demandError) {
        this.error = demandError.message
        this.loading = false
        return
      }

      const { data: verdict, error: verdictError } = await supabase.rpc('calc_match_verdict', {
        p_fitness: profile.fitness_score,
        p_demand: demand,
      })

      if (verdictError) {
        this.error = verdictError.message
        this.loading = false
        return
      }

      const explanation = buildExplanation(route, profile, demand)
      const tips = buildTips(route, profile)

      this.result = {
        fitness_score: Number(profile.fitness_score),
        route_demand: Number(demand),
        verdict,
        explanation,
        tips,
        effective_difficulty: route.effective_difficulty,
      }

      await supabase.from('match_results').upsert(
        {
          user_id: profile.id,
          route_id: route.id,
          fitness_score: profile.fitness_score,
          route_demand: demand,
          verdict,
          explanation,
          tips,
          effective_difficulty: route.effective_difficulty,
          model: 'rules-v1',
        },
        { onConflict: 'user_id,route_id' },
      )

      this.loading = false
    },
  },
})
