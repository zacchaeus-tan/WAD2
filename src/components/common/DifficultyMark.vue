<script setup>
import { computed } from 'vue'
import { GRADES } from '@/lib/difficultyStyle'

// Grade shape plus its name: circle, square, diamond, double diamond.
const props = defineProps({
  grade: { type: Number, default: null }, // 1-4, or null for not rated
  color: { type: String, default: '' }, // defaults to the grade's text colour
  showLabel: { type: Boolean, default: true },
})

const info = computed(() => GRADES[props.grade] ?? null)
const fill = computed(() => props.color || info.value?.ink || 'currentColor')
</script>

<template>
  <span class="difficulty-mark" :style="{ color: fill }">
    <svg v-if="info?.key === 'easy'" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
    <svg v-else-if="info?.key === 'moderate'" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" fill="currentColor" />
    </svg>
    <svg v-else-if="info?.key === 'hard'" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 0 10 5 5 10 0 5z" fill="currentColor" />
    </svg>
    <svg v-else-if="info?.key === 'strenuous'" class="is-wide" viewBox="0 0 16 10" aria-hidden="true">
      <path d="M4 0 8 5 4 10 0 5zM12 0l4 5-4 5-4-5z" fill="currentColor" />
    </svg>
    <svg v-else viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
    </svg>
    <span v-if="showLabel">{{ info ? info.label : 'Not rated' }}</span>
  </span>
</template>

<style scoped>
.difficulty-mark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.difficulty-mark svg {
  width: 10px;
  height: 10px;
  flex: none;
}

.difficulty-mark svg.is-wide {
  width: 16px;
}
</style>
