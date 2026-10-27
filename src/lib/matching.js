// Route suitability rules.

// A route may go up to 25% beyond what you've done before and still count as
// within your experience. Hiking and mountaineering training advice is to build
// up distance and climb gradually rather than in big jumps.
const STRETCH_FACTOR = 1.25

// Acute mountain sickness becomes a real risk from about 2500 m
// (CDC Yellow Book; Wilderness Medical Society guidelines).
const AMS_ALTITUDE_M = 2500

// Day < overnight < multiday
// Having done a longer trip covers the shorter ones.
const TRIP_TYPE_DAYS = { day: 1, overnight: 2, multiday: 3 }

const TRIP_TYPE_LABELS = { day: 'a day hike', overnight: 'an overnight hike', multiday: 'a multi-day trek' }

// Each quiz experience level copes with routes up to this difficulty grade.
const EXPERIENCE_GRADE = { beginner: 1, occasional: 2, regular: 3, experienced: 4 }

const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Strenuous' }

function round(value) {
  return Math.round(value * 10) / 10
}

function isMissing(value) {
  return value === null || value === undefined
}

// 1 day = day hike, 2 days = one night out, 3+ days = multi-day trek.
export function tripType(route) {
  const days = Number(route.duration_days)
  if (days >= 3) return 'multiday'
  if (days === 2) return 'overnight'
  if (days === 1) return 'day'
  return route.is_multiday ? 'multiday' : 'day'
}

function tripDays(route) {
  const days = Number(route.duration_days)
  return days > 1 ? days : 1
}

// Distance and elevation gain are compared per day: your longest hike was most
// likely done in one day, so a 2-day route is judged on what each day asks of you.
function checkAmount(rule, label, unit, routeTotal, days, done) {
  if (isMissing(routeTotal)) {
    return { rule, status: 'unknown', message: `This route has no ${label} data.` }
  }
  if (isMissing(done)) {
    return { rule, status: 'unknown', message: `We don't know your ${label} yet.` }
  }

  const needed = routeTotal / days
  const perDay = days > 1 ? ` a day (${round(routeTotal)} ${unit} over ${days} days)` : ''
  const asked = `${round(needed)} ${unit}${perDay}`

  if (needed <= done * STRETCH_FACTOR) {
    return { rule, status: 'pass', message: `${asked} is within your experience (${round(done)} ${unit}).` }
  }
  return { rule, status: 'fail', message: `${asked} is more than 25% beyond your ${round(done)} ${unit}.` }
}

function checkAltitude(route, profile) {
  const needed = route.altitude_m
  const done = profile.highest_altitude_m

  if (isMissing(needed)) {
    return { rule: 'altitude', status: 'unknown', message: 'This route has no altitude data.' }
  }
  if (isMissing(done)) {
    return { rule: 'altitude', status: 'unknown', message: "We don't know the highest altitude you've reached yet." }
  }
  if (needed <= done * STRETCH_FACTOR) {
    return { rule: 'altitude', status: 'pass', message: `Peaks at ${round(needed)} m, within your experience (${round(done)} m).` }
  }
  return { rule: 'altitude', status: 'fail', message: `Peaks at ${round(needed)} m, more than 25% above your highest (${round(done)} m).` }
}

// Uses the community-adjusted difficulty when there is one, else the official grade.
function checkDifficulty(route, experienceLevel) {
  const difficulty = route.effective_difficulty ?? route.official_difficulty
  const level = EXPERIENCE_GRADE[experienceLevel]

  if (isMissing(difficulty)) {
    return { rule: 'difficulty', status: 'unknown', message: 'This route has no difficulty grade.' }
  }
  if (!level) {
    return { rule: 'difficulty', status: 'unknown', message: "We don't know your experience level yet." }
  }

  const grade = Math.round(Number(difficulty))
  const label = DIFFICULTY_LABELS[grade]

  if (grade <= level) {
    return { rule: 'difficulty', status: 'pass', message: `Rated ${label}, which suits your experience level (${experienceLevel}).` }
  }
  return { rule: 'difficulty', status: 'fail', message: `Rated ${label}, harder than your experience level (${experienceLevel}) usually takes on.` }
}

function checkTripType(route, longestTrekDays) {
  const needed = tripType(route)

  if (isMissing(longestTrekDays)) {
    return { rule: 'trip_type', status: 'unknown', message: "We don't know the longest trek you've done yet." }
  }

  if (longestTrekDays >= TRIP_TYPE_DAYS[needed]) {
    return { rule: 'trip_type', status: 'pass', message: `You've done ${TRIP_TYPE_LABELS[needed]} or longer before.` }
  }
  return { rule: 'trip_type', status: 'fail', message: `This is ${TRIP_TYPE_LABELS[needed]}, longer than any trip you've done.` }
}

// Safety notes that are shown alongside the verdict but do not change it.
function safetyWarnings(route, profile) {
  const warnings = []
  const highest = profile.highest_altitude_m

  if (route.altitude_m >= AMS_ALTITUDE_M && (isMissing(highest) || highest < AMS_ALTITUDE_M)) {
    warnings.push(
      `This route goes above ${AMS_ALTITUDE_M} m, where altitude sickness becomes a risk. ` +
        'Ascend slowly, drink plenty of water, and turn back if you get a bad headache, nausea or dizziness.',
    )
  }

  return warnings
}

// Returns { verdict, failedCount, checks, warnings }, where verdict is
// 'comfortable' (no rule failed), 'good_challenge' (1-2 failed), 'stretch' (3+ failed)
// or 'unknown' (no rule could be checked).
export function checkRouteSuitability(profile, route) {
  const days = tripDays(route)

  const checks = [
    checkDifficulty(route, profile.experience_level),
    checkAmount('distance', 'longest hike distance', 'km', route.distance_km, days, profile.longest_distance_km),
    checkAmount('elevation_gain', 'biggest elevation gain', 'm', route.elevation_gain_m, days, profile.max_elevation_gain_m),
    checkAltitude(route, profile),
    checkTripType(route, profile.longest_trek_days),
  ]

  const failedCount = checks.filter((check) => check.status === 'fail').length
  const checkedCount = checks.filter((check) => check.status === 'pass' || check.status === 'fail').length

  let verdict
  if (checkedCount === 0) verdict = 'unknown'
  else if (failedCount === 0) verdict = 'comfortable'
  else if (failedCount <= 2) verdict = 'good_challenge'
  else verdict = 'stretch'

  return { verdict, failedCount, checks, warnings: safetyWarnings(route, profile) }
}
