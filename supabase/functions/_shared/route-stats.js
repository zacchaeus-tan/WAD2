// Feature 4 maths: turns a route's reviews and incident notes into the
// community figures stored on `routes`. Pure functions, no database access,
// so they are easy to read and test.
//
//   review   = { rating, perceived_difficulty (1-4 or null), completed }
//   incident = { severity (1-3), label, userId }

const round = (value, places) => {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

const average = (values) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null

// Weighted average of community difficulty against the official grade.
//   K     = official rating counts as this many reviews (prior weight)
//   GATE  = ignore divergence smaller than half a grade
//   CLAMP = community can move the grade by at most one step
// Reviews from people who did not finish count half: useful signal, but they
// may have turned back for reasons unrelated to the route.
export function calcEffectiveDifficulty(official, reviews) {
  const K = 5
  const GATE = 0.5
  const CLAMP = 1

  let sumW = 0
  let sumWP = 0
  for (const review of reviews) {
    if (review.perceived_difficulty == null) continue
    const w = review.completed ? 1 : 0.5
    sumW += w
    sumWP += w * review.perceived_difficulty
  }

  if (sumW === 0) return official

  const community = sumWP / sumW
  if (Math.abs(community - official) < GATE) return official

  const blended = (K * official + sumWP) / (K + sumW)
  const clamped = Math.min(Math.max(blended, official - CLAMP), official + CLAMP)
  return round(Math.min(Math.max(clamped, 1), 4), 2)
}

// Severity-weighted incidents per review. The +3 stops one report on a
// barely-reviewed route from reading as dangerous.
export function calcHazardScore(incidents, reviewCount) {
  const SMOOTHING = 3
  const total = incidents.reduce((sum, i) => sum + (i.severity || 0), 0)
  return round(total / (reviewCount + SMOOTHING), 3)
}

export function calcHazardLevel(score) {
  if (score > 0.4) return 'elevated'
  if (score >= 0.15) return 'moderate'
  return 'low'
}

// "2 hikers reported: lost the trail / unclear junction" for the most-reported
// incident type (ties broken alphabetically), or null when hazard is low.
function hazardNote(incidents, level) {
  if (level === 'low' || !incidents.length) return null

  const byLabel = new Map()
  for (const i of incidents) {
    const entry = byLabel.get(i.label) ?? { count: 0, users: new Set() }
    entry.count += 1
    entry.users.add(i.userId)
    byLabel.set(i.label, entry)
  }

  const [label, { users }] = [...byLabel.entries()].sort(
    ([labelA, a], [labelB, b]) => b.count - a.count || labelA.localeCompare(labelB),
  )[0]

  return `${users.size} ${users.size === 1 ? 'hiker' : 'hikers'} reported: ${label.toLowerCase()}`
}

// Every cached community column on `routes`, ready to pass to .update().
export function computeRouteStats(official, reviews, incidents) {
  const avgRating = average(reviews.map((r) => r.rating))
  const avgPerceived = average(
    reviews.filter((r) => r.perceived_difficulty != null).map((r) => r.perceived_difficulty),
  )
  const completionRate = average(reviews.map((r) => (r.completed ? 1 : 0)))

  const hazardLevel = calcHazardLevel(calcHazardScore(incidents, reviews.length))

  return {
    avg_rating: avgRating == null ? null : round(avgRating, 2),
    avg_perceived_difficulty: avgPerceived == null ? null : round(avgPerceived, 2),
    review_count: reviews.length,
    completion_rate: completionRate == null ? null : round(completionRate, 3),
    effective_difficulty: calcEffectiveDifficulty(official, reviews),
    community_hazard_level: hazardLevel,
    community_hazard_note: hazardNote(incidents, hazardLevel),
    stats_updated_at: new Date().toISOString(),
  }
}
