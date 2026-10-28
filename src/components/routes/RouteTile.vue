<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { GRADES, gradeOf, isCommunityAdjusted } from '@/lib/difficultyStyle'
import DifficultyMark from '@/components/common/DifficultyMark.vue'
import PlaceholderLine from './PlaceholderLine.vue'

const props = defineProps({
  route: { type: Object, required: true },
  photo: { type: String, required: true }, // stock photo for now; real route photos come later
})

const grade = computed(() => gradeOf(props.route))
const lineColor = computed(() => GRADES[grade.value]?.line ?? '#f2efea')
const adjusted = computed(() => isCommunityAdjusted(props.route))

function formatDistance(value) {
  if (value == null || value === '') return '—'
  const distance = Number(value)
  return Number.isFinite(distance)
    ? `${distance.toLocaleString('en', { maximumFractionDigits: distance < 100 ? 1 : 0 })} km`
    : `${value} km`
}

// Climb is always signed
function formatClimb(value) {
  if (value == null || value === '') return '—'
  const climb = Number(value)
  return Number.isFinite(climb) ? `+${Math.round(climb).toLocaleString('en')} m` : `+${value} m`
}

function formatDays(value) {
  if (value == null || value === '') return '—'
  return `${value} ${Number(value) === 1 ? 'day' : 'days'}`
}
</script>

<template>
  <RouterLink class="route-tile" :to="{ name: 'route-detail', params: { id: route.id } }">
    <span class="route-tile-field">
      <img class="route-tile-photo" :src="photo" alt="" loading="lazy" />
      <span class="route-tile-line"><PlaceholderLine :color="lineColor" /></span>
      <span v-if="route.country" class="route-tile-country">{{ route.country }}</span>
      <span class="route-tile-grade">
        <DifficultyMark :grade="grade" />
        <span
          v-if="adjusted"
          class="route-tile-adjusted cairn-data"
          :title="`Community-adjusted from official ${GRADES[route.official_difficulty]?.label ?? 'grade'}`"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5" />
          </svg>
          <span class="cairn-visually-hidden">Community-adjusted</span>
          {{ Number(route.effective_difficulty).toFixed(2) }}
        </span>
      </span>
    </span>
    <h2 class="route-tile-name">{{ route.name }}</h2>
    <p class="route-tile-facts cairn-data">
      {{ formatDistance(route.distance_km) }} · {{ formatClimb(route.elevation_gain_m) }} ·
      {{ formatDays(route.duration_days) }}
    </p>
  </RouterLink>
</template>

<style scoped>
.route-tile {
  display: grid;
  align-content: start;
  color: var(--ink);
  text-decoration: none;
}

.route-tile:hover {
  color: var(--ink);
}

.route-tile:focus-visible {
  outline: 2px solid var(--lake);
  outline-offset: 6px;
}

/* Dimmed photo on night so the line reads first */
.route-tile-field {
  position: relative;
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--night);
  isolation: isolate;
}

.route-tile-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.45;
  filter: saturate(0.55) brightness(0.8);
  transition:
    transform 0.6s var(--ease),
    opacity 0.3s var(--ease);
}

.route-tile:hover .route-tile-photo {
  transform: scale(1.04);
  opacity: 0.6;
}

.route-tile-line {
  position: absolute;
  inset: 12% 8%;
  z-index: 1;
}

.route-tile-country {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
  color: rgb(242 239 234 / 0.85);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.route-tile-grade {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: var(--ground);
  font-size: 12px;
}

.route-tile-adjusted {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding-left: 6px;
  border-left: 1px solid currentColor;
  font-weight: 600;
}

.route-tile-adjusted svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.route-tile-name {
  display: -webkit-box;
  margin-top: 14px;
  overflow: hidden;
  font-size: 16px;
  line-height: 22px;
  font-weight: 900;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.route-tile:hover .route-tile-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.route-tile-facts {
  margin-top: 6px;
  color: var(--granite-700);
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .route-tile-country {
    display: none;
  }

  .route-tile-name {
    font-size: 15px;
  }
}
</style>
