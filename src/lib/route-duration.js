const WALKING_SPEED_KM_PER_HOUR = 4
const ASCENT_METERS_PER_HOUR = 600
const HIKING_HOURS_PER_DAY = 7
const TERRAIN_AND_BREAKS_FACTOR = 1.2

export function estimateRouteDurationDays(distanceKm, elevationGainM = 0) {
  const distance = Number(distanceKm)
  const rawElevationGain = Number(elevationGainM)
  const elevationGain = Number.isFinite(rawElevationGain) ? Math.max(rawElevationGain, 0) : 0
  if (!Number.isFinite(distance) || distance <= 0) return null

  const estimatedHours =
    (distance / WALKING_SPEED_KM_PER_HOUR + elevationGain / ASCENT_METERS_PER_HOUR) *
    TERRAIN_AND_BREAKS_FACTOR
  return Math.max(1, Math.ceil(estimatedHours / HIKING_HOURS_PER_DAY))
}

export function withEstimatedRouteDuration(route) {
  const estimate = estimateRouteDurationDays(route.distance_km, route.elevation_gain_m)
  if (estimate == null) return route

  const durationDays = Number(route.duration_days) > 1
    ? Number(route.duration_days)
    : estimate

  return {
    ...route,
    duration_days: durationDays,
    is_multiday: Boolean(route.is_multiday) || durationDays > 1,
  }
}
