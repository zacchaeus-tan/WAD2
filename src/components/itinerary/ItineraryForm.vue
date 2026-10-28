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
  <form class="itinerary-form" @submit.prevent="submit">
    <label class="itinerary-field" for="itinerary-start">
      <span class="cairn-label">Start date</span>
      <input id="itinerary-start" v-model="startDate" type="date" class="cairn-input" :min="today" required />
    </label>

    <label class="itinerary-field" for="itinerary-days">
      <span class="cairn-label">Number of days</span>
      <input
        id="itinerary-days"
        v-model.number="days"
        type="number"
        class="cairn-input"
        min="1"
        :max="maxDays"
        required
      />
    </label>

    <div class="itinerary-field">
      <span id="itinerary-pace" class="cairn-label">Pace</span>
      <div class="itinerary-pace" role="group" aria-labelledby="itinerary-pace">
        <button
          v-for="p in PACES"
          :key="p"
          type="button"
          :aria-pressed="pace === p ? 'true' : 'false'"
          @click="pace = p"
        >
          {{ p.charAt(0).toUpperCase() + p.slice(1) }}
        </button>
      </div>
    </div>

    <button type="submit" class="cairn-btn is-blaze" :disabled="!isValid || loading">
      {{ loading ? 'Generating...' : 'Generate plan' }}
    </button>

    <p class="itinerary-hint cairn-fine">
      <template v-if="route.duration_days">Usually {{ route.duration_days }} days · </template>
      up to {{ maxDays }} days
      <template v-if="isLong"> · longer itineraries can take up to a minute to generate</template>
    </p>
  </form>
</template>

<style scoped>
.itinerary-form {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr auto auto;
  align-items: end;
  gap: 16px 20px;
}

.itinerary-field {
  display: grid;
  gap: 8px;
}

.itinerary-field .cairn-label {
  color: var(--granite-700);
}

.itinerary-pace {
  display: inline-flex;
  width: max-content;
  border: 2px solid var(--ink);
}

.itinerary-pace button {
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  background: var(--white);
  color: var(--ink);
  font: 700 13px var(--font);
  cursor: pointer;
}

.itinerary-pace button + button {
  border-left: 1px solid var(--ink);
}

.itinerary-pace button[aria-pressed='true'] {
  background: var(--ink);
  color: var(--ground);
}

.itinerary-pace button:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

.itinerary-hint {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .itinerary-form {
    grid-template-columns: 1fr 1fr;
  }

  .itinerary-form .cairn-btn {
    grid-column: 1 / -1;
  }
}
</style>
