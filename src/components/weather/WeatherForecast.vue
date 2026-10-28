<script setup>
import { computed, ref } from 'vue'
import { useInView } from 'motion-v'
import { weatherLabel } from '@/lib/format'

// The week as two lines: the trailhead's and the summit's daily highs, one column per day.
// Pick a day to see its summary; "More details" opens everything else the forecast has.
const props = defineProps({
  weather: { type: Object, default: null },
  error: { type: String, default: '' },
})

const selected = ref(0)
const detailsOpen = ref(false)
const chart = ref(null)
const chartInView = useInView(chart, { once: true, amount: 0.3 })

const days = computed(() => props.weather?.days ?? [])
const hasSummit = computed(() => days.value.some((day) => day.summit))
const selectedDay = computed(() => days.value[selected.value] ?? null)

// Missing values (null) show as a dash instead of "null"
function show(value, unit = '') {
  return value === null || value === undefined ? '—' : `${value}${unit}`
}

function round(value) {
  return value === null || value === undefined ? null : Math.round(value)
}

function showVisibility(metres) {
  if (metres === null || metres === undefined) return '—'
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
}

function dateOf(day) {
  return new Date(`${day.date}T00:00:00`)
}

function weekday(day) {
  return dateOf(day).toLocaleDateString('en-GB', { weekday: 'short' })
}

function dayNumber(day) {
  return dateOf(day).getDate()
}

