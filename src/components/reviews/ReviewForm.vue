<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReviewsStore } from '@/stores/reviews'
import { useRoutesStore } from '@/stores/routes'
import { useMatchStore } from '@/stores/match'

const props = defineProps({
  route: { type: Object, required: true },
})

const auth = useAuthStore()
const reviewsStore = useReviewsStore()
const routesStore = useRoutesStore()
const matchStore = useMatchStore()

const saving = ref(false)
const formError = ref('')

const form = ref({
  rating: 5,
  perceivedDifficulty: 3,
  completed: true,
  reviewText: '',
  incidents: [],
})

const myReview = computed(() => (auth.user ? reviewsStore.myReview(auth.user.id) : null))

// Refill the form whenever the user's saved review is (re)loaded.
function resetForm() {
  if (myReview.value) {
    form.value = {
      rating: myReview.value.rating,
      perceivedDifficulty: myReview.value.perceived_difficulty,
      completed: myReview.value.completed,
      reviewText: myReview.value.review_text || '',
      incidents: (myReview.value.review_incidents || []).map((i) => ({
        category: i.category,
        note: i.note,
        pointId: i.point_id,
      })),
    }
  } else {
    form.value = { rating: 5, perceivedDifficulty: 3, completed: true, reviewText: '', incidents: [] }
  }
}

watch(myReview, resetForm, { immediate: true })

function addIncident() {
  if (form.value.incidents.length >= 3) return
  form.value.incidents.push({ category: 'navigation', note: '', pointId: null })
}

async function submitReview() {
  saving.value = true
  formError.value = ''

  const result = await reviewsStore.save({
    routeId: props.route.id,
    userId: auth.user.id,
    rating: form.value.rating,
    perceivedDifficulty: form.value.perceivedDifficulty,
    completed: form.value.completed,
    reviewText: form.value.reviewText,
    incidents: form.value.incidents.filter((i) => i.note.trim()),
  })

  if (!result.success) formError.value = result.error
  await routesStore.refreshCurrentRouteStats()
  if (auth.profile) await matchStore.computeForRoute(routesStore.currentRoute, auth.profile)
  saving.value = false
}

async function deleteReview() {
  await reviewsStore.remove(myReview.value.id, props.route.id)
  await routesStore.refreshCurrentRouteStats()
}
</script>

<template>
  <div v-if="!auth.isLoggedIn" class="alert alert-secondary">
    <RouterLink to="/auth">Sign in</RouterLink> to leave a review.
  </div>
  <div v-else class="card mb-3"><div class="card-body">
    <h3 class="h6">{{ myReview ? 'Edit your review' : 'Write a review' }}</h3>
    <form @submit.prevent="submitReview">
      <div class="row g-2 mb-2">
        <div class="col-sm-4">
          <label class="form-label small" for="rating">Quality (1–5)</label>
          <select id="rating" v-model.number="form.rating" class="form-select form-select-sm">
            <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="col-sm-4">
          <label class="form-label small" for="felt">How hard did it feel?</label>
          <select id="felt" v-model.number="form.perceivedDifficulty" class="form-select form-select-sm">
            <option :value="1">Easy</option><option :value="2">Moderate</option>
            <option :value="3">Hard</option><option :value="4">Strenuous</option>
          </select>
        </div>
        <div class="col-sm-4">
          <label class="form-label small" for="completed">Did you finish?</label>
          <select id="completed" v-model="form.completed" class="form-select form-select-sm">
            <option :value="true">Completed</option>
            <option :value="false">Did not complete</option>
          </select>
        </div>
      </div>

      <textarea v-model="form.reviewText" class="form-control form-control-sm mb-2" rows="3" placeholder="How was it?"></textarea>

      <div v-for="(incident, index) in form.incidents" :key="index" class="row g-2 mb-2 align-items-end">
        <div class="col-sm-3">
          <label class="form-label small">Incident</label>
          <select v-model="incident.category" class="form-select form-select-sm">
            <option v-for="c in reviewsStore.categories" :key="c.category" :value="c.category">{{ c.label }}</option>
          </select>
        </div>
        <div class="col-sm-3">
          <label class="form-label small">Where</label>
          <select v-model="incident.pointId" class="form-select form-select-sm">
            <option :value="null">Not specific</option>
            <option v-for="p in routesStore.points" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="col-sm-5">
          <input v-model="incident.note" class="form-control form-control-sm" placeholder="What happened?" />
        </div>
        <div class="col-sm-1">
          <button type="button" class="btn btn-sm btn-link text-danger p-0" @click="form.incidents.splice(index, 1)">×</button>
        </div>
      </div>

      <button v-if="form.incidents.length < 3" type="button" class="btn btn-sm btn-outline-secondary me-2" @click="addIncident">
        Flag an incident
      </button>
      <button class="btn btn-sm btn-success me-2" :disabled="saving" type="submit">
        {{ myReview ? 'Update review' : 'Submit review' }}
      </button>
      <button v-if="myReview" class="btn btn-sm btn-outline-danger" type="button" @click="deleteReview">Delete</button>
    </form>
    <div v-if="formError" class="alert alert-danger mt-2 mb-0 small">{{ formError }}</div>
  </div></div>
</template>
