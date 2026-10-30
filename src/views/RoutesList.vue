<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion-v'
import { fetchRouteTiles } from '../controller/routesController'
import { tripType } from '@/lib/matching'
import { GRADES, gradeOf } from '@/lib/difficultyStyle'
import DifficultyMark from '@/components/common/DifficultyMark.vue'
import FilterDropdown from '@/components/routes/FilterDropdown.vue'
import RangeFilter from '@/components/routes/RangeFilter.vue'
import RouteTile from '@/components/routes/RouteTile.vue'
import RoutesLoading from '@/components/routes/RoutesLoading.vue'
import cairnPhoto from '@/assets/img/cairn1.jpg'
import cairnMask from '@/assets/img/cairn1-mask.png'
import photoAlpinePath from '@/assets/img/card-alpine-path.jpg'
import photoLakePeaks from '@/assets/img/card-lake-peaks.jpg'
import photoMistyLake from '@/assets/img/card-misty-lake.jpg'
import photoRidgeHikers from '@/assets/img/card-ridge-hikers.jpg'

// Stock photos behind the route lines until each route has its own photo.
const TILE_PHOTOS = [photoLakePeaks, photoAlpinePath, photoRidgeHikers, photoMistyLake]

// How many tiles show at first, and how many more each "Show more" adds.
const PAGE_SIZE = 24

const TRIP_LABELS = { day: 'Day hike', overnight: 'Overnight', multiday: 'Multi-day' }

// Slider positions (0-100) to real values. Distance uses a log scale so short routes
// get most of the track; climb uses a square so small climbs get more room.
const KM_MIN = 3
const KM_MAX = 1000
const CLIMB_MAX = 7000

const SORTS = {
  name: 'Name, A to Z',
  'distance-asc': 'Shortest first',
  'distance-desc': 'Longest first',
  'climb-asc': 'Least climb first',
  'climb-desc': 'Most climb first',
}

const routes = ref([])
const loading = ref(true)
const error = ref('')

const searchTerm = ref('')
const selectedCountry = ref('')
const selectedGrades = ref([])
const selectedTrips = ref([])
const distanceRange = ref([0, 100])
const climbRange = ref([0, 100])
const sortBy = ref('name')
const visibleCount = ref(PAGE_SIZE)

// Which filter panel is open ('country', 'grade', ...), or '' for none
const openFilter = ref('')

function toggleFilter(key) {
  openFilter.value = openFilter.value === key ? '' : key
}

// Only close the panel that asked; another one may have just opened.
function closeFilter(key) {
  if (openFilter.value === key) {
    openFilter.value = ''
  }
}

function kmFromPosition(position) {
  return KM_MIN * Math.pow(KM_MAX / KM_MIN, position / 100)
}

function climbFromPosition(position) {
  return CLIMB_MAX * Math.pow(position / 100, 2)
}

// 0 means no minimum and 100 means no maximum
function bounds(range, toValue) {
  return [
    range[0] === 0 ? 0 : toValue(range[0]),
    range[1] === 100 ? Infinity : toValue(range[1]),
  ]
}

function toNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const countries = computed(() => {
  const uniqueCountries = []

  for (const route of routes.value) {
    const country = route.country?.trim()
    if (!country) {
      continue
    }

    let isDuplicate = false
    for (const existingCountry of uniqueCountries) {
      if (existingCountry.toLocaleLowerCase() === country.toLocaleLowerCase()) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      uniqueCountries.push(country)
    }
  }

  return uniqueCountries.sort((a, b) => a.localeCompare(b))
})

// skip leaves one filter out, so each option can show how many routes it would give.
function matchesFilters(route, skip = '') {
  const query = searchTerm.value.trim().toLocaleLowerCase()
  // route names may be missing, so ?. avoids calling toLocaleLowerCase on undefined.
  if (query && !route.name?.toLocaleLowerCase().includes(query)) {
    return false
  }

  if (
    skip !== 'country' &&
    selectedCountry.value &&
    route.country?.trim().toLocaleLowerCase() !== selectedCountry.value.toLocaleLowerCase()
  ) {
    return false
  }

  if (skip !== 'grade' && selectedGrades.value.length && !selectedGrades.value.includes(gradeOf(route))) {
    return false
  }

  if (skip !== 'trip' && selectedTrips.value.length && !selectedTrips.value.includes(tripType(route))) {
    return false
  }

  // A route with no distance or climb data only drops out once that filter is set
  const distanceIsSet = distanceRange.value[0] !== 0 || distanceRange.value[1] !== 100
  if (distanceIsSet) {
    const distance = toNumber(route.distance_km)
    const [low, high] = bounds(distanceRange.value, kmFromPosition)
    if (distance == null || distance < low || distance > high) {
      return false
    }
  }

  const climbIsSet = climbRange.value[0] !== 0 || climbRange.value[1] !== 100
  if (climbIsSet) {
    const climb = toNumber(route.elevation_gain_m)
    const [low, high] = bounds(climbRange.value, climbFromPosition)
    if (climb == null || climb < low || climb > high) {
      return false
    }
  }

  return true
}

// Routes missing the sorted value always go last, whichever way the sort runs.
function compareNumbers(valueA, valueB, direction) {
  if ((valueA == null) !== (valueB == null)) {
    return valueA == null ? 1 : -1
  }
  if (valueA == null) {
    return 0
  }
  return (valueA - valueB) * direction
}

const filteredRoutes = computed(() => {
  const sortedRoutes = routes.value.filter((route) => matchesFilters(route))

  sortedRoutes.sort((routeA, routeB) => {
    if (sortBy.value === 'distance-asc' || sortBy.value === 'distance-desc') {
      const direction = sortBy.value === 'distance-asc' ? 1 : -1
      return compareNumbers(toNumber(routeA.distance_km), toNumber(routeB.distance_km), direction)
    }
    if (sortBy.value === 'climb-asc' || sortBy.value === 'climb-desc') {
      const direction = sortBy.value === 'climb-asc' ? 1 : -1
      return compareNumbers(toNumber(routeA.elevation_gain_m), toNumber(routeB.elevation_gain_m), direction)
    }
    return (routeA.name ?? '').localeCompare(routeB.name ?? '')
  })

  return sortedRoutes
})

const displayedRoutes = computed(() => filteredRoutes.value.slice(0, visibleCount.value))

// Start again from the first page whenever the results change
watch(
  [searchTerm, selectedCountry, selectedGrades, selectedTrips, distanceRange, climbRange, sortBy],
  () => (visibleCount.value = PAGE_SIZE),
  { deep: true },
)

function countFor(skip, test) {
  return routes.value.filter((route) => matchesFilters(route, skip) && test(route)).length
}

// Text shown in each filter button
function formatKm(value) {
  return value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString('en')
}

function formatClimb(value) {
  return value >= 1000 ? (Math.round(value / 100) * 100).toLocaleString('en') : Math.round(value / 50) * 50
}

function rangeSummary(range, toValue, format, unit, prefix = '') {
  if (range[0] === 0 && range[1] === 100) {
    return 'Any'
  }
  const low = `${prefix}${format(toValue(range[0]))}`
  const high = `${prefix}${format(toValue(range[1]))}`
  if (range[1] === 100) {
    return `${low} ${unit} or more`
  }
  if (range[0] === 0) {
    return `Up to ${high} ${unit}`
  }
  return `${low}–${high} ${unit}`
}

const distanceSummary = computed(() => rangeSummary(distanceRange.value, kmFromPosition, formatKm, 'km'))
const climbSummary = computed(() => rangeSummary(climbRange.value, climbFromPosition, formatClimb, 'm', '+'))

const gradeSummary = computed(() =>
  selectedGrades.value.length
    ? selectedGrades.value
        .slice()
        .sort()
        .map((grade) => GRADES[grade].label)
        .join(', ')
    : 'Any',
)

const tripSummary = computed(() =>
  selectedTrips.value.length ? selectedTrips.value.map((trip) => TRIP_LABELS[trip]).join(', ') : 'Any',
)

// One pill per applied filter, each with its own way to remove it
const activeFilters = computed(() => {
  const pills = []
  if (searchTerm.value.trim()) {
    pills.push({ key: 'search', label: `“${searchTerm.value.trim()}”`, remove: () => (searchTerm.value = '') })
  }
  if (selectedCountry.value) {
    pills.push({ key: 'country', label: selectedCountry.value, remove: () => (selectedCountry.value = '') })
  }
  for (const grade of selectedGrades.value) {
    pills.push({
      key: `grade-${grade}`,
      label: GRADES[grade].label,
      remove: () => (selectedGrades.value = selectedGrades.value.filter((g) => g !== grade)),
    })
  }
  for (const trip of selectedTrips.value) {
    pills.push({
      key: `trip-${trip}`,
      label: TRIP_LABELS[trip],
      remove: () => (selectedTrips.value = selectedTrips.value.filter((t) => t !== trip)),
    })
  }
  if (distanceSummary.value !== 'Any') {
    pills.push({ key: 'distance', label: distanceSummary.value, remove: () => (distanceRange.value = [0, 100]) })
  }
  if (climbSummary.value !== 'Any') {
    pills.push({ key: 'climb', label: `Climb ${climbSummary.value}`, remove: () => (climbRange.value = [0, 100]) })
  }
  return pills
})

function clearFilters() {
  searchTerm.value = ''
  selectedCountry.value = ''
  selectedGrades.value = []
  selectedTrips.value = []
  distanceRange.value = [0, 100]
  climbRange.value = [0, 100]
}

function photoFor(route, index) {
  return TILE_PHOTOS[((route.name?.length ?? 0) + index) % TILE_PHOTOS.length]
}

// Banner parallax: the sky, the title and the mountain move at different speeds
const reduceMotion = useReducedMotion()
const { scrollY } = useScroll()
const skyY = useTransform(scrollY, (y) => (reduceMotion.value ? 0 : y * 0.6))
const titleY = useTransform(scrollY, (y) => (reduceMotion.value ? 0 : y * 0.45))
const frontY = useTransform(scrollY, (y) => (reduceMotion.value ? 0 : y * 0.05))
const introOpacity = useTransform(scrollY, (y) => (reduceMotion.value ? 1 : Math.max(0, 1 - y / 360)))

const bannerPhoto = `url(${cairnPhoto})`
const bannerMask = `url(${cairnMask})`

// Once the filter bar sticks to the top of a wide screen, a search field slides into it
const barSentinel = ref(null)
const barIsStuck = ref(false)
let stickObserver = null
const wideScreen = window.matchMedia('(min-width: 961px)')

onMounted(async () => {
  stickObserver = new IntersectionObserver(([entry]) => {
    barIsStuck.value = wideScreen.matches && !entry.isIntersecting && entry.boundingClientRect.top < 0
  })

  try {
    routes.value = await fetchRouteTiles()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error.value = `Unable to load routes: ${message}`
  } finally {
    loading.value = false
  }
})

// The bar only exists once routes have loaded
watch(barSentinel, (element) => {
  if (element && stickObserver) {
    stickObserver.observe(element)
  }
})

onBeforeUnmount(() => stickObserver?.disconnect())
</script>

