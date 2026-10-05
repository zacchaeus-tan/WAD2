// Open-Meteo needs no API key, so the call can run straight from the client
// for now. Moving it behind an edge function later only changes this file.
const BASE = 'https://api.open-meteo.com/v1/forecast'

export async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
    forecast_days: '5',
  })

  const response = await fetch(`${BASE}?${params}`)
  if (!response.ok) throw new Error(`Weather API returned ${response.status}`)

  const data = await response.json()
  return {
    current: data.current,
    units: data.current_units,
    days: data.daily.time.map((date, i) => ({
      date,
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      rain: data.daily.precipitation_sum[i],
    })),
  }
}
