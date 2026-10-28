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
  <article class="itinerary-day">
    <p class="cairn-label">
      Day {{ day.day }}<template v-if="formattedDate"> · {{ formattedDate }}</template>
    </p>
    <h3 class="itinerary-day-title">{{ day.title }}</h3>
    <p v-if="day.start || day.end" class="itinerary-day-way">{{ day.start }} → {{ day.end }}</p>

    <p class="itinerary-day-facts cairn-data">
      <span v-if="day.distance_km != null">{{ day.distance_km }} km</span>
      <span v-if="day.elevation_gain_m != null">+{{ day.elevation_gain_m }} m</span>
      <span v-if="day.est_hours != null">~{{ day.est_hours }} h</span>
    </p>

    <ul v-if="day.highlights && day.highlights.length" class="itinerary-day-highlights">
      <li v-for="highlight in day.highlights" :key="highlight">{{ highlight }}</li>
    </ul>

    <p v-if="day.notes" class="itinerary-day-notes">{{ day.notes }}</p>
  </article>
</template>

<style scoped>
.itinerary-day {
  display: grid;
  align-content: start;
  gap: 8px;
  height: 100%;
  padding: 20px 22px;
  border-top: 3px solid var(--ink);
  background: var(--white);
}

.itinerary-day .cairn-label {
  color: var(--granite-700);
}

.itinerary-day-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
}

.itinerary-day-way {
  font-size: 15px;
}

.itinerary-day-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  color: var(--granite-700);
  font-size: 13px;
  font-weight: 500;
}

.itinerary-day-highlights {
  margin: 0;
  padding-left: 18px;
  font-size: 15px;
  line-height: 22px;
}

.itinerary-day-notes {
  color: var(--granite-700);
  font-size: 14px;
  line-height: 21px;
}
</style>
