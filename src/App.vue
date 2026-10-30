<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '@/components/common/SiteNav.vue'
import SiteFooter from '@/components/common/SiteFooter.vue'

const currentRoute = useRoute()

// Browse, route detail, sign-in, the quiz and the globe open on something dark (a photo or
// the night sky), so the navbar sits on top of it.
const navOverlay = computed(() =>
  ['routes-list', 'route-detail', 'auth', 'quiz', 'routes-globe'].includes(currentRoute.name),
)

// The globe fills the whole screen, so it has no footer.
const showFooter = computed(() => currentRoute.name !== 'routes-globe')
</script>

<template>
  <div class="app-shell">
    <SiteNav :overlay="navOverlay" />

    <main>
      <RouterView />
    </main>

    <SiteFooter v-if="showFooter" />
  </div>
</template>

<style>
.app-shell {
  position: relative;
}
</style>
