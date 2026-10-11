<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useReviewsStore } from '@/stores/reviews'
import { useRoutesStore } from '@/stores/routes'
import SafetyStatusTable from '@/components/admin/SafetyStatusTable.vue'
import ReviewModeration from '@/components/admin/ReviewModeration.vue'

const auth = useAuthStore()
const reviewsStore = useReviewsStore()
const routesStore = useRoutesStore()

const message = ref('')

onMounted(async () => {
  await Promise.all([reviewsStore.fetchAllForModeration(), routesStore.fetchRoutes()])
})
</script>

<template>
  <div class="container pb-5">
    <h1 class="h3 mb-3">Moderation</h1>

    <div v-if="!auth.isAdmin" class="alert alert-danger">
      This page is for admins. Your account does not have the admin flag set.
    </div>

    <div v-else>
      <div v-if="message" class="alert alert-info py-2">{{ message }}</div>
      <SafetyStatusTable @message="message = $event" />
      <ReviewModeration @message="message = $event" />
    </div>
  </div>
</template>