<template>
  <div class="cairn routes-page">
    <section class="routes-banner" aria-labelledby="routes-title">
      <motion.div
        class="routes-banner-layer routes-banner-sky"
        :style="{ y: skyY, backgroundImage: bannerPhoto }"
        role="img"
        aria-label="A cairn of flat stones on a grassy ridge below a snow-covered peak"
      />
      <motion.div class="routes-banner-layer routes-banner-title" :style="{ y: titleY }">
        <h1 id="routes-title">Find the line you'll walk.</h1>
      </motion.div>
      <motion.div
        class="routes-banner-layer routes-banner-front"
        :style="{ y: frontY, backgroundImage: bannerPhoto, maskImage: bannerMask, webkitMaskImage: bannerMask }"
        aria-hidden="true"
      />
      <div class="routes-banner-shade" aria-hidden="true"></div>
      <motion.div class="routes-banner-intro cairn-wrap" :style="{ opacity: introOpacity }">
        <p>Every route here is drawn from the path people actually walked, mapped in OpenStreetMap.</p>
        <label class="routes-banner-search">
          <span class="cairn-visually-hidden">Search routes by name</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
          <input v-model="searchTerm" type="search" placeholder="Search a route, like Kinabalu" />
        </label>
      </motion.div>
    </section>

    <RoutesLoading v-if="loading" />
    <p v-else-if="error" class="cairn-wrap routes-message" role="alert">{{ error }}</p>
    <p v-else-if="routes.length === 0" class="cairn-wrap routes-message">No routes are available right now.</p>

    <template v-else>
      <div ref="barSentinel" aria-hidden="true"></div>
      <div class="routes-bar" :class="{ 'is-stuck': barIsStuck }" role="group" aria-label="Filter routes">
        <div class="cairn-wrap routes-bar-inner">
          <FilterDropdown
            label="Country"
            :summary="selectedCountry || 'All countries'"
            :is-set="Boolean(selectedCountry)"
            :open="openFilter === 'country'"
            @toggle="toggleFilter('country')"
            @close="closeFilter('country')"
          >
            <label class="routes-field">
              <span class="cairn-label">Country</span>
              <select v-model="selectedCountry" class="cairn-input">
                <option value="">All countries</option>
                <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
              </select>
            </label>
          </FilterDropdown>

          <FilterDropdown
            label="Difficulty"
            :summary="gradeSummary"
            :is-set="selectedGrades.length > 0"
            :open="openFilter === 'grade'"
            @toggle="toggleFilter('grade')"
            @close="closeFilter('grade')"
          >
            <fieldset class="routes-options">
              <legend class="cairn-visually-hidden">Difficulty</legend>
              <label v-for="grade in [1, 2, 3, 4]" :key="grade" class="routes-option">
                <input v-model="selectedGrades" type="checkbox" :value="grade" />
                <span>
                  <DifficultyMark :grade="grade" />
                  <span class="routes-option-count cairn-data">{{ countFor('grade', (r) => gradeOf(r) === grade) }}</span>
                </span>
              </label>
            </fieldset>
            <div class="routes-panel-foot">
              <span>Community-adjusted grade</span>
              <button type="button" @click="selectedGrades = []">Reset</button>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Trip length"
            :summary="tripSummary"
            :is-set="selectedTrips.length > 0"
            :open="openFilter === 'trip'"
            @toggle="toggleFilter('trip')"
            @close="closeFilter('trip')"
          >
            <fieldset class="routes-options">
              <legend class="cairn-visually-hidden">Trip length</legend>
              <label v-for="(label, trip) in TRIP_LABELS" :key="trip" class="routes-option">
                <input v-model="selectedTrips" type="checkbox" :value="trip" />
                <span>
                  {{ label }}
                  <span class="routes-option-count cairn-data">{{ countFor('trip', (r) => tripType(r) === trip) }}</span>
                </span>
              </label>
            </fieldset>
            <div class="routes-panel-foot">
              <span>Overnight = 2 days</span>
              <button type="button" @click="selectedTrips = []">Reset</button>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Distance"
            :summary="distanceSummary"
            :is-set="distanceSummary !== 'Any'"
            :open="openFilter === 'distance'"
            @toggle="toggleFilter('distance')"
            @close="closeFilter('distance')"
          >
            <RangeFilter
              v-model="distanceRange"
              label="Distance"
              :value-text="distanceSummary"
              :low-text="distanceRange[0] === 0 ? 'No minimum' : `${formatKm(kmFromPosition(distanceRange[0]))} km`"
              :high-text="distanceRange[1] === 100 ? 'No maximum' : `${formatKm(kmFromPosition(distanceRange[1]))} km`"
            />
            <div class="routes-panel-foot">
              <span>Total route length</span>
              <button type="button" @click="distanceRange = [0, 100]">Reset</button>
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Climb"
            :summary="climbSummary"
            :is-set="climbSummary !== 'Any'"
            :open="openFilter === 'climb'"
            @toggle="toggleFilter('climb')"
            @close="closeFilter('climb')"
          >
            <RangeFilter
              v-model="climbRange"
              label="Elevation gain"
              :value-text="climbSummary"
              :low-text="climbRange[0] === 0 ? 'No minimum' : `${formatClimb(climbFromPosition(climbRange[0]))} m`"
              :high-text="climbRange[1] === 100 ? 'No maximum' : `${formatClimb(climbFromPosition(climbRange[1]))} m`"
            />
            <div class="routes-panel-foot">
              <span>Total elevation gain</span>
              <button type="button" @click="climbRange = [0, 100]">Reset</button>
            </div>
          </FilterDropdown>

          <span class="routes-bar-spacer"></span>

          <label class="routes-bar-search" :aria-hidden="barIsStuck ? null : 'true'">
            <span class="cairn-visually-hidden">Search routes by name</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
            <input
              v-model="searchTerm"
              type="search"
              placeholder="Search a route, like Kinabalu"
              :tabindex="barIsStuck ? 0 : -1"
            />
          </label>

          <FilterDropdown
            label="Sort"
            :summary="SORTS[sortBy]"
            :open="openFilter === 'sort'"
            align-right
            @toggle="toggleFilter('sort')"
            @close="closeFilter('sort')"
          >
            <div class="routes-sort" role="group" aria-label="Sort routes">
              <button
                v-for="(label, key) in SORTS"
                :key="key"
                type="button"
                :aria-pressed="sortBy === key ? 'true' : 'false'"
                @click="sortBy = key; closeFilter('sort')"
              >
                {{ label }}
                <svg v-if="sortBy === key" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              </button>
            </div>
          </FilterDropdown>
        </div>
      </div>

      <section class="cairn-wrap routes-results" aria-label="Route results">
        <div class="routes-results-top">
          <div class="routes-active">
            <button
              v-for="pill in activeFilters"
              :key="pill.key"
              type="button"
              class="routes-pill"
              @click="pill.remove()"
            >
              {{ pill.label }}
              <span class="cairn-visually-hidden">(remove filter)</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            <button v-if="activeFilters.length" type="button" class="cairn-link routes-clear" @click="clearFilters">
              Clear all filters
            </button>
          </div>
          <ul class="routes-key" aria-label="Difficulty key: line colour and label shape">
            <li v-for="grade in [1, 2, 3, 4]" :key="grade"><DifficultyMark :grade="grade" /></li>
          </ul>
        </div>

        <div v-if="filteredRoutes.length === 0" class="routes-empty" role="status">
          <h2>No routes match these filters</h2>
          <p>Try a wider distance or climb range, or include more difficulty grades.</p>
          <button type="button" class="cairn-btn is-ghost is-small" @click="clearFilters">Clear all filters</button>
        </div>

        <AnimatePresence v-else as="div" class="routes-tiles">
          <motion.div
            v-for="(route, index) in displayedRoutes"
            :key="route.id"
            layout
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, transition: { duration: 0.15 } }"
            :transition="{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }"
          >
            <RouteTile :route="route" :photo="photoFor(route, index)" />
          </motion.div>
        </AnimatePresence>

        <div v-if="displayedRoutes.length < filteredRoutes.length" class="routes-more">
          <button type="button" class="cairn-btn is-ghost" @click="visibleCount += PAGE_SIZE">Show more</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* Parallax banner: sky, title, then the mountain in front, fading into the pine bar */
