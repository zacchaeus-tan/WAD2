<script setup>
import { computed, ref } from 'vue'
import { useInView, useReducedMotion } from 'motion-v'
import NumberTicker from '@/components/common/NumberTicker.vue'
import ReviewSummary from '@/components/reviews/ReviewSummary.vue'
import { GRADES } from '@/lib/difficultyStyle'

// Official grade as a solid black arrow, community-adjusted grade as an orange band
// with a ring. Both needles swing in from Easy when the dial comes into view.
const props = defineProps({
  route: { type: Object, required: true },
})

function toGrade(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(Math.max(number, 1), 4) : null
}

const official = computed(() => toGrade(props.route.official_difficulty ?? props.route.technical_rating))
const community = computed(() => toGrade(props.route.effective_difficulty))

// 1 points left (-90°), 4 points right (90°)
function angleFor(grade) {
  return -90 + ((grade - 1) / 3) * 180
}

// Point on the dial at an angle, measured from straight up around the hub at (200, 200)
const HUB = 200
const RADIUS = 160
function pointAt(angle, radius = RADIUS) {
  const rad = (angle * Math.PI) / 180
  return [HUB + radius * Math.sin(rad), HUB - radius * Math.cos(rad)]
}

// Bands split where gradeOf() rounds (1.5, 2.5, 3.5), so the colour under a needle
// matches the grade label shown everywhere else on the site
const BAND_EDGES = [1, 1.5, 2.5, 3.5, 4]

const bands = [1, 2, 3, 4].map((grade) => {
  const [x1, y1] = pointAt(angleFor(BAND_EDGES[grade - 1]))
  const [x2, y2] = pointAt(angleFor(BAND_EDGES[grade]))
  return {
    grade,
    color: GRADES[grade].line,
    d: `M${x1} ${y1}A${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`,
  }
})

// Each join between two bands is labelled just outside the dial
const edgeLabels = BAND_EDGES.slice(1, -1).map((edge) => {
  const [x, y] = pointAt(angleFor(edge), 190)
  return { edge, x, y }
})

const dial = ref(null)
const inView = useInView(dial, { once: true, amount: 0.5 })
const reduceMotion = useReducedMotion()

function needleRotate(grade) {
  return reduceMotion.value || inView.value ? angleFor(grade) : -90
}

const label = computed(() => {
  const parts = ['Difficulty dial from 1 Easy to 4 Strenuous.']
  if (official.value != null) parts.push(`Official grade ${official.value.toFixed(2)}.`)
  if (community.value != null) parts.push(`Community-adjusted grade ${community.value.toFixed(2)}.`)
  return parts.join(' ')
})
</script>

<template>
  <article class="grade-dial">
    <div class="grade-dial-head">
      <h2 class="cairn-headline">How hard, honestly</h2>
      <span class="cairn-fine">Official grade and community grade</span>
    </div>

    <p v-if="official == null" class="cairn-fine">This route has no difficulty grade yet.</p>

    <div v-else class="grade-dial-split">
      <div ref="dial" class="grade-dial-svg" role="img" :aria-label="label">
        <svg viewBox="0 0 400 236">
          <path
            v-for="band in bands"
            :key="band.grade"
            :d="band.d"
            fill="none"
            :stroke="band.color"
            stroke-width="30"
          />
          <g fill="#3a4540" font-size="12" font-weight="700" letter-spacing="1">
            <text x="40" y="228" text-anchor="middle">1 EASY</text>
            <text
              v-for="mark in edgeLabels"
              :key="mark.edge"
              :x="mark.x"
              :y="mark.y"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ mark.edge }}
            </text>
            <text x="360" y="228" text-anchor="middle">4 STRENUOUS</text>
          </g>
          <g class="grade-dial-needle" :style="{ transform: `rotate(${needleRotate(official)}deg)` }">
            <line x1="200" y1="200" x2="200" y2="66" stroke="#17201c" stroke-width="5" stroke-linecap="round" />
            <path d="M200 46 L189 70 L211 70 Z" fill="#17201c" />
          </g>
          <g
            v-if="community != null"
            class="grade-dial-needle is-community"
            :style="{ transform: `rotate(${needleRotate(community)}deg)` }"
          >
            <line x1="200" y1="200" x2="200" y2="58" stroke="#c2481a" stroke-width="9" stroke-linecap="round" opacity="0.9" />
            <circle cx="200" cy="52" r="10" fill="#fffdf8" stroke="#c2481a" stroke-width="4" />
          </g>
          <circle cx="200" cy="200" r="13" fill="#17201c" />
        </svg>
      </div>

      <div class="grade-dial-key">
        <div class="grade-dial-row">
          <span class="grade-dial-swatch is-official" aria-hidden="true"></span>
          <strong>Official</strong>
          <b class="cairn-data"><NumberTicker :value="official" :decimals="2" /></b>
        </div>
        <div v-if="community != null" class="grade-dial-row">
          <span class="grade-dial-swatch is-community" aria-hidden="true"></span>
          <strong>Community-adjusted</strong>
          <b class="cairn-data"><NumberTicker :value="community" :decimals="2" /></b>
        </div>
        <ReviewSummary :route="route" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.grade-dial {
  display: grid;
  gap: 20px;
  padding: clamp(24px, 3vw, 44px);
  background: var(--sand);
  box-shadow: var(--shadow-stop);
}

/* Muted text steps up a shade on sand so it stays readable */
.grade-dial .cairn-fine {
  color: var(--granite-700);
}

.grade-dial-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16px;
}

.grade-dial-split {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: center;
  gap: 32px;
}

.grade-dial-svg {
  width: 100%;
  max-width: 460px;
  justify-self: center;
}

.grade-dial-svg svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.grade-dial-svg text {
  font-family: var(--font);
}

/* Both needles turn about the hub at (200, 200) */
.grade-dial-needle {
  transform-box: view-box;
  transform-origin: 200px 200px;
  transition: transform 1.6s var(--ease) 0.1s;
}

.grade-dial-needle.is-community {
  transition-delay: 0.5s;
}

@media (prefers-reduced-motion: reduce) {
  .grade-dial-needle {
    transition: none;
  }
}

.grade-dial-key {
  display: grid;
  gap: 14px;
}

.grade-dial-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgb(23 32 28 / 0.15);
}

.grade-dial-row b {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

/* Key marks drawn with clip-path and a ring, matching the needles */
.grade-dial-swatch {
  position: relative;
  width: 40px;
  height: 14px;
}

.grade-dial-swatch.is-official::before {
  content: '';
  position: absolute;
  left: 0;
  right: 10px;
  top: 50%;
  height: 5px;
  margin-top: -2.5px;
  background: var(--ink);
}

.grade-dial-swatch.is-official::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 12px;
  height: 14px;
  margin-top: -7px;
  background: var(--ink);
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.grade-dial-swatch.is-community::before {
  content: '';
  position: absolute;
  left: 0;
  right: 12px;
  top: 50%;
  height: 8px;
  margin-top: -4px;
  background: var(--blaze);
  opacity: 0.9;
}

.grade-dial-swatch.is-community::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 10px;
  height: 10px;
  margin-top: -8px;
  border: 3px solid var(--blaze);
  border-radius: 50%;
  background: #fffdf8;
}

@media (max-width: 900px) {
  .grade-dial-split {
    grid-template-columns: 1fr;
  }
}
</style>
