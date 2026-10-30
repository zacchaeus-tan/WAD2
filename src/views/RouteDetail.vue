<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useScroll } from 'motion-v'
import { fetchRouteById, takePreloadedRoute } from '../controller/routesController'
import { useReviewsStore } from '../controller/reviewsStore'
import { useAuthStore } from '@/controller/authStore'
import { generateItinerary } from '../controller/itineraryController'
import ItineraryForm from '../components/itinerary/ItineraryForm.vue'
import ItineraryDay from '../components/itinerary/ItineraryDay.vue'
import { checkRouteSuitability } from '@/lib/matching'
import { useChecklistStore } from '@/controller/checklistStore'
import { fetchRouteWeather } from '@/controller/weatherController'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import RouteBanner from '@/components/routes/RouteBanner.vue'
import RouteNumbers from '@/components/routes/RouteNumbers.vue'
import SectionNav from '@/components/routes/SectionNav.vue'
import WalkedTrail from '@/components/routes/WalkedTrail.vue'
import GradeDial from '@/components/routes/GradeDial.vue'
import FitCheck from '@/components/matching/FitCheck.vue'
import GearChecklist from '@/components/checklist/GearChecklist.vue'
import TrailRegister from '@/components/reviews/TrailRegister.vue'

const routeParams = useRoute()
const reviewsStore = useReviewsStore()
const auth = useAuthStore()
const checklistStore = useChecklistStore()
// The globe's transition screen stays up until the route has loaded, so it's already here
const route = ref(takePreloadedRoute(routeParams.params.id))
const loading = ref(!route.value)
const error = ref('')

// "Sign in" links come back to this page afterwards
const signInTo = computed(() => ({ name: 'auth', query: { redirect: routeParams.fullPath } }))

const itinerary = ref(null)
const itineraryLoading = ref(false)
const itineraryError = ref('')

async function onGenerate(form) {
  itineraryLoading.value = true
  itineraryError.value = ''
  try {
    itinerary.value = await generateItinerary(route.value, form)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    itineraryError.value = `Unable to generate an itinerary: ${message}`
  } finally {
    itineraryLoading.value = false
  }
}

// Recomputed whenever the route or the signed-in user's profile changes.
const suitability = computed(() => {
  if (!route.value || !auth.profile) return null
  return checkRouteSuitability(auth.profile, route.value)
})

// weather forecast
const weather = ref(null)
const weatherError = ref('')

// The real reason goes to the console for developers; users only see a
// generic message.
async function loadWeather() {
  try {
    weather.value = await fetchRouteWeather(route.value)
  } catch (err) {
    console.error('Weather request failed:', err)
    weatherError.value = 'Weather is unavailable right now.'
  }
}