/* Fills the whole screen on arrival; the navbar sits on top of it */
.routes-banner {
  position: relative;
  height: 100vh;
  height: 100svh;
  min-height: 480px;
  overflow: hidden;
  background: linear-gradient(#2a5bbd, #3a72d4 60%);
  color: var(--white);
  isolation: isolate;
}

.routes-banner-layer {
  position: absolute;
  inset: 0 0 auto;
  height: 100%;
  pointer-events: none;
  will-change: transform;
}

.routes-banner-sky,
.routes-banner-front {
  background-position: 50% 8%;
  background-repeat: no-repeat;
  background-size: cover;
}

.routes-banner-front {
  z-index: 3;
  mask-position: 50% 8%;
  mask-repeat: no-repeat;
  mask-size: cover;
  -webkit-mask-position: 50% 8%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: cover;
}

.routes-banner-title {
  z-index: 2;
  display: flex;
  justify-content: center;
  padding-top: clamp(140px, 20vh, 210px);
}

.routes-banner-title h1 {
  max-width: 12ch;
  font-size: clamp(48px, 8vw, 124px);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-align: center;
  text-shadow: 0 4px 24px rgb(0 0 0 / 0.22);
  text-wrap: balance;
}

.routes-banner-shade {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 45%, rgb(14 28 22 / 0.55) 82%, var(--pine) 100%);
}

.routes-banner-intro {
  position: absolute;
  left: 0;
  right: 0;
  bottom: clamp(56px, 9vh, 96px);
  z-index: 5;
  text-align: center;
}

.routes-banner-intro p {
  max-width: 46ch;
  margin: 0 auto;
  color: rgb(255 255 255 / 0.95);
  font-size: 17px;
  line-height: 26px;
  font-weight: 700;
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.4);
  text-wrap: pretty;
}

.routes-banner-search {
  position: relative;
  display: block;
  width: min(560px, 100%);
  margin: 28px auto 0;
}

.routes-banner-search svg,
.routes-bar-search svg {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}

.routes-banner-search svg {
  left: 4px;
  width: 22px;
  height: 22px;
}

.routes-banner-search input {
  width: 100%;
  min-height: 56px;
  padding-left: 40px;
  border: 0;
  border-bottom: 2px solid var(--white);
  border-radius: 0;
  background: transparent;
  color: var(--white);
  caret-color: var(--white);
  font: 400 18px var(--font);
}

.routes-banner-search input::placeholder {
  color: var(--white);
  opacity: 1;
  text-shadow: 0 1px 8px rgb(0 0 0 / 0.45);
}

.routes-banner-search input:focus {
  outline: none;
  border-bottom-color: var(--glacier);
}

