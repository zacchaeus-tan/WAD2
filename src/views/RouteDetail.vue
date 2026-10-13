<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRoutesStore } from '@/stores/routes'
import { useReviewsStore } from '@/stores/reviews'
import { useAuthStore } from '@/stores/auth'
import { useMatchStore } from '@/stores/match'
import { useChecklistStore } from '@/stores/checklist'
import { fetchWeather } from '@/services/weather.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RouteHeader from '@/components/routes/RouteHeader.vue'
import RouteStats from '@/components/routes/RouteStats.vue'
import MatchVerdict from '@/components/matching/MatchVerdict.vue'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import ChecklistPanel from '@/components/checklist/ChecklistPanel.vue'
import ItineraryDays from '@/components/itinerary/ItineraryDays.vue'
import ReviewSummary from '@/components/reviews/ReviewSummary.vue'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import ReviewList from '@/components/reviews/ReviewList.vue'

const routeParam = useRoute()
const routesStore = useRoutesStore()
const reviewsStore = useReviewsStore()
const auth = useAuthStore()
const matchStore = useMatchStore()
const checklistStore = useChecklistStore()

const weather = ref(null)
const weatherError = ref('')

const route = computed(() => routesStore.currentRoute)

async function load() {
  const id = routeParam.params.id
  await routesStore.fetchRouteById(id)
  await Promise.all([reviewsStore.fetchForRoute(id), reviewsStore.fetchCategories()])

  if (route.value?.latitude && route.value?.longitude) {
    try {
      weather.value = await fetchWeather(route.value.latitude, route.value.longitude)
    } catch (e) {
      weatherError.value = e.message
    }
  }

  if (auth.profile) {
    await matchStore.computeForRoute(route.value, auth.profile)
    await checklistStore.load(id, auth.user.id)
  }
}

onMounted(load)
watch(() => routeParam.params.id, load)
watch(() => auth.profile, async (profile) => {
  if (profile && route.value) {
    await matchStore.computeForRoute(route.value, profile)
    await checklistStore.load(route.value.id, auth.user.id)
  }
})
</script>

<template>
  <main class="route-detail-page">
    <div class="container pb-5">
    <LoadingSpinner v-if="routesStore.loading" />
    <div v-else-if="routesStore.error" class="alert alert-danger detail-alert">{{ routesStore.error }}</div>

    <div v-else-if="route">
      <RouteHeader :route="route" />
      <div class="detail-section">
        <RouteStats :route="route" />
      </div>

      <!-- Feature 1: match -->
      <section class="detail-section">
        <MatchVerdict />
      </section>

      <!-- Feature 3: weather -->
      <section class="detail-section">
        <WeatherForecast :weather="weather" :error="weatherError" />
      </section>

      <!-- Feature 2: checklist -->
      <section class="detail-section">
        <ChecklistPanel :route="route" :weather="weather" />
      </section>

      <!-- Feature 5: itinerary -->
      <section class="detail-section">
        <ItineraryDays />
      </section>

      <!-- Feature 4: reviews -->
      <section class="detail-section reviews-section">
        <div class="reviews-heading">
          <p class="detail-eyebrow mb-1">From the trail community</p>
          <h2 class="h4 mb-0">Community reviews</h2>
        </div>
        <ReviewSummary :route="route" />
        <ReviewForm :route="route" />
        <ReviewList />
      </section>
    </div>
    </div>
  </main>
</template>

<style scoped>
.route-detail-page {
  min-height: calc(100vh - 4rem);
  padding-top: 1.5rem;
  background:
    radial-gradient(ellipse at 92% 0%, rgb(218 231 215 / 36%), transparent 34rem),
    #f8f9f6;
}

.detail-section {
  margin-top: 1.5rem;
}

.reviews-section {
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid #e6eae3;
  border-radius: 1.1rem;
  background: #fff;
  box-shadow: 0 8px 28px rgb(34 54 39 / 5%);
}

.reviews-heading {
  margin-bottom: 1.25rem;
}

.reviews-heading h2 {
  color: #26392d;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.detail-eyebrow {
  color: #64815d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-alert {
  border-radius: 0.9rem;
}

@media (min-width: 768px) {
  .route-detail-page {
    padding-top: 2rem;
  }

  .detail-section {
    margin-top: 2rem;
  }
}
</style>