onMounted(async () => {
  checklistStore.reset()
  try {
    route.value ??= await fetchRouteById(routeParams.params.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error.value = `Unable to load this route: ${message}`
  } finally {
    loading.value = false
  }

  if (route.value) {
    await Promise.all([
      reviewsStore.fetchForRoute(routeParams.params.id),
      reviewsStore.fetchMyReview(routeParams.params.id, auth.user?.id),
      reviewsStore.fetchCategories(),
      checklistStore.loadForRoute(route.value.id),
      loadWeather(),
    ])
  }
})

// Signing in or out on this page changes whose review the form edits
watch(
  () => auth.user?.id,
  (userId) => {
    if (route.value) {
      reviewsStore.fetchMyReview(route.value.id, userId)
    }
  },
)

// After a review is saved or deleted, reload the route so its community
// stats (average rating, effective difficulty, hazard) show the new values.
async function reloadRoute() {
  try {
    route.value = await fetchRouteById(routeParams.params.id)
  } catch (err) {
    console.warn('Could not reload the route after a review change:', err)
  }
}

// Scroll progress through the sections: the section bar fills from top to bottom,
// and the trail is drawn a little ahead, level with the middle of the screen.
const journey = ref(null)
const { scrollYProgress: sectionProgress } = useScroll({
  target: journey,
  offset: ['start start', 'end end'],
})
const { scrollYProgress: trailProgress } = useScroll({
  target: journey,
  offset: ['start 0.55', 'end 0.55'],
})
</script>

<template>
  <div class="cairn route-detail">
    <div v-if="loading || error || !route" class="route-detail-state">
      <div class="cairn-wrap">
        <p v-if="loading" role="status">Loading route...</p>
        <p v-else-if="error" role="alert">{{ error }}</p>
        <p v-else>This route could not be found.</p>
        <RouterLink v-if="!loading" class="cairn-btn is-light" to="/routes"
          >Back to all routes</RouterLink
        >
      </div>
    </div>

    <template v-else>
      <RouteBanner :route="route" />
      <RouteNumbers :route="route" />
      <SectionNav :progress="sectionProgress" />

      <div ref="journey" class="route-journey">
        <WalkedTrail :progress="trailProgress" />

        <section id="fit" class="route-stop" aria-labelledby="fit-title">
          <FitCheck
            :suitability="suitability"
            :is-logged-in="auth.isLoggedIn"
            :sign-in-to="signInTo"
          />
        </section>

        <section class="route-stop" aria-label="How hard, honestly">
          <GradeDial :route="route" />
        </section>

        <section id="weather" class="route-stop" aria-label="The week on the mountain">
          <WeatherForecast :weather="weather" :error="weatherError" />
        </section>

        <section id="plan" class="route-stop" aria-labelledby="plan-title">
          <article class="route-plan">
            <div class="route-plan-head">
              <h2 id="plan-title" class="cairn-headline">Plan your itinerary</h2>
              <span class="route-ai-tag">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                </svg>
                AI-generated
              </span>
            </div>
            <p class="route-plan-intro">
              Choose when you're starting, how many days you have and your pace, and we'll suggest a
              day-by-day plan.
            </p>

            <ItineraryForm
              v-if="auth.isLoggedIn"
              :route="route"
              :loading="itineraryLoading"
              @generate="onGenerate"
            />
            <p v-else class="route-plan-intro">
              <RouterLink :to="signInTo">Sign in</RouterLink>
              to generate an itinerary.
            </p>

            <p v-if="itineraryError" class="route-plan-error" role="alert">{{ itineraryError }}</p>

            <template v-if="itinerary">
              <p v-if="itinerary.summary" class="route-plan-summary">{{ itinerary.summary }}</p>

              <div class="route-plan-days">
                <ItineraryDay v-for="day in itinerary.days" :key="day.day" :day="day" />
              </div>

              <template v-if="itinerary.tips && itinerary.tips.length">
                <h3 class="route-plan-tips-title">Tips</h3>
                <ul class="route-plan-tips">
                  <li v-for="tip in itinerary.tips" :key="tip">{{ tip }}</li>
                </ul>
              </template>

              <p class="cairn-fine">
                AI-generated. Check trail conditions, weather and permits before you hike.
              </p>
            </template>
          </article>
        </section>

        <section id="gear" class="route-stop" aria-labelledby="gear-title">
          <GearChecklist :route="route" :is-logged-in="auth.isLoggedIn" :sign-in-to="signInTo" />
        </section>

        <section id="reviews" class="route-stop is-full" aria-label="Trail register">
          <div class="route-register">
            <TrailRegister
              :route="route"
              :is-logged-in="auth.isLoggedIn"
              :user-id="auth.user?.id ?? null"
              :sign-in-to="signInTo"
              @saved="reloadRoute"
              @deleted="reloadRoute"
            />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.route-detail {
  min-height: 100vh;
}

/* Loading and error states sit on a dark band so the overlaid navbar stays readable */
.route-detail-state {
  padding: calc(var(--nav-height) + 96px) 0 96px;
  background: #0d1411;
  color: var(--paper);
}

.route-detail-state .cairn-wrap {
  display: grid;
  justify-items: start;
  gap: 24px;
}

/* The sections sit along the walked trail, wide and well apart */
.route-journey {
  position: relative;
  padding: 72px 0 120px;
}

.route-stop {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 2 * var(--gutter)));
  margin: 0 auto clamp(140px, 16vw, 220px);
  scroll-margin-top: 80px;
}

.route-stop > * {
  min-width: 0;
}

.route-stop:last-child {
  margin-bottom: 0;
}

/* The trail register runs the full width of the page */
.route-stop.is-full {
  width: 100%;
}

.route-register {
  padding: clamp(32px, 4vw, 56px) max(var(--gutter), calc((100% - 1320px) / 2));
  border-top: 2px solid var(--ink);
  border-bottom: 2px solid var(--ink);
  background: var(--ground);
}

/* Plan your itinerary */
.route-plan {
  display: grid;
  gap: 20px;
  padding: clamp(24px, 3vw, 44px);
  background: #d6e4ec;
  box-shadow: var(--shadow-stop);
}

.route-plan-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16px;
}

.route-ai-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--granite-700);
  color: var(--granite-700);
  font-size: 12px;
  font-weight: 700;
}

.route-ai-tag svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

.route-plan-intro {
  max-width: 60ch;
  color: var(--granite-700);
  font-size: 16px;
}

.route-plan-error {
  padding: 10px 12px;
  background: #fdecea;
  color: #b42318;
}

.route-plan-summary {
  max-width: 65ch;
  font-size: 18px;
  line-height: 28px;
}

.route-plan-days {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}

.route-plan-tips-title {
  font-size: 16px;
  font-weight: 900;
}

.route-plan-tips {
  margin: 0;
  padding-left: 20px;
  line-height: 24px;
}

@media (max-width: 900px) {
  .route-stop {
    margin-bottom: 120px;
  }
}
</style>