/* Pine filter bar, sticky on wide screens */
.routes-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--pine);
  color: var(--paper);
}

.routes-bar-inner {
  position: relative;
  display: flex;
  align-items: stretch;
}

.routes-bar-inner > :first-child {
  border-left: 1px solid rgb(242 239 234 / 0.18);
}

.routes-bar-spacer {
  flex: 1;
}

.routes-bar-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 0;
  margin: 10px 0;
  overflow: hidden;
  opacity: 0;
  transition:
    width 0.45s var(--ease),
    opacity 0.3s var(--ease),
    margin 0.45s var(--ease);
}

.routes-bar.is-stuck .routes-bar-search {
  width: min(300px, 22vw);
  margin-left: 16px;
  margin-right: 16px;
  opacity: 1;
}

/* Tighter buttons while the search shares the bar, so the values still fit */
.routes-bar.is-stuck :deep(.filter-dropdown-button) {
  padding-left: 14px;
  padding-right: 14px;
}

.routes-bar.is-stuck :deep(.filter-dropdown-value) {
  max-width: 14ch;
}

.routes-bar-search svg {
  left: 12px;
  width: 20px;
  height: 20px;
  color: var(--granite-700);
}

.routes-bar-search input {
  width: 100%;
  min-height: 44px;
  padding-left: 42px;
  border: 0;
  border-radius: 0;
  background: var(--white);
  color: var(--ink);
  font: 400 15px var(--font);
}

.routes-bar-search input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--glacier);
}

/* Inside the filter panels */
.routes-field {
  display: grid;
  gap: 8px;
}

.routes-options {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}

.routes-option {
  position: relative;
  cursor: pointer;
}

.routes-option input {
  position: absolute;
  opacity: 0;
}

.routes-option > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--granite-300);
  font-size: 14px;
  font-weight: 700;
}

.routes-option:hover > span {
  border-color: var(--ink);
}

.routes-option input:checked + span {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--white);
}

.routes-option input:checked + span :deep(.difficulty-mark) {
  color: var(--white) !important;
}

.routes-option input:focus-visible + span {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

.routes-option-count {
  font-size: 13px;
  font-weight: 500;
}

.routes-panel-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--granite-200);
  color: var(--granite-700);
  font-size: 13px;
}

.routes-panel-foot button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink);
  font: 700 13px var(--font);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.routes-sort {
  display: grid;
  gap: 4px;
}

.routes-sort button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--granite-300);
  background: var(--white);
  color: var(--ink);
  font: 700 14px var(--font);
  text-align: left;
  cursor: pointer;
}

.routes-sort button:hover {
  border-color: var(--ink);
}

.routes-sort button[aria-pressed='true'] {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--white);
}

.routes-sort svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Results */
.routes-results {
  padding-bottom: 120px;
}

.routes-results-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 28px 0;
}

.routes-active {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.routes-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 6px 0 12px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font: 700 13px/1 var(--font);
  cursor: pointer;
}

.routes-pill:hover {
  background: var(--ink);
  color: var(--ground);
}

.routes-pill svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.routes-clear {
  margin-left: 8px;
  font-size: 13px;
}

.routes-key {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.routes-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 56px 28px;
}

.routes-more {
  display: flex;
  justify-content: center;
  margin-top: 64px;
}

.routes-empty {
  display: grid;
  justify-items: start;
  gap: 12px;
  max-width: 560px;
  padding: 32px;
  border: 2px solid var(--ink);
}

.routes-empty h2 {
  font-size: 22px;
  font-weight: 900;
}

.routes-message {
  padding-top: 48px;
  padding-bottom: 96px;
}

@media (prefers-reduced-motion: reduce) {
  .routes-bar-search {
    transition: none;
  }
}

@media (max-width: 1100px) {
  .routes-tiles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .routes-bar {
    position: static;
  }

  .routes-bar-inner {
    flex-wrap: wrap;
  }

  .routes-bar-inner > :first-child {
    border-left: 0;
  }

  .routes-bar-spacer,
  .routes-bar-search {
    display: none;
  }
}

@media (max-width: 820px) {
  .routes-tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 40px 16px;
  }
}

@media (max-width: 700px) {
  .routes-key {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .routes-banner-sky,
  .routes-banner-front {
    background-position: 50% 4%;
    mask-position: 50% 4%;
    -webkit-mask-position: 50% 4%;
  }

  .routes-banner-title {
    padding-top: calc(var(--nav-height) + 32px);
  }
}
</style>
