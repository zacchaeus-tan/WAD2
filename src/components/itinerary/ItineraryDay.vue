<script setup>
import { computed } from 'vue'

const props = defineProps({
  day: Object,
})

// e.g. "Mon, 2 Nov 2026"
const formattedDate = computed(() => {
  if (!props.day.date) {
    return ''
  }
  return new Date(`${props.day.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})
</script>

<template>
  <article class="card h-100">
    <div class="card-body">
      <p class="text-body-secondary small mb-1">
        Day {{ day.day }}<template v-if="formattedDate"> · {{ formattedDate }}</template>
      </p>
      <h3 class="h5 card-title">{{ day.title }}</h3>
      <p v-if="day.start || day.end" class="mb-2">{{ day.start }} → {{ day.end }}</p>

      <ul class="list-inline small mb-3">
        <li v-if="day.distance_km != null" class="list-inline-item">{{ day.distance_km }} km</li>
        <li v-if="day.elevation_gain_m != null" class="list-inline-item">
          +{{ day.elevation_gain_m }} m
        </li>
        <li v-if="day.est_hours != null" class="list-inline-item">~{{ day.est_hours }} h</li>
      </ul>

      <ul v-if="day.highlights && day.highlights.length" class="mb-3">
        <li v-for="highlight in day.highlights" :key="highlight">{{ highlight }}</li>
      </ul>

      <p v-if="day.notes" class="card-text small mb-0">{{ day.notes }}</p>
    </div>
  </article>
</template>
