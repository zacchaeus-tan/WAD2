<script setup>
import { formatDate } from '@/lib/format'

defineProps({
  weather: { type: Object, default: null },
  error: { type: String, default: '' },
})
</script>

<template>
  <section class="mb-4">
    <h2 class="h5">Conditions at the trailhead</h2>
    <div v-if="error" class="alert alert-secondary small">Weather unavailable: {{ error }}</div>
    <div v-else-if="weather" class="card"><div class="card-body">
      <p class="mb-2">
        <strong>{{ weather.current.temperature_2m }} °C</strong> now ·
        wind {{ weather.current.wind_speed_10m }} km/h ·
        humidity {{ weather.current.relative_humidity_2m }}% ·
        rain {{ weather.current.precipitation }} mm
      </p>
      <table class="table table-sm mb-0">
        <thead><tr><th>Date</th><th>High</th><th>Low</th><th>Rain</th></tr></thead>
        <tbody>
          <tr v-for="day in weather.days" :key="day.date">
            <td>{{ formatDate(day.date) }}</td><td>{{ day.max }} °C</td>
            <td>{{ day.min }} °C</td><td>{{ day.rain }} mm</td>
          </tr>
        </tbody>
      </table>
    </div></div>
  </section>
</template>