function fullDate(day) {
  return dateOf(day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Both lines share one scale, from the week's coldest to warmest high, so the gap
// between trailhead and summit is honest. If nothing changes, the line runs flat.
const scale = computed(() => {
  const values = []
  for (const day of days.value) {
    if (day.max != null) values.push(Math.round(day.max))
    if (day.summit?.max != null) values.push(Math.round(day.summit.max))
  }
  if (!values.length) return { low: 0, high: 0 }
  return { low: Math.min(...values), high: Math.max(...values) }
})

// Height on the chart as a percentage from the top, leaving room for the labels
function heightOf(temperature) {
  const { low, high } = scale.value
  if (high === low) return 50
  return 14 + (1 - (Math.round(temperature) - low) / (high - low)) * 72
}

function linePath(values) {
  const count = days.value.length
  let d = ''
  values.forEach((value, i) => {
    if (value == null) return
    const x = ((i + 0.5) / count) * 700
    const y = (heightOf(value) / 100) * 230
    d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(2)} `
  })
  return d.trim()
}

const trailheadLine = computed(() => linePath(days.value.map((day) => day.max)))
const summitLine = computed(() => linePath(days.value.map((day) => day.summit?.max ?? null)))

function dayLabel(day) {
  const parts = [fullDate(day), weatherLabel(day.code)]
  if (day.summit?.max != null) parts.push(`summit ${round(day.summit.max)} degrees`)
  if (day.max != null) parts.push(`trailhead ${round(day.max)} degrees`)
  if (day.rainChance != null) parts.push(`${day.rainChance}% chance of rain`)
  return parts.join(', ')
}

// Arrow keys move between days
function onKeydown(event) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  selected.value = Math.min(Math.max(selected.value + step, 0), days.value.length - 1)
  event.currentTarget.querySelectorAll('.weather-day')[selected.value]?.focus()
}

// Open-Meteo weather codes grouped into a handful of drawn icons
function iconFor(code) {
  if (code == null) return 'cloud'
  if (code <= 1) return 'sun'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloud'
}
</script>

<template>
  <article class="weather">
    <div class="weather-head">
      <h2 class="cairn-headline">The week on the mountain</h2>
    </div>

    <p v-if="error" class="weather-message">{{ error }}</p>
    <p v-else-if="!weather" class="weather-message" role="status">Loading the forecast...</p>

    <template v-else>
      <p class="weather-now">
        <span class="cairn-label">Now at the trailhead</span>
        <strong class="cairn-data">{{ show(weather.current.temperature_2m, '°C') }}</strong>
        <span>
          wind {{ show(weather.current.wind_speed_10m, ' km/h') }} · humidity
          {{ show(weather.current.relative_humidity_2m, '%') }} · rain
          {{ show(weather.current.precipitation, ' mm') }}
        </span>
        <template v-if="weather.summitCurrent">
          <span class="cairn-label">At the summit</span>
          <strong class="cairn-data">{{ show(weather.summitCurrent.temperature_2m, '°C') }}</strong>
        </template>
      </p>

      <div
        ref="chart"
        class="weather-chart"
        :class="{ 'has-summit': hasSummit, 'is-in-view': chartInView }"
        :style="{ '--days': days.length }"
        role="group"
        aria-label="Pick a day"
        @keydown="onKeydown"
      >
        <div class="weather-axis" aria-hidden="true">
          <span></span>
          <span class="weather-legend">
            <span v-if="hasSummit"><i class="is-summit"></i>Summit</span>
            <span><i class="is-trailhead"></i>Trailhead</span>
          </span>
          <span></span>
        </div>

        <div class="weather-lines" aria-hidden="true">
          <svg viewBox="0 0 700 230" preserveAspectRatio="none">
            <path class="weather-ridge" d="M0 230 L0 170 L90 120 L170 150 L260 70 L330 110 L420 40 L500 100 L590 80 L700 140 L700 230 Z" />
            <path v-if="hasSummit" class="weather-line is-summit" :d="summitLine" vector-effect="non-scaling-stroke" />
            <path class="weather-line is-trailhead" :d="trailheadLine" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <button
          v-for="(day, index) in days"
          :key="day.date"
          type="button"
          class="weather-day"
          :aria-pressed="selected === index ? 'true' : 'false'"
          :aria-label="dayLabel(day)"
          :tabindex="selected === index ? 0 : -1"
          @click="selected = index"
        >
          <span class="weather-day-head">
            <span class="weather-day-name">{{ weekday(day) }}</span>
            <span class="weather-day-number cairn-data">{{ dayNumber(day) }}</span>
            <svg v-if="day.warnings.length" class="weather-day-warn" viewBox="0 0 40 36" aria-hidden="true">
              <path d="M20 2 38.5 34h-37z" fill="#ffc94d" stroke="#17201c" stroke-width="3" stroke-linejoin="round" />
              <path d="M20 13v10" stroke="#17201c" stroke-width="4" stroke-linecap="round" />
              <circle cx="20" cy="28.5" r="2.4" fill="#17201c" />
            </svg>
          </span>
          <span class="weather-day-plot">
            <span v-if="day.summit?.max != null" class="weather-point is-summit cairn-data" :style="{ top: `${heightOf(day.summit.max)}%` }">
              <i></i>{{ round(day.summit.max) }}°
            </span>
            <span v-if="day.max != null" class="weather-point is-trailhead cairn-data" :style="{ top: `${heightOf(day.max)}%` }">
              <i></i>{{ round(day.max) }}°
            </span>
          </span>
          <span class="weather-day-foot">
            <span class="weather-condition">
              <svg class="weather-icon" viewBox="0 0 24 24" aria-hidden="true">
                <template v-if="iconFor(day.code) === 'sun'">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
                </template>
                <template v-else-if="iconFor(day.code) === 'partly'">
                  <path d="M8 6.5a3.5 3.5 0 0 1 6.3 1.2" />
                  <path d="M7 18h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.4A2.9 2.9 0 0 0 7 18z" />
                </template>
                <template v-else-if="iconFor(day.code) === 'fog'">
                  <path d="M7 13h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.4A2.9 2.9 0 0 0 7 13z" />
                  <path d="M5 17h14M7 20.5h10" />
                </template>
                <template v-else>
                  <path d="M7 15.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.4A2.9 2.9 0 0 0 7 15.5z" />
                  <path v-if="iconFor(day.code) === 'drizzle'" d="M9 18.5v1M12 18.5v1M15 18.5v1" />
                  <path v-else-if="iconFor(day.code) === 'rain'" d="M9 18l-1.5 4M12.5 18l-1.5 4M16 18l-1.5 4" />
                  <path v-else-if="iconFor(day.code) === 'snow'" d="M9 19h.01M12 21h.01M15 19h.01" />
                  <path v-else-if="iconFor(day.code) === 'storm'" d="M12.5 17 10 20.5h3L11 23" />
                </template>
              </svg>
              {{ weatherLabel(day.code) }}
            </span>
          </span>
        </button>
      </div>

      <div v-if="selectedDay" class="weather-summary">
        <span class="weather-summary-number cairn-data">{{ dayNumber(selectedDay) }}</span>
        <span class="weather-summary-what">
          <span class="cairn-label">{{ fullDate(selectedDay) }}</span>
          <strong>{{ weatherLabel(selectedDay.code) }}</strong>
          <span class="weather-summary-warnings" :class="{ 'has-warnings': selectedDay.warnings.length }">
            <svg v-if="selectedDay.warnings.length" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4 2.8 19.5h18.4z" />
              <path d="M12 10v4.5M12 17.2v.1" />
            </svg>
            {{ selectedDay.warnings.length ? selectedDay.warnings.join(' · ') : 'No warnings' }}
          </span>
        </span>
        <button
          type="button"
          class="cairn-btn is-ghost is-small"
          :aria-expanded="detailsOpen ? 'true' : 'false'"
          aria-controls="weather-details"
          @click="detailsOpen = !detailsOpen"
        >
          {{ detailsOpen ? 'Fewer details' : 'More details' }}
          <svg viewBox="0 0 24 24" aria-hidden="true" :class="{ 'is-flipped': detailsOpen }">
            <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>

      <div id="weather-details" class="weather-details" :class="{ 'is-open': detailsOpen }">
        <div>
          <div v-if="selectedDay" class="weather-details-inner">
            <div>
              <h3>Trailhead</h3>
              <dl>
                <dt>High / low</dt>
                <dd class="cairn-data">{{ show(selectedDay.max, '°') }} / {{ show(selectedDay.min, '°C') }}</dd>
                <dt>Feels like</dt>
                <dd class="cairn-data">{{ show(selectedDay.feelsMax, '°') }} / {{ show(selectedDay.feelsMin, '°C') }}</dd>
                <dt>Chance of rain</dt>
                <dd class="cairn-data">{{ show(selectedDay.rainChance, '%') }}</dd>
                <dt>Morning / afternoon rain</dt>
                <dd class="cairn-data">
                  {{ show(selectedDay.morningRainChance, '%') }} / {{ show(selectedDay.afternoonRainChance, '%') }}
                </dd>
                <dt>Rain total</dt>
                <dd class="cairn-data">{{ show(selectedDay.rain, ' mm') }}</dd>
                <dt>Hours of rain</dt>
                <dd class="cairn-data">{{ show(selectedDay.rainHours, ' h') }}</dd>
              </dl>
            </div>
            <div>
              <h3 v-if="selectedDay.summit">Summit · {{ weather.summitElevation?.toLocaleString('en') }} m</h3>
              <dl v-if="selectedDay.summit">
                <dt>High / low</dt>
                <dd class="cairn-data">
                  {{ show(selectedDay.summit.max, '°') }} / {{ show(selectedDay.summit.min, '°C') }}
                </dd>
                <dt>Feels like</dt>
                <dd class="cairn-data">
                  {{ show(selectedDay.summit.feelsMax, '°') }} / {{ show(selectedDay.summit.feelsMin, '°C') }}
                </dd>
              </dl>
              <h3>The day</h3>
              <dl>
                <dt>Wind / gusts</dt>
                <dd class="cairn-data">
                  {{ show(selectedDay.windMax, ' km/h') }} / {{ show(selectedDay.gustMax, ' km/h') }}
                </dd>
                <dt>UV index</dt>
                <dd class="cairn-data">{{ show(selectedDay.uv) }}</dd>
                <dt>Lowest daytime visibility</dt>
                <dd class="cairn-data">{{ showVisibility(selectedDay.minVisibility) }}</dd>
                <dt>Average humidity</dt>
                <dd class="cairn-data">{{ show(selectedDay.humidity, '%') }}</dd>
                <dt>Sunrise / sunset</dt>
                <dd class="cairn-data">{{ show(selectedDay.sunrise) }} / {{ show(selectedDay.sunset) }}</dd>
              </dl>
            </div>
            <ul v-if="selectedDay.warnings.length" class="weather-details-warnings">
              <li v-for="warning in selectedDay.warnings" :key="warning">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.1" /></svg>
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p class="weather-source cairn-fine">
        Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>.
        <template v-if="weather.summitElevation">
          Summit figures are for {{ weather.summitElevation.toLocaleString('en') }} m up at the route's location,
          its highest point, not the exact summit spot.
        </template>
      </p>
    </template>
  </article>
</template>

<style scoped>
.weather {
  display: grid;
  gap: 20px;
  padding: clamp(24px, 3vw, 44px);
  background: #fffdf8;
  box-shadow: var(--shadow-stop);
}

.weather > * {
  min-width: 0;
}

.weather-message {
  color: var(--granite-700);
}

.weather-now {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  color: var(--granite-700);
  font-size: 14px;
}

.weather-now strong {
  color: var(--ink);
  font-size: 20px;
  font-weight: 600;
}

/* Chart: an axis column, then one column per day, with the lines drawn across them */
.weather-chart {
  position: relative;
  display: grid;
  grid-template-columns: 110px repeat(var(--days), minmax(0, 1fr));
  border-top: 2px solid var(--ink);
  border-bottom: 2px solid var(--ink);
}

.weather-axis {
  display: grid;
  grid-template-rows: 64px 1fr 52px;
  border-right: 1px solid var(--granite-200);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.weather-legend {
  display: grid;
  align-content: center;
  gap: 10px;
}

.weather-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.weather-legend i {
  width: 16px;
  height: 3px;
}

.weather-legend i.is-summit,
.weather-point.is-summit i {
  background: var(--lake);
}

.weather-legend i.is-trailhead,
.weather-point.is-trailhead i {
  background: var(--blaze);
}

.weather-lines {
  position: absolute;
  left: 110px;
  right: 0;
  top: 64px;
  height: 230px;
  pointer-events: none;
}

.weather-lines svg {
  width: 100%;
  height: 100%;
}

.weather-ridge {
  fill: #efe9dc;
}

.weather-line {
  fill: none;
  stroke-width: 3;
}

/* The lines wipe in from the left once the chart is in view (the chart stretches to fit,
   so a dash-based draw would not reach the last days) */
.weather-lines svg {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1.4s var(--ease);
}

.weather-chart.is-in-view .weather-lines svg {
  clip-path: inset(0 0 0 0);
}

.weather-line.is-summit {
  stroke: var(--lake);
}

.weather-line.is-trailhead {
  stroke: var(--blaze);
}

.weather-day {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 64px 230px 52px;
  padding: 0;
  border: 0;
  border-right: 1px solid var(--granite-200);
  background: transparent;
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}

.weather-day:last-child {
  border-right: 0;
}

.weather-day:hover:not([aria-pressed='true']) {
  background: rgb(31 91 67 / 0.05);
}

.weather-day[aria-pressed='true'] {
  background: rgb(31 91 67 / 0.12);
  box-shadow: inset 0 -4px 0 var(--pine);
}

.weather-day:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: -3px;
}

.weather-day-head {
  position: relative;
  display: grid;
  place-content: center;
  gap: 2px;
  border-bottom: 1px solid var(--granite-200);
}

.weather-day[aria-pressed='true'] .weather-day-head {
  background: var(--pine);
  color: var(--white);
}

.weather-day-name {
  color: var(--granite-500);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.weather-day[aria-pressed='true'] .weather-day-name {
  color: #d4e3db;
}

.weather-day-number {
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
}

/* Warning triangle in the corner of a day that has forecast warnings */
.weather-day-warn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 15px;
}

.weather-day-plot {
  position: relative;
}

/* The dot sits on the value; the label goes above (summit) or below (trailhead) it */
.weather-point {
  position: absolute;
  left: 50%;
  display: grid;
  justify-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.weather-point i {
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  border: 3px solid var(--white);
}

.weather-point.is-trailhead {
  translate: -50% -7px;
}

.weather-point.is-summit {
  translate: -50% calc(-100% + 7px);
}

.weather-point.is-summit i {
  order: 2;
}

.weather-day-foot {
  display: grid;
  place-items: center;
  padding: 0 4px;
  border-top: 1px solid var(--granite-200);
}

.weather-condition {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--granite-700);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.weather-day[aria-pressed='true'] .weather-condition {
  color: var(--pine);
}

.weather-icon {
  width: 18px;
  height: 18px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Selected day and the details drawer */
.weather-summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 18px 20px;
  background: var(--linen);
}

.weather-summary-number {
  font-size: 44px;
  font-weight: 600;
  line-height: 1;
}

.weather-summary-what {
  display: grid;
  gap: 4px;
}

.weather-summary-what .cairn-label {
  color: var(--granite-700);
}

.weather-summary-what strong {
  font-size: 17px;
  font-weight: 900;
}

.weather-summary-warnings {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--granite-700);
  font-size: 14px;
}

.weather-summary-warnings.has-warnings {
  color: var(--ink);
  font-weight: 700;
}

.weather-summary-warnings svg {
  width: 18px;
  height: 18px;
  flex: none;
  margin-top: 1px;
  fill: none;
  stroke: var(--warning);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.weather-summary svg {
  transition: rotate 0.3s var(--ease);
}

.weather-summary svg.is-flipped {
  rotate: 180deg;
}

.weather-details {
  display: grid;
  grid-template-rows: 0fr;
  margin-top: -20px;
  transition: grid-template-rows 0.5s var(--ease);
}

.weather-details.is-open {
  grid-template-rows: 1fr;
}

.weather-details > div {
  overflow: hidden;
}

.weather-details-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 28px;
  padding: 22px 20px 16px;
  border: 2px solid var(--ink);
  border-top: 0;
}

.weather-details h3 {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.weather-details h3:not(:first-child) {
  margin-top: 20px;
}

.weather-details dl {
  display: grid;
  grid-template-columns: 1fr auto;
  margin: 0;
}

.weather-details dt,
.weather-details dd {
  margin: 0;
  padding: 9px 0;
  border-bottom: 1px solid var(--granite-200);
  font-size: 15px;
}

.weather-details dt {
  font-weight: 400;
}

.weather-details dd {
  font-weight: 600;
  text-align: right;
}

.weather-details-warnings {
  grid-column: 1 / -1;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.weather-details-warnings li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 15px;
  line-height: 22px;
}

.weather-details-warnings svg {
  width: 18px;
  height: 18px;
  flex: none;
  margin-top: 2px;
  fill: none;
  stroke: var(--warning);
  stroke-width: 2;
}

@media (prefers-reduced-motion: reduce) {
  .weather-lines svg {
    clip-path: none;
    transition: none;
  }

  .weather-details {
    transition: none;
  }
}

@media (max-width: 900px) {
  .weather-chart {
    grid-template-columns: repeat(var(--days), minmax(80px, 1fr));
    overflow-x: auto;
  }

  .weather-axis {
    display: none;
  }

  .weather-lines {
    left: 0;
    width: max(100%, calc(80px * var(--days)));
  }

  .weather-summary,
  .weather-details-inner {
    grid-template-columns: 1fr;
  }
}
</style>
