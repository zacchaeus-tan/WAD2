<script setup>
import { useRoutesStore } from '@/stores/routes'

const routesStore = useRoutesStore()
</script>

<template>
  <section class="mb-4">
    <h2 class="h5">Day by day</h2>
    <p v-if="!routesStore.itineraryDays.length" class="text-muted small">
      No itinerary has been added for this route yet.
    </p>
    <div v-for="day in routesStore.itineraryDays" :key="day.id" class="card mb-2"><div class="card-body">
      <h3 class="h6">Day {{ day.day_number }}</h3>
      <p class="small mb-1">
        {{ day.distance_km }} km · +{{ day.elevation_gain_m }} m / −{{ day.elevation_loss_m }} m ·
        {{ day.estimated_hours }} h
      </p>
      <p v-if="day.overnight_stop" class="small mb-1">
        Overnight: {{ day.overnight_stop }}
        <span v-if="day.overnight_altitude_m">({{ day.overnight_altitude_m }} m)</span>
        <span v-if="day.facilities"> · {{ day.facilities }}</span>
      </p>
      <div v-for="w in routesStore.warningsForDay(day.day_number)" :key="w.point_id + w.category" class="alert alert-warning py-2 small mb-0 mt-2">
        <strong>{{ w.label }}</strong> at {{ w.point_name }} — reported by {{ w.reporter_count }} hikers.
        Latest: "{{ w.latest_note }}"
      </div>
    </div></div>

    <details v-if="routesStore.points.length" class="mb-2">
      <summary class="small text-muted">Checkpoints on this route ({{ routesStore.points.length }})</summary>
      <ul class="small mt-2">
        <li v-for="p in routesStore.points" :key="p.id">
          {{ p.name }} <span class="text-muted">— {{ p.point_type }}<span v-if="p.altitude_m">, {{ p.altitude_m }} m</span></span>
        </li>
      </ul>
    </details>
  </section>
</template>
