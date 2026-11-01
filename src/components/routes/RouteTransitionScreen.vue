<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { animate, motion } from 'motion-v'
import CairnLoader from '@/components/common/CairnLoader.vue'

// Covers the whole page on the way to a route's details page, so that page opens with no loading
// message. The details are the one thing being loaded here, so the cairn's progress runs to 80%
// on its own (four stones) and the last stone waits for them. The screen stays up while the
// details page's code downloads too, as the router only leaves the page once that's done.
const props = defineProps({
  routeName: { type: String, required: true },
  // Settles once the route's details have loaded, or been given up on (see preloadRoute)
  routeLoaded: { type: Promise, required: true },
  // While false the screen is see-through but still blocks clicks, as during the globe's dive
  showing: { type: Boolean, default: true },
})

const emit = defineEmits(['done'])

const fadeMs = 600
const leastBuildMs = 1800
const lastStoneMs = 450

const progress = ref(0)
let progressAnimation
let left = false

function animateProgress(target, durationMs) {
  progressAnimation = animate(progress.value, target, {
    duration: durationMs / 1000,
    ease: 'linear',
    onUpdate: (value) => {
      progress.value = Math.round(value)
    },
  })
  return progressAnimation
}

async function buildCairn() {
  await animateProgress(80, leastBuildMs)
  await props.routeLoaded
  // The user may have gone back while the details were loading
  if (left) {
    return
  }
  await animateProgress(100, lastStoneMs)
  emit('done')
}

watch(
  () => props.showing,
  (showing) => {
    if (showing) {
      buildCairn()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  left = true
  progressAnimation?.stop()
})
</script>

<template>
  <!-- Fades its opacity rather than its colour, so the browser can blend it without repainting
       the whole screen on every frame -->
  <motion.div
    class="cairn route-screen"
    role="status"
    data-testid="route-transition-screen"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: showing ? 1 : 0 }"
    :transition="{ duration: fadeMs / 1000, ease: [0.16, 1, 0.3, 1] }"
  >
    <p class="cairn-label">Heading to the trailhead</p>
    <p class="route-screen-name">{{ routeName }}</p>
    <svg
      class="route-screen-trail"
      viewBox="0 0 400 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M4 12C70 2 120 18 190 10S320 4 396 12" />
    </svg>
    <CairnLoader class="route-screen-cairn" :progress="progress" message="Loading route" />
  </motion.div>
</template>

<style scoped>
/* Above the navbar (z-index 20 in SiteNav.vue), as the screen covers the whole page */
.route-screen {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 0 var(--gutter);
  background: var(--night);
  color: var(--ground);
  text-align: center;
}

.route-screen .cairn-label {
  color: var(--lichen);
}

.route-screen-name {
  max-width: 14ch;
  font-size: clamp(36px, 6vw, 88px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.route-screen-trail {
  width: min(420px, 80vw);
  height: 20px;
}

.route-screen-trail path {
  fill: none;
  stroke: var(--wood-light);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.route-screen-cairn {
  margin-top: 28px;
}
</style>
