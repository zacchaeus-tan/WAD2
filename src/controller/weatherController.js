import { fetchStartForecast, fetchSummitForecast } from '@/model/weatherModel'

// Warning thresholds
const NEAR_FREEZING_C = 2 // feels-like low at or below this
const HIGH_UV = 8 // WHO scale: 8-10 is "very high"
const STRONG_GUST_KMH = 50
const STORM_CAPE = 1000 // J/kg of storm energy; thunderstorms can form above this
const STORM_CODES = [95, 96, 99] // Open-Meteo's thunderstorm weather codes
const MORNING_DRY_PERCENT = 30 // morning rain chance at or below this
const AFTERNOON_WET_PERCENT = 60 //afternoon rain chance at or above this
const RECENT_RAIN_MM = 30 // rain over the RECENT_RAIN_DAYS before a day

// Must match past_days in fetchStartForecast() in weatherModel.
const RECENT_RAIN_DAYS = 3

// Specify the hours of the day (route's local time), from and to inclusive
const MORNING_HOURS = [6, 11]
const AFTERNOON_HOURS = [12, 17]
const DAYTIME_HOURS = [6, 17]

// Only show summit temperatures when the top is at least this far above
const MIN_SUMMIT_GAIN_M = 500

// Skips missing (null) values
function maxOf(values) {
  const present = values.filter((value) => value !== null && value !== undefined)
  return present.length ? Math.max(...present) : null
}

function minOf(values) {
  const present = values.filter((value) => value !== null && value !== undefined)
  return present.length ? Math.min(...present) : null
}

function averageOf(values) {
  const present = values.filter((value) => value !== null && value !== undefined)
  return present.length ? Math.round(present.reduce((sum, value) => sum + value, 0) / present.length) : null
}

// The hourly entries for one date, each with its hour of the day (0-23)
function hoursOn(hourly, date) {
  const hours = []
  hourly.time.forEach((time, i) => {
    if (time.startsWith(date)) {
      hours.push({
        hour: Number(time.slice(11, 13)),
        rainChance: hourly.precipitation_probability[i],
        humidity: hourly.relative_humidity_2m[i],
        visibility: hourly.visibility[i],
        cape: hourly.cape[i],
      })
    }
  })
  return hours
}

function between(hours, [from, to]) {
  return hours.filter((h) => h.hour >= from && h.hour <= to)
}

export function warningsFor(day) {
  const warnings = []

  const coldest = day.summit ? day.summit.feelsMin : day.feelsMin
  if (coldest !== null && coldest <= NEAR_FREEZING_C) {
    warnings.push(day.summit ? 'Near-freezing at summit' : 'Near-freezing')
  }
  if (STORM_CODES.includes(day.code) || day.maxCape >= STORM_CAPE) {
    warnings.push('Thunderstorm risk')
  }
  if (
    day.morningRainChance !== null &&
    day.afternoonRainChance !== null &&
    day.morningRainChance <= MORNING_DRY_PERCENT &&
    day.afternoonRainChance >= AFTERNOON_WET_PERCENT
  ) {
    warnings.push('Rain likely after midday')
  }
  if (day.gustMax >= STRONG_GUST_KMH) {
    warnings.push('Strong gusts')
  }
  if (day.uv >= HIGH_UV) {
    warnings.push('Very high UV')
  }
  if (day.recentRain >= RECENT_RAIN_MM) {
    warnings.push('Heavy recent rain: muddy trail, check river crossings')
  }

  return warnings
}

// summit is null when the route has no altitude_m.
export function summariseWeather(start, summit, altitude) {
  const daily = start.daily
  const showSummit = summit !== null && altitude - start.elevation >= MIN_SUMMIT_GAIN_M

  const days = []
  // The first RECENT_RAIN_DAYS entries are past days, only used for recentRain
  for (let i = RECENT_RAIN_DAYS; i < daily.time.length; i++) {
    const date = daily.time[i]
    const hours = hoursOn(start.hourly, date)
    const summitIndex = showSummit ? summit.daily.time.indexOf(date) : -1

    const day = {
      date,
      code: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      feelsMax: daily.apparent_temperature_max[i],
      feelsMin: daily.apparent_temperature_min[i],
      rain: daily.precipitation_sum[i],
      rainHours: daily.precipitation_hours[i],
      rainChance: daily.precipitation_probability_max[i],
      morningRainChance: maxOf(between(hours, MORNING_HOURS).map((h) => h.rainChance)),
      afternoonRainChance: maxOf(between(hours, AFTERNOON_HOURS).map((h) => h.rainChance)),
      windMax: daily.wind_speed_10m_max[i],
      gustMax: daily.wind_gusts_10m_max[i],
      uv: daily.uv_index_max[i],
      minVisibility: minOf(between(hours, DAYTIME_HOURS).map((h) => h.visibility)),
      humidity: averageOf(hours.map((h) => h.humidity)),
      maxCape: maxOf(hours.map((h) => h.cape)),
      sunrise: daily.sunrise[i].slice(11),
      sunset: daily.sunset[i].slice(11),
      recentRain: daily.precipitation_sum
        .slice(i - RECENT_RAIN_DAYS, i)
        .reduce((sum, mm) => sum + (mm ?? 0), 0),
      summit:
        summitIndex === -1
          ? null
          : {
            max: summit.daily.temperature_2m_max[summitIndex],
            min: summit.daily.temperature_2m_min[summitIndex],
            feelsMax: summit.daily.apparent_temperature_max[summitIndex],
            feelsMin: summit.daily.apparent_temperature_min[summitIndex],
          },
    }
    day.warnings = warningsFor(day)
    days.push(day)
  }

  return {
    current: start.current,
    summitCurrent: showSummit ? summit.current : null,
    summitElevation: showSummit ? altitude : null,
    days,
  }
}

export async function fetchRouteWeather(route) {
  if (!route || route.latitude == null || route.longitude == null) {
    throw new Error('This route has no coordinates for a weather forecast.')
  }

  const hasAltitude = route.altitude_m != null
  const [start, summit] = await Promise.all([
    fetchStartForecast(route.latitude, route.longitude),
    hasAltitude ? fetchSummitForecast(route.latitude, route.longitude, route.altitude_m) : null,
  ])

  return summariseWeather(start, summit, route.altitude_m)
}
