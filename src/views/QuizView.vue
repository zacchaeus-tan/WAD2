<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/controller/authStore'
import { quizQuestions, quizAnswer } from '@/lib/quizQuestions'
import QuizAscent from '@/components/quiz/QuizAscent.vue'
import ridgePhoto from '@/assets/img/card-ridge-hikers.jpg'

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

function setAnswer(key, value) {
  answers.value = { ...answers.value, [key]: value }
}

// How many questions have an answer (the summit needs all of them)
const answeredCount = computed(
  () => quizQuestions.filter((q) => answers.value[q.key] !== null && answers.value[q.key] !== undefined).length,
)

</script>

<template>
  <div class="cairn quiz">
    <img class="quiz-photo" :src="ridgePhoto" alt="" />

    <div class="cairn-wrap quiz-inner">
      <div v-if="!auth.isLoggedIn" class="quiz-signed-out">
        <h1 class="quiz-title">Your hiking profile</h1>
        <p><RouterLink to="/auth">Sign in</RouterLink> to take the quiz.</p>
      </div>

      <template v-else>
        <header class="quiz-head">
          <div>
            <h1 class="quiz-title">Your hiking profile</h1>
            <p class="quiz-intro">Five questions about what you've walked so far. The fit check on every route uses them.</p>
          </div>
        </header>

        <QuizAscent
          compact
          :questions="quizQuestions"
          :answers="answers"
          :answered-count="answeredCount"
          :saving="auth.loading"
          :saved="saved"
          :error="auth.error"
          @answer="setAnswer"
          @submit="submit"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Full-screen dimmed photo of hikers on a ridge trail, with the navbar on top */
.quiz {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: clip;
  background: var(--night);
  isolation: isolate;
}

.quiz-photo {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 45%;
  opacity: 0.38;
  filter: saturate(0.6) brightness(0.8);
}

.quiz-inner {
  display: grid;
  align-content: start;
  gap: clamp(24px, 4vw, 48px);
  min-height: 100vh;
  min-height: 100svh;
  padding-top: calc(var(--nav-height) + clamp(32px, 6vh, 64px));
  padding-bottom: 64px;
  color: var(--paper);
}

.quiz-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.quiz-title {
  font-size: clamp(40px, 6vw, 88px);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.quiz-intro {
  max-width: 48ch;
  margin-top: 14px !important;
  color: var(--lichen);
  font-size: 17px;
  line-height: 26px;
}

.quiz-signed-out {
  display: grid;
  gap: 16px;
}

.quiz-signed-out a {
  color: var(--white);
  font-weight: 700;
}

/* On wide screens the page is exactly the screen tall and the ascent takes all of it.
   The heading sits large in the empty sky above the left side of the slope. */
@media (min-width: 901px) {
  .quiz .quiz-inner {
    position: relative;
    grid-template-rows: minmax(0, 1fr);
    height: 100vh;
    height: 100svh;
    min-height: 560px;
    padding-top: calc(var(--nav-height) + clamp(12px, 3vh, 32px));
    padding-bottom: clamp(16px, 3vh, 32px);
  }

  .quiz .quiz-head {
    position: absolute;
    top: calc(var(--nav-height) + clamp(16px, 3.5vh, 40px));
    left: var(--gutter);
    z-index: 1;
    width: min(40%, 620px);
  }

  .quiz .quiz-title {
    font-size: min(6.2vw, 11.5vh);
    line-height: 0.9;
  }

  .quiz .quiz-intro {
    max-width: 30ch;
    margin-top: clamp(12px, 2.5vh, 24px) !important;
    font-size: clamp(16px, min(1.35vw, 2.4vh), 22px);
    line-height: 1.45;
  }
}

@media (max-width: 640px) {
  .quiz-head {
    align-items: flex-start;
  }
}
</style>
