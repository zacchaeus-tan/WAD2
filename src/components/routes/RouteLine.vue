<script setup>
// A route's own line, fitted to the box and drawn in its difficulty colour.
// Uses the stored path (routes.line_svg) when given, else builds one from the geometry.
// Routes without either show the placeholder drawing instead.
import { computed } from 'vue'
import { geometryToPath } from '@/lib/routeLine'
import PlaceholderLine from './PlaceholderLine.vue'

const props = defineProps({
  path: { type: String, default: null },
  geometry: { type: Object, default: null },
  color: { type: String, required: true },
  width: { type: Number, default: 3.4 },
})

const d = computed(() => props.path || geometryToPath(props.geometry))
</script>

<template>
  <svg
    v-if="d"
    class="route-line"
    viewBox="0 0 400 240"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <path
      :d="d"
      pathLength="1"
      fill="none"
      :stroke="color"
      :stroke-width="width"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
  <PlaceholderLine v-else :color="color" :width="width" />
</template>

<style scoped>
.route-line {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
