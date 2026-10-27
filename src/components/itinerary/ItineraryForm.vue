<script setup>
import { computed, ref } from 'vue'
import {
  LONG_ITINERARY_DAYS,
  PACES,
  maxDaysFor,
  todayString,
} from '@/controller/itineraryController'

const props = defineProps({
  route: Object,
  loading: Boolean,
})

const emit = defineEmits(['generate'])

const maxDays = computed(() => maxDaysFor(props.route))

const today = todayString()
const startDate = ref(today)
const days = ref(props.route.duration_days > 0 ? Math.min(props.route.duration_days, maxDays.value) : 1)
const pace = ref('moderate')

const isValid = computed(
  () =>
    startDate.value >= today &&
    Number.isInteger(days.value) &&
    days.value >= 1 &&
    days.value <= maxDays.value,
)

const isLong = computed(() => days.value > LONG_ITINERARY_DAYS)

function submit() {
  emit('generate', {
    startDate: startDate.value,
    days: days.value,
    pace: pace.value,
  })
}
</script>

<template>
  <form class="row g-3 align-items-end" @submit.prevent="submit">
    <div class="col-12 col-md-4">
      <label for="itinerary-start" class="form-label">Start date</label>
      <input
        id="itinerary-start"
        v-model="startDate"
        type="date"
        class="form-control"
        :min="today"
        required
      />
    </div>

    <div class="col-6 col-md-3">
      <label for="itinerary-days" class="form-label">Number of days</label>
      <input
        id="itinerary-days"
        v-model.number="days"
        type="number"
        class="form-control"
        min="1"
        :max="maxDays"
        required
      />
    </div>

    <div class="col-6 col-md-3">
      <label for="itinerary-pace" class="form-label">Pace</label>
      <select id="itinerary-pace" v-model="pace" class="form-select">
        <option v-for="p in PACES" :key="p" :value="p">
          {{ p.charAt(0).toUpperCase() + p.slice(1) }}
        </option>
      </select>
    </div>

    <div class="col-12 col-md-2 d-grid">
      <button type="submit" class="btn btn-primary" :disabled="!isValid || loading">
        <span
          v-if="loading"
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        ></span>
        {{ loading ? 'Generating' : 'Generate' }}
      </button>
    </div>

    <p class="col-12 form-text mt-2 mb-0">
      <template v-if="route.duration_days">Usually {{ route.duration_days }} days · </template>
      up to {{ maxDays }} days
      <template v-if="isLong"> · longer itineraries can take up to a minute to generate</template>
    </p>
  </form>
</template>
