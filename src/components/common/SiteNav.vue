<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/controller/authStore'

// overlay: sits on top of a dark banner (route detail) with light text.
defineProps({
  overlay: { type: Boolean, default: false },
})

const auth = useAuthStore()
const router = useRouter()
const currentRoute = useRoute()

// Phone menu
const menuOpen = ref(false)
watch(() => currentRoute.fullPath, () => (menuOpen.value = false))

async function logout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="cairn site-nav" :class="{ 'is-overlay': overlay }">
    <div class="cairn-wrap site-nav-inner">
      <nav class="site-nav-group is-left" aria-label="Explore">
        <RouterLink class="site-nav-link" to="/" exact-active-class="is-current">Home</RouterLink>
        <RouterLink class="site-nav-link" to="/routes" active-class="is-current">Browse routes</RouterLink>
        <RouterLink class="site-nav-link" to="/globe" active-class="is-current">Globe</RouterLink>
      </nav>

      <RouterLink class="site-brand" to="/" aria-label="CAIRN home">
        <span class="site-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <g fill="currentColor">
              <ellipse cx="12" cy="20" rx="8" ry="2.4" />
              <ellipse cx="12" cy="15.2" rx="6" ry="2.2" />
              <ellipse cx="12" cy="10.6" rx="4.4" ry="2" />
              <ellipse cx="12" cy="6.4" rx="3" ry="1.8" />
              <ellipse cx="12" cy="3" rx="1.6" ry="1.2" />
            </g>
          </svg>
        </span>
        CAIRN
      </RouterLink>

      <nav class="site-nav-group is-right" aria-label="Account">
        <template v-if="auth.isLoggedIn">
          <RouterLink class="site-nav-link" to="/profile" active-class="is-current">Profile</RouterLink>
          <button type="button" class="site-nav-link" @click="logout">Log out</button>
        </template>
        <RouterLink v-else class="site-nav-link is-solid" to="/auth">Sign in</RouterLink>
        <RouterLink class="site-nav-link is-blaze" to="/quiz">Take the quiz</RouterLink>
      </nav>

      <button
        type="button"
        class="site-nav-menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-controls="site-nav-panel"
        @click="menuOpen = !menuOpen"
      >
        <span class="cairn-visually-hidden">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="menuOpen" d="M6 6l12 12M18 6 6 18" />
          <path v-else d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>

    <nav v-if="menuOpen" id="site-nav-panel" class="site-nav-panel" aria-label="Menu">
      <RouterLink class="site-nav-panel-link" to="/">Home</RouterLink>
      <RouterLink class="site-nav-panel-link" to="/routes">Browse routes</RouterLink>
      <RouterLink class="site-nav-panel-link" to="/globe">Globe</RouterLink>
      <template v-if="auth.isLoggedIn">
        <RouterLink class="site-nav-panel-link" to="/profile">Profile</RouterLink>
        <button type="button" class="site-nav-panel-link" @click="logout">Log out</button>
      </template>
      <RouterLink v-else class="site-nav-panel-link" to="/auth">Sign in</RouterLink>
      <RouterLink class="cairn-btn is-blaze site-nav-panel-cta" to="/quiz">Take the quiz</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
/* 63px tall plus a 2px rule = 4rem + 1px, the height the globe page leaves for the navbar */
.site-nav {
  position: relative;
  z-index: 20;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font);
}

.site-nav-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: var(--nav-height);
  border-bottom: 2px solid var(--ink);
}

.site-nav-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.site-nav-group.is-right {
  justify-content: flex-end;
}

.site-nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  background: none;
  color: inherit;
  font: 700 12px var(--font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.site-nav-link:hover,
.site-nav-link.is-current {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 6px;
  text-decoration-thickness: 2px;
}

.site-nav-link.is-solid {
  background: var(--ink);
  color: var(--ground);
}

.site-nav-link.is-solid:hover {
  background: var(--pine);
  color: var(--white);
  text-decoration: none;
}

.site-nav-link.is-blaze {
  margin-left: 4px;
  background: var(--blaze);
  color: var(--white);
}

.site-nav-link.is-blaze:hover {
  background: var(--blaze-deep);
  text-decoration: none;
}

.site-nav-link:focus-visible,
.site-brand:focus-visible,
.site-nav-menu:focus-visible {
  outline: 3px solid var(--lake);
  outline-offset: 2px;
}

.site-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-decoration: none;
}

.site-brand:hover {
  color: inherit;
}

.site-brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: var(--ink);
  color: var(--ground);
}

.site-brand-mark svg {
  width: 18px;
  height: 18px;
}

.site-nav-menu {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  justify-self: end;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.site-nav-menu svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.site-nav-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  display: grid;
  padding: 8px var(--gutter) 20px;
  background: var(--ground);
  color: var(--ink);
  border-bottom: 2px solid var(--ink);
  box-shadow: var(--shadow-panel);
}

.site-nav-panel-link {
  display: flex;
  align-items: center;
  min-height: 52px;
  border: 0;
  border-bottom: 1px solid var(--granite-200);
  background: none;
  color: var(--ink);
  font: 700 15px var(--font);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.site-nav-panel-cta {
  margin-top: 16px;
}

/* Over a dark banner: transparent with light text, until the menu opens */
.site-nav.is-overlay {
  position: absolute;
  inset: 0 0 auto 0;
  background: transparent;
  color: var(--paper);
}

.site-nav.is-overlay .site-nav-inner {
  border-bottom-color: rgb(242 239 234 / 0.55);
}

.site-nav.is-overlay .site-brand-mark {
  background: var(--paper);
  color: var(--ink);
}

.site-nav.is-overlay .site-nav-link.is-solid {
  background: var(--paper);
  color: var(--ink);
}

@media (max-width: 960px) {
  .site-nav-group {
    display: none;
  }

  .site-nav-inner {
    grid-template-columns: 1fr auto;
  }

  .site-nav-menu {
    display: inline-grid;
  }
}
</style>
