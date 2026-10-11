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
  <div class="container pb-5">
    <LoadingSpinner v-if="routesStore.loading" />
    <div v-else-if="routesStore.error" class="alert alert-danger">{{ routesStore.error }}</div>

    <div v-else-if="route">
      <RouteHeader :route="route" />
      <RouteStats :route="route" />

      <!-- Feature 1: match -->
      <MatchVerdict />

      <!-- Feature 3: weather -->
      <WeatherForecast :weather="weather" :error="weatherError" />

      <!-- Feature 2: checklist -->
      <ChecklistPanel :route="route" :weather="weather" />

      <!-- Feature 5: itinerary -->
      <ItineraryDays />

      <!-- Feature 4: reviews -->
      <section>
        <h2 class="h5">Community reviews</h2>
        <ReviewSummary :route="route" />
        <ReviewForm :route="route" />
        <ReviewList />
      </section>
    </div>
  </div>
</template>
