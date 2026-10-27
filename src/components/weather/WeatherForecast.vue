<script setup>
import { ref } from 'vue'
import { formatDate, weatherLabel } from '@/lib/format'

defineProps({
  weather: { type: Object, default: null },
  error: { type: String, default: '' },
})

// Which days have their details open, keyed by date
const open = ref({})

function toggle(date) {
  open.value[date] = !open.value[date]
}

// Missing values (null) show as a dash instead of "null"
function show(value, unit = '') {
  return value === null || value === undefined ? '—' : `${value}${unit}`
}

function showVisibility(metres) {
  if (metres === null || metres === undefined) return '—'
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}
</script>

<template>
  <section class="mb-4">
    <h2 class="h5">Weather for the next 7 days</h2>
    <div v-if="error" class="alert alert-secondary small">{{ error }}</div>
    <div v-else-if="weather" class="card">
      <div class="card-body">
        <p class="mb-2">
          Current Weather: <strong>{{ show(weather.current.temperature_2m, ' °C') }}</strong> ·
          wind {{ show(weather.current.wind_speed_10m, ' km/h') }} ·
          humidity {{ show(weather.current.relative_humidity_2m, '%') }} ·
          rain {{ show(weather.current.precipitation, ' mm') }}
        </p>
        <p v-if="weather.summitCurrent" class="mb-2">
          At Summit: <strong>{{ show(weather.summitCurrent.temperature_2m, ' °C') }}</strong>
        </p>
        <p v-if="weather.summitElevation" class="small text-muted">
          At Summit temperatures are for {{ weather.summitElevation }} m up at the route's location, its highest
          point. Not a forecast for the exact summit spot.
        </p>

        <div class="table-responsive">
          <table class="table table-sm align-middle mb-2">
            <thead>
              <tr>
                <th>Date</th>
                <th>Conditions</th>
                <th>High / Low</th>
                <th>Rain</th>
                <th>Sunrise / Sunset</th>
                <th>Warnings</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="day in weather.days" :key="day.date">
                <tr>
                  <td>{{ formatDate(day.date) }}</td>
                  <td>{{ weatherLabel(day.code) }}</td>
                  <td>
                    {{ show(day.max, '°') }} / {{ show(day.min, '°C') }}
                    <div v-if="day.summit" class="small text-muted">
                      At Summit: {{ show(day.summit.max, '°') }} / {{ show(day.summit.min, '°C') }}
                    </div>
                  </td>
                  <td>{{ show(day.rainChance, '%') }} · {{ show(day.rain, ' mm') }}</td>
                  <td>{{ show(day.sunrise) }} / {{ show(day.sunset) }}</td>
                  <td>
                    <span v-for="warning in day.warnings" :key="warning" class="badge text-bg-warning me-1">
                      {{ warning }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-secondary"
                      :aria-expanded="open[day.date] ? 'true' : 'false'" @click="toggle(day.date)">
                      {{ open[day.date] ? 'Hide' : 'Details' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="open[day.date]">
                  <td colspan="7">
                    <ul class="list-unstyled small mb-0">
                      <li>Feels like: {{ show(day.feelsMax, '°') }} / {{ show(day.feelsMin, '°C') }}</li>
                      <li v-if="day.summit">
                        At Summit, feels like: {{ show(day.summit.feelsMax, '°') }} /
                        {{ show(day.summit.feelsMin, '°C') }}
                      </li>
                      <li>Hours of rain: {{ show(day.rainHours, ' h') }}</li>
                      <li>
                        Rain chance: morning {{ show(day.morningRainChance, '%') }}, afternoon
                        {{ show(day.afternoonRainChance, '%') }}
                      </li>
                      <li>Wind: up to {{ show(day.windMax, ' km/h') }}, gusts {{ show(day.gustMax, ' km/h') }}</li>
                      <li>UV index: {{ show(day.uv) }}</li>
                      <li>Lowest daytime visibility: {{ showVisibility(day.minVisibility) }}</li>
                      <li>Average humidity: {{ show(day.humidity, '%') }}</li>
                    </ul>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <p class="small text-muted mb-0">
          Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>
        </p>
      </div>
    </div>
  </section>
</template>
