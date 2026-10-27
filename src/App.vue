<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/controller/authStore'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="site-header">
    <nav class="site-nav" aria-label="Main navigation">
      <RouterLink class="site-brand" to="/">CAIRN</RouterLink>
      <div class="site-nav-links">
        <RouterLink class="site-nav-link" to="/">Home</RouterLink>
        <RouterLink class="site-nav-link" to="/globe">Globe</RouterLink>
        <RouterLink class="site-nav-link" to="/routes">Browse routes</RouterLink>
        <template v-if="auth.isLoggedIn">
          <RouterLink class="site-nav-link" to="/profile">Profile</RouterLink>
          <button type="button" class="site-nav-link site-nav-button" @click="logout">Log out</button>
        </template>
        <RouterLink v-else class="site-nav-link" to="/auth">Sign in</RouterLink>
        <RouterLink class="site-nav-link site-nav-cta" to="/quiz">Take the quiz</RouterLink>
      </div>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
.site-header {
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.site-nav {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  min-height: 4rem;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
}

.site-brand {
  color: #198754;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-decoration: none;
}

.site-nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.site-nav-link {
  color: #374151;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}

.site-nav-link:hover,
.site-nav-link.router-link-active:not(.site-nav-cta) {
  color: #198754;
}

.site-nav-button {
  border: 0;
  padding: 0;
  background: none;
}

.site-nav-cta {
  border-radius: 0.375rem;
  padding: 0.55rem 0.9rem;
  background: #198754;
  color: #fff;
}

.site-nav-cta:hover {
  background: #157347;
  color: #fff;
}

@media (max-width: 480px) {
  .site-nav {
    align-items: flex-start;
    flex-direction: column;
    padding: 0.75rem 1rem;
  }

  .site-nav-links {
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
  }
}
</style>
