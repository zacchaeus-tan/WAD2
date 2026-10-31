<script setup>
// Contour lines of an imaginary range behind the globe, like the paper of a topographic map.
// Wobbly rings around a few peaks near the corners, leaving the middle clear for the globe.
// Each peak is [x, y, number of rings] in the 1600 x 1000 drawing below.
const peaks = [
  [130, 170, 13],
  [1480, 150, 12],
  [1380, 880, 15],
  [210, 900, 12],
  [800, -80, 9],
]
const ringGap = 44
const pointsPerRing = 96

function ringPath(x, y, ring) {
  const seedA = x * 0.013
  const seedB = y * 0.021 + 1
  const radius = ring * ringGap
  let path = ''
  for (let step = 0; step <= pointsPerRing; step++) {
    const angle = (step / pointsPerRing) * Math.PI * 2
    const wobble =
      1 +
      0.16 * Math.sin(3 * angle + seedA + ring * 0.12) +
      0.08 * Math.sin(7 * angle + seedB - ring * 0.2) +
      0.04 * Math.sin(13 * angle + seedA + seedB)
    const pointX = x + radius * wobble * Math.cos(angle)
    const pointY = y + radius * wobble * 0.82 * Math.sin(angle)
    path += `${step ? 'L' : 'M'}${pointX.toFixed(1)} ${pointY.toFixed(1)}`
  }
  return `${path}Z`
}

// Every fifth ring is an index contour, drawn heavier as on a real map
const rings = peaks.flatMap(([x, y, ringCount]) =>
  Array.from({ length: ringCount }, (_, index) => ({
    path: ringPath(x, y, index + 1),
    isIndex: (index + 1) % 5 === 0,
  })),
)
</script>

<template>
  <svg
    class="globe-contours"
    viewBox="0 0 1600 1000"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <!-- The rings never change or move, so their position is a safe key -->
    <path
      v-for="(ring, index) in rings"
      :key="index"
      :class="{ 'is-index': ring.isIndex }"
      :d="ring.path"
    />
  </svg>
</template>

<style scoped>
.globe-contours {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.globe-contours path {
  fill: none;
  stroke: var(--sage);
  stroke-width: 1;
  opacity: 0.13;
}

.globe-contours path.is-index {
  stroke-width: 1.6;
  opacity: 0.24;
}
</style>
