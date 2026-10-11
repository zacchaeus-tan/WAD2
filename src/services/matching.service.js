import { supabase } from '@/lib/supabase'
import { difficultyLabel } from '@/lib/format'

const EXPERIENCE_POINTS = { beginner: 0, occasional: 8, regular: 16, experienced: 25 }

const round1 = (value) => Math.round(value * 10) / 10
// Share of a benchmark reached, capped at 1 (e.g. 45 km against 30 km → 1).
const capped = (value, benchmark) => Math.min((Number(value) || 0) / benchmark, 1)

// 0-100 from the onboarding quiz answers.
//   experience 25 + longest distance 25 + elevation gain 30 + altitude 20
export function calcFitnessScore({ experienceLevel, longestDistanceKm, maxElevationGainM, highestAltitudeM }) {
  return round1(
    (EXPERIENCE_POINTS[String(experienceLevel || '').toLowerCase()] ?? 0) +
      capped(longestDistanceKm, 30) * 25 +
      capped(maxElevationGainM, 2000) * 30 +
      capped(highestAltitudeM, 3500) * 20,
  )
}

// 0-100 for what the route asks of you. Uses effective difficulty, so the
// community's view feeds straight into the match.
//   distance 25 + elevation gain 30 + altitude 20 + extra days 10 + difficulty 15
export function calcRouteDemand(route) {
  const extraDays = Math.max((route.duration_days ?? 1) - 1, 0)
  const difficulty = Math.min(Math.max(Number(route.effective_difficulty ?? 2), 1), 4)
  return round1(
    capped(route.distance_km, 30) * 25 +
      capped(route.elevation_gain_m, 2500) * 30 +
      capped(route.altitude_m, 4000) * 20 +
      Math.min(extraDays * 5, 10) +
      ((difficulty - 1) / 3) * 15,
  )
}

// The verdict is the gap between the two scores. The explanation below, and
// later the LLM, only describe this verdict; they never change it.
export function calcMatchVerdict(fitnessScore, demand) {
  if (fitnessScore == null || demand == null) return 'unknown'
  const gap = Number(fitnessScore) - Number(demand)
  if (gap >= 10) return 'comfortable'
  if (gap >= -5) return 'good_match'
  if (gap >= -20) return 'stretch'
  return 'not_ready'
}

export function saveMatchResult(row) {
  return supabase.from('match_results').upsert(row, { onConflict: 'user_id,route_id' })
}

// The verdict comes from calcMatchVerdict(), not from prose generation. The
// explanation and tips are rules-based for now; swapping them
// for the match-explain Edge Function only replaces explainMatch():
//
//   const { data, error } = await supabase.functions.invoke('match-explain', {
//     body: { routeId: route.id, demand },
//   })
export function explainMatch(route, profile, demand) {
  return {
    explanation: buildExplanation(route, profile, demand),
    tips: buildTips(route, profile),
    model: 'rules-v1',
  }
}

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
