const BASE = 'https://api.open-meteo.com/v1/forecast'

const CURRENT = [
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'precipitation',
].join(',')

const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_hours',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'uv_index_max',
  'sunrise',
  'sunset',
].join(',')

const HOURLY = [
  'precipitation_probability',
  'relative_humidity_2m',
  'visibility',
  'cape',
].join(',')

const SUMMIT_DAILY = [
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
].join(',')

async function request(params) {
  const response = await fetch(`${BASE}?${new URLSearchParams(params)}`)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(`Weather API returned ${response.status}: ${body.reason ?? 'no reason given'}`)
  }
  return response.json()
}

// get the 3 past days data to warn for trail conditions like "Heavy recent rain: muddy trail..."
export function fetchStartForecast(latitude, longitude) {
  return request({
    latitude,
    longitude,
    current: CURRENT,
    daily: DAILY,
    hourly: HOURLY,
    timezone: 'auto',
    forecast_days: '7',
    past_days: '3',
  })
}

// Temperatures at the route's highest point. Same coordinates but at the height of the summit. NOT EXACTLY AT THE SUMMIT
export function fetchSummitForecast(latitude, longitude, elevation) {
  return request({
    latitude,
    longitude,
    elevation,
    current: 'temperature_2m',
    daily: SUMMIT_DAILY,
    timezone: 'auto',
    forecast_days: '7',
  })
}
