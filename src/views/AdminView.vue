<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReviewsStore } from '@/stores/reviews'
import { useRoutesStore } from '@/stores/routes'
import { formatDate, difficultyLabel } from '@/lib/format'

const auth = useAuthStore()
const reviewsStore = useReviewsStore()
const routesStore = useRoutesStore()

const statusDraft = ref({})
const message = ref('')

onMounted(async () => {
  await Promise.all([reviewsStore.fetchAllForModeration(), routesStore.fetchRoutes()])
  routesStore.routes.forEach((r) => {
    statusDraft.value[r.id] = { status: r.safety_status, note: r.safety_status_note || '' }
  })
})

async function removeReview(review) {
  await reviewsStore.remove(review.id, review.route_id)
  await reviewsStore.fetchAllForModeration()
  message.value = 'Review deleted.'
}

async function removeIncident(incident) {
  await reviewsStore.removeIncident(incident.id)
  await reviewsStore.fetchAllForModeration()
  message.value = 'Incident note deleted.'
}

async function saveStatus(route) {
  const draft = statusDraft.value[route.id]
  const result = await routesStore.updateSafetyStatus(route.id, draft.status, draft.note)
  message.value = result.success ? `Updated ${route.name}.` : result.error
}
</script>

<template>
  <div class="container pb-5">
    <h1 class="h3 mb-3">Moderation</h1>

    <div v-if="!auth.isAdmin" class="alert alert-danger">
      This page is for admins. Your account does not have the admin flag set.
    </div>

    <div v-else>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>

      <h2 class="h5 mt-4">Route safety status</h2>
      <table class="table table-sm align-middle">
        <thead><tr><th>Route</th><th>Status</th><th>Note</th><th></th></tr></thead>
        <tbody>
          <tr v-for="route in routesStore.routes" :key="route.id">
            <td>
              {{ route.name }}
              <div class="small text-muted">
                {{ difficultyLabel(route.effective_difficulty) }} · hazard {{ route.community_hazard_level }}
              </div>
            </td>
            <td style="width: 140px">
              <select v-if="statusDraft[route.id]" v-model="statusDraft[route.id].status" class="form-select form-select-sm">
                <option value="open">open</option>
                <option value="caution">caution</option>
                <option value="closed">closed</option>
              </select>
            </td>
            <td>
              <input v-if="statusDraft[route.id]" v-model="statusDraft[route.id].note" class="form-control form-control-sm" />
            </td>
            <td><button class="btn btn-sm btn-outline-primary" @click="saveStatus(route)">Save</button></td>
          </tr>
        </tbody>
      </table>

      <h2 class="h5 mt-4">Reviews</h2>
      <p v-if="!reviewsStore.reviews.length" class="text-muted small">No reviews yet.</p>

      <div v-for="review in reviewsStore.reviews" :key="review.id" class="card mb-2"><div class="card-body">
        <div class="d-flex justify-content-between">
          <div>
            <strong>{{ review.profiles?.display_name || 'Hiker' }}</strong>
            <span class="text-muted small"> on {{ review.routes?.name }}</span>
          </div>
          <button class="btn btn-sm btn-outline-danger" @click="removeReview(review)">Delete review</button>
        </div>
        <p class="small text-muted mb-2">
          {{ formatDate(review.created_at) }} · {{ review.rating }}★ ·
          felt {{ difficultyLabel(review.perceived_difficulty) }}
        </p>
        <p class="mb-2">{{ review.review_text }}</p>
        <div v-for="incident in review.review_incidents" :key="incident.id" class="d-flex justify-content-between alert alert-warning py-1 px-2 small mb-1">
          <span><strong>{{ incident.category }}</strong> — {{ incident.note }}</span>
          <button class="btn btn-sm btn-link text-danger p-0" @click="removeIncident(incident)">delete note</button>
        </div>
      </div></div>
    </div>
  </div>
</template>
