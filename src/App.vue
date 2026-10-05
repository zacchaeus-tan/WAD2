<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(() => {
  auth.initSession()
})
</script>

<template>
  <nav class="navbar navbar-expand navbar-dark bg-dark mb-4">
    <div class="container">
      <RouterLink class="navbar-brand" to="/">Trek Prep</RouterLink>
      <ul class="navbar-nav me-auto">
        <li class="nav-item"><RouterLink class="nav-link" to="/routes">Routes</RouterLink></li>
        <li class="nav-item"><RouterLink class="nav-link" to="/quiz">My profile</RouterLink></li>
        <li v-if="auth.isAdmin" class="nav-item">
          <RouterLink class="nav-link" to="/admin">Admin</RouterLink>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-3">
        <span v-if="auth.isLoggedIn" class="navbar-text small">
          {{ auth.profile?.display_name || auth.user?.email }}
        </span>
        <button v-if="auth.isLoggedIn" class="btn btn-sm btn-outline-light" @click="auth.logout()">
          Sign out
        </button>
        <RouterLink v-else class="btn btn-sm btn-light" to="/auth">Sign in</RouterLink>
      </div>
    </div>
  </nav>

  <RouterView />
</template>
