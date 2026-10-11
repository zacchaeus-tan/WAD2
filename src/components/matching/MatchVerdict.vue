<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatchStore } from '@/stores/match'
import { verdictLabel, verdictClass } from '@/lib/format'

const auth = useAuthStore()
const matchStore = useMatchStore()
</script>

<template>
  <section class="mb-4">
    <h2 class="h5">Difficulty match</h2>
    <div v-if="!auth.isLoggedIn" class="alert alert-secondary">
      <RouterLink to="/auth">Sign in</RouterLink> and take the quiz to see whether this route matches you.
    </div>
    <div v-else-if="!auth.profile?.fitness_score" class="alert alert-secondary">
      <RouterLink to="/quiz">Take the quiz</RouterLink> to see your match.
    </div>
    <div v-else-if="matchStore.result" class="alert" :class="verdictClass(matchStore.result.verdict)">
      <h3 class="h6">{{ verdictLabel(matchStore.result.verdict) }}</h3>
      <p class="small mb-2">
        Your fitness score {{ matchStore.result.fitness_score }} vs route demand {{ matchStore.result.route_demand }}.
      </p>
      <p class="mb-2">{{ matchStore.result.explanation }}</p>
      <ul class="small mb-0">
        <li v-for="tip in matchStore.result.tips" :key="tip">{{ tip }}</li>
      </ul>
    </div>
  </section>
</template>
