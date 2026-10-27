<script setup>
import { ref, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/controller/authStore'
import { quizQuestions, quizAnswer } from '@/lib/quizQuestions'

const auth = useAuthStore()
const saved = ref(false)
const router = useRouter()

// Nothing is preselected, so every question has to be answered.
const answers = ref({})

// Fill in saved answers. Values from the old quiz that don't match an option
// (e.g. 12.3 km typed by hand) are left blank so the user picks again.
function loadFromProfile() {
  if (!auth.profile) return
  const loaded = {}
  for (const question of quizQuestions) {
    const match = quizAnswer(auth.profile, question)
    loaded[question.key] = match ? match.val : null
  }
  answers.value = loaded
}

onMounted(loadFromProfile)
watch(() => auth.profile, loadFromProfile)

async function submit() {
  saved.value = false
  const result = await auth.saveQuiz(answers.value)
  saved.value = result.success
  if (result.success) setTimeout(() => router.push('/profile'), 2000)
}
</script>

<template>
  <div class="container" style="max-width: 640px">
    <h1 class="h3 mb-3">Your hiking profile</h1>

    <div v-if="!auth.isLoggedIn" class="alert alert-warning">
      <RouterLink to="/auth">Sign in</RouterLink> to take the quiz.
    </div>

    <form v-else @submit.prevent="submit">
      <fieldset v-for="question in quizQuestions" :key="question.key" class="mb-4">
        <legend class="form-label fs-6 fw-semibold mb-1">{{ question.label }}</legend>
        <p v-if="question.hint" class="small text-muted mb-2">{{ question.hint }}</p>
        <div v-for="option in question.options" :key="option.val" class="form-check">
          <input
            :id="`${question.key}-${option.val}`"
            v-model="answers[question.key]"
            :value="option.val"
            :name="question.key"
            type="radio"
            class="form-check-input"
            required
          />
          <label class="form-check-label" :for="`${question.key}-${option.val}`">{{ option.desc }}</label>
        </div>
      </fieldset>

      <button class="btn btn-success" :disabled="auth.loading" type="submit">Save answers</button>
    </form>

    <div v-if="saved" class="alert alert-success mt-3">Saved.</div>
    <div v-if="auth.error" class="alert alert-danger mt-3">{{ auth.error }}</div>
  </div>
</template>
