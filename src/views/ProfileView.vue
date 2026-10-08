<script setup>
import { onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChecklistStore } from '@/stores/checklist'
import { formatDate } from '@/lib/format'

const auth = useAuthStore()
const checklistStore = useChecklistStore()

onMounted(() => {
  if (auth.user) checklistStore.loadAll(auth.user.id)
})
watch(() => auth.user, (user) => {
  if (user) checklistStore.loadAll(user.id)
})
</script>


<template>
    <!-- not logged in -->
    <div v-if="!auth.isLoggedIn" class="alert alert-warning">
        <RouterLink to="/auth">Sign in</RouterLink> to see your profile.
    </div>

    <!-- logged in -->
    <div v-else class="container" style="max-width: 720px">
        <h1 class="h3 mb-3">My profile</h1>

        <div v-if="!auth.isLoggedIn" class="alert alert-warning">
        <RouterLink to="/auth">Sign in</RouterLink> to see your profile.
        </div>
        <section class="mb-4">
        <h2 class="h5">My gear checklists</h2>

        <div v-if="checklistStore.error" class="alert alert-danger small">{{ checklistStore.error }}</div>

        <p v-if="!checklistStore.allChecklists.length" class="text-muted small">
          No checklists yet. Open a trail and generate one.
        </p>

        <ul v-else class="list-group">
          <li v-for="c in checklistStore.allChecklists" :key="c.id"
              class="list-group-item d-flex justify-content-between align-items-center gap-2">
            <div class="flex-grow-1">
              <RouterLink :to="{ name: 'route-detail', params: { id: c.routeId } }">{{ c.routeName }}</RouterLink>
              <span v-if="c.country" class="text-muted small"> · {{ c.country }}</span>
              <div class="small text-muted">
                {{ c.packed }}/{{ c.total }} packed · updated {{ formatDate(c.generatedAt) }}
              </div>
            </div>
            <button class="btn btn-sm btn-link text-danger p-0" @click="checklistStore.deleteChecklist(c.id)">
              delete
            </button>
          </li>
        </ul>
      </section>

    <!-- quiz summary-->
        <div class="card mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <h2 class="h5 mb-1">{{ auth.profile?.display_name || auth.user.email }}</h2>
                        <p class="small text-muted mb-2">
                            Experience: {{ auth.profile?.experience_level || 'not set' }}
                        </p>
                        <p v-if="auth.profile?.fitness_score != null" class="mb-0">
                            Fitness score: <strong>{{ auth.profile.fitness_score }}</strong> / 100
                        </p>
                    </div>

                    <RouterLink class="btn btn-sm btn-outline-primary" :to="{ name: 'quiz' }">
                    {{ auth.profile?.fitness_score != null ? 'Retake quiz' : 'Take the quiz' }}
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>