<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const saved = ref(false)

const answers = ref({
  experienceLevel: 'occasional',
  longestDistanceKm: 10,
  maxElevationGainM: 500,
  highestAltitudeM: 1000,
  goalsText: '',
})

function loadFromProfile() {
  if (!auth.profile) return
  answers.value = {
    experienceLevel: auth.profile.experience_level || 'occasional',
    longestDistanceKm: auth.profile.longest_distance_km ?? 10,
    maxElevationGainM: auth.profile.max_elevation_gain_m ?? 500,
    highestAltitudeM: auth.profile.highest_altitude_m ?? 1000,
    goalsText: auth.profile.goals_text || '',
  }
}

onMounted(loadFromProfile)
watch(() => auth.profile, loadFromProfile)

async function submit() {
  saved.value = false
  const result = await auth.saveQuiz(answers.value)
  saved.value = result.success
}
</script>

<template>
  <div class="container" style="max-width: 640px">
    <h1 class="h3 mb-3">Your hiking profile</h1>

    <div v-if="!auth.isLoggedIn" class="alert alert-warning">
      <RouterLink to="/auth">Sign in</RouterLink> to take the quiz.
    </div>

    <form v-else @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label" for="experience">How often do you hike?</label>
        <select id="experience" v-model="answers.experienceLevel" class="form-select">
          <option value="beginner">Beginner — this would be my first real hike</option>
          <option value="occasional">Occasional — a few times a year</option>
          <option value="regular">Regular — monthly or more</option>
          <option value="experienced">Experienced — multi-day treks regularly</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label" for="distance">Longest hike so far (km)</label>
        <input id="distance" v-model.number="answers.longestDistanceKm" type="number" min="0" step="0.1" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label" for="gain">Most elevation gained in one day (m)</label>
        <input id="gain" v-model.number="answers.maxElevationGainM" type="number" min="0" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label" for="altitude">Highest altitude reached (m)</label>
        <input id="altitude" v-model.number="answers.highestAltitudeM" type="number" min="0" class="form-control" />
      </div>

      <div class="mb-3">
        <label class="form-label" for="goals">What are you training for? (optional)</label>
        <textarea id="goals" v-model="answers.goalsText" class="form-control" rows="3"></textarea>
      </div>

      <button class="btn btn-success" :disabled="auth.loading" type="submit">Save answers</button>
    </form>

    <div v-if="auth.profile?.fitness_score !== null && auth.profile?.fitness_score !== undefined" class="card mt-4">
      <div class="card-body">
        <h2 class="h5">Fitness score</h2>
        <p class="display-6 mb-1">{{ auth.profile.fitness_score }} <small class="text-muted fs-6">/ 100</small></p>
        <p class="text-muted small mb-2">Computed in the database from your answers.</p>
        <RouterLink class="btn btn-sm btn-outline-primary" to="/routes">See how routes match</RouterLink>
      </div>
    </div>

    <div v-if="saved" class="alert alert-success mt-3">Saved.</div>
    <div v-if="auth.error" class="alert alert-danger mt-3">{{ auth.error }}</div>
  </div>
</template>
