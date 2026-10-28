<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMotionValueEvent, useReducedMotion } from 'motion-v'

// Decorative only: a brown trail with grass that winds behind the sections and is drawn
// as you scroll. It is not the real route. The parent passes how far along to draw (0-1),
// and the elements marked .route-stop that the trail passes beside.
const props = defineProps({
  progress: { type: Object, required: true },
})

const root = ref(null)
const width = ref(0)
const height = ref(0)
const pathData = ref('')
const tufts = ref([]) // { d, at } where at is the distance along the trail
const walkedLength = ref(0)
const hiker = ref({ x: 0, y: 0 })

const reduceMotion = useReducedMotion()
const trailPath = ref(null)
let totalLength = 0
let resizeObserver = null

// A smooth curve (Catmull-Rom) through the points, written as cubic Béziers
function smoothPath(points) {
  let d = `M${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

// Same pseudo-random sequence every time, so the grass doesn't jump on resize
function seededRandom(seed) {
  let s = seed
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

// Places a point beside each section, alternating sides, and a bend in each gap
async function build() {
  const container = root.value?.parentElement
  if (!container) return

  const w = container.clientWidth
  const h = container.offsetHeight
  const stops = [...container.querySelectorAll('.route-stop')]
  const top = container.getBoundingClientRect().top
  const narrow = w < 900
  const sideLeft = narrow ? 18 : w * 0.07
  const sideRight = narrow ? w - 18 : w * 0.93

  const points = [[w / 2, 0]]
  stops.forEach((stop, i) => {
    const box = stop.getBoundingClientRect()
    const stopTop = box.top - top
    const previousBottom = i ? stops[i - 1].getBoundingClientRect().bottom - top : 0
    const gapY = i ? (previousBottom + stopTop) / 2 : Math.max(36, stopTop / 2)
    const gapX = narrow ? w / 2 : w / 2 + (i % 2 ? -1 : 1) * w * 0.12
    points.push([gapX, gapY])
    points.push([i % 2 ? sideLeft : sideRight, stopTop + box.height * 0.5])
  })
  points.push([w / 2, h])

  width.value = w
  height.value = h
  pathData.value = smoothPath(points)

  // Measure the drawn path, then scatter grass tufts along both sides of it
  await nextTick()
  const path = trailPath.value
  if (!path) return
  totalLength = path.getTotalLength()

  const random = seededRandom(7)
  const list = []
  for (let at = 24; at < totalLength; at += 38) {
    const a = path.getPointAtLength(at)
    const b = path.getPointAtLength(Math.min(totalLength, at + 1))
    const nx = -(b.y - a.y)
    const ny = b.x - a.x
    const n = Math.hypot(nx, ny) || 1
    const side = random() < 0.5 ? -1 : 1
    const offset = 9 + random() * 8
    const x = a.x + (nx / n) * offset * side
    const y = a.y + (ny / n) * offset * side
    const size = 6 + random() * 6
    list.push({
      at,
      d: `M${x.toFixed(1)} ${y.toFixed(1)} l-${(size * 0.45).toFixed(1)} -${(size * 0.8).toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)} l0 -${size.toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)} l${(size * 0.45).toFixed(1)} -${(size * 0.8).toFixed(1)}`,
    })
  }
  tufts.value = list
  draw(props.progress.get())
}

function draw(amount) {
  if (!trailPath.value || !totalLength) return
  const k = reduceMotion.value ? 1 : Math.min(1, Math.max(0, amount))
  walkedLength.value = totalLength * k
  const point = trailPath.value.getPointAtLength(walkedLength.value)
  hiker.value = { x: point.x, y: point.y }
}

useMotionValueEvent(props.progress, 'change', draw)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => build())
  resizeObserver.observe(root.value.parentElement)
  build()
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div ref="root" class="walked-trail" aria-hidden="true">
    <svg v-if="pathData" :viewBox="`0 0 ${width} ${height}`">
      <path class="walked-trail-ghost" :d="pathData" />
      <path
        ref="trailPath"
        class="walked-trail-path"
        :d="pathData"
        :stroke-dasharray="`${walkedLength} 100000`"
      />
      <g class="walked-trail-grass">
        <path v-for="tuft in tufts" :key="tuft.at" :d="tuft.d" :class="{ 'is-grown': walkedLength >= tuft.at }" />
      </g>
      <g :transform="`translate(${hiker.x.toFixed(1)} ${hiker.y.toFixed(1)})`">
        <circle class="walked-trail-ring" r="12" />
        <circle class="walked-trail-hiker" r="9" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.walked-trail {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.walked-trail svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.walked-trail-ghost {
  fill: none;
  stroke: #cfc5b2;
  stroke-width: 3;
  stroke-dasharray: 1 10;
  stroke-linecap: round;
}

.walked-trail-path {
  fill: none;
  stroke: var(--trail);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.walked-trail-grass path {
  fill: none;
  stroke: var(--grass);
  stroke-width: 2;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scale(0);
  transition: transform 0.5s var(--ease);
}

.walked-trail-grass path.is-grown {
  transform: scale(1);
}

.walked-trail-hiker {
  fill: var(--blaze);
  stroke: var(--white);
  stroke-width: 4;
}

.walked-trail-ring {
  fill: none;
  stroke: var(--blaze);
  stroke-width: 2;
  opacity: 0.4;
  transform-box: fill-box;
  transform-origin: center;
  animation: walked-trail-ping 1.8s ease-out infinite;
}

@keyframes walked-trail-ping {
  from {
    transform: scale(1);
    opacity: 0.5;
  }

  to {
    transform: scale(2.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .walked-trail-ring {
    animation: none;
  }

  .walked-trail-grass path {
    transform: scale(1);
    transition: none;
  }
}
</style>
