<script setup>
import { computed } from 'vue'
import { motion, useReducedMotion } from 'motion-v'

// A cairn that grows as loading progresses, with a line of text under it while there's a message
const props = defineProps({
  // 0 to 100
  progress: { type: Number, required: true },
  message: { type: String, default: '' },
})

const reduceMotion = useReducedMotion()

// The cairn from its biggest stone at the bottom up to the smallest
const stones = [
  { cx: 60, cy: 84, rx: 46, ry: 11, fill: '#8d8f88' },
  { cx: 58, cy: 66, rx: 33, ry: 10, fill: '#a8a89f' },
  { cx: 62, cy: 49, rx: 24, ry: 9, fill: '#969890' },
  { cx: 59, cy: 33, rx: 16, ry: 7.5, fill: '#bcbbb1' },
  { cx: 60, cy: 20, rx: 9, ry: 5.5, fill: '#d3d1c6' },
]

// The first stone goes down as soon as loading makes any progress
const placedStones = computed(() =>
  stones.slice(0, Math.ceil((props.progress / 100) * stones.length)),
)
</script>

<template>
  <div class="cairn-loader">
    <svg
      class="cairn-loader-stones"
      viewBox="0 0 120 96"
      role="progressbar"
      :aria-label="message"
      :aria-hidden="!message"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <!-- Each stone drops into place -->
      <motion.ellipse
        v-for="(stone, index) in placedStones"
        :key="index"
        v-bind="stone"
        :initial="{ opacity: 0, y: -16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }"
      />
    </svg>

    <p v-if="message" class="cairn-loader-text" role="status" data-testid="cairn-loading">
      <span>{{ message }}</span>
      <!-- The progress bar already gives the number, so screen readers don't hear every change -->
      <span class="cairn-data" aria-hidden="true">{{ progress }}%</span>
    </p>
  </div>
</template>

<style scoped>
.cairn-loader {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.cairn-loader-stones {
  width: 110px;
  height: 88px;
  overflow: visible;
}

.cairn-loader-text {
  display: flex;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lichen);
}

.cairn-loader-text .cairn-data {
  font-weight: 600;
  letter-spacing: 0;
}
</style>
