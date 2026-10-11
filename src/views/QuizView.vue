<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const saved = ref(false)

const hikingDuration = [
  { lvl: 'new', desc: 'Not yet — I haven\'t started hiking' },
  { lvl: 'under1', desc: 'Less than a year' },
  { lvl: '1to3', desc: '1–3 years' },
  { lvl: '3to5', desc: '3–5 years' },
  { lvl: 'over5', desc: 'More than 5 years' },
]

const hikingFrequency = [
  { lvl: 'beginner', desc: 'Beginner — this would be my first real hike' },
  { lvl: 'occasional', desc: 'Occasional — a few times a year' },
  { lvl: 'regular', desc: 'Regular — monthly or more' },
  { lvl: 'experienced', desc: 'Experienced — multi-day treks regularly' },
]

const hikeTypes = [
  { lvl: 'day', desc: 'Day hikes' },
  { lvl: 'overnight', desc: 'Overnight hikes' },
  { lvl: 'multiday', desc: 'Multi-day treks' },
  { lvl: 'summit', desc: 'Summit hikes' },
]

const answers = ref({
  hikingDuration: 'under1',
  hikeTypes: [],
  experienceLevel: 'occasional',
  longestDistanceKm: 10,
  highestAltitudeM: 1000,
  goalsText: '',
})

function loadFromProfile() {
  if (!auth.profile) return
  answers.value = {
    hikingDuration: auth.profile.hiking_duration || 'under1',
    hikeTypes: auth.profile.hike_types || [],
    experienceLevel: auth.profile.experience_level || 'occasional',
    longestDistanceKm: auth.profile.longest_distance_km ?? 10,
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
        <label class="form-label" for="duration">How long have you been hiking?</label>
        <select id="duration" v-model="answers.hikingDuration" class="form-select">
          <option v-for="option in hikingDuration" :key="option.lvl" :value="option.lvl">
            {{ option.desc }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label" for="frequency">How often do you hike?</label>
        <select id="frequency" v-model="answers.experienceLevel" class="form-select">
          <option v-for="option in hikingFrequency" :key="option.lvl" :value="option.lvl">
            {{ option.desc }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <span class="form-label d-block">What types of hikes do you do?</span>
        <div v-for="option in hikeTypes" :key="option.lvl" class="form-check">
          <input :id="`type-${option.lvl}`" v-model="answers.hikeTypes" :value="option.lvl" type="checkbox" class="form-check-input" />
          <label class="form-check-label" :for="`type-${option.lvl}`">{{ option.desc }}</label>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label" for="distance">Longest hike so far (km)</label>
        <input id="distance" v-model.number="answers.longestDistanceKm" type="number" min="0" step="0.1" class="form-control" />
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
