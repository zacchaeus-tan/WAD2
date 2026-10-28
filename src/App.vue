<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '@/components/common/SiteNav.vue'
import SiteFooter from '@/components/common/SiteFooter.vue'

const currentRoute = useRoute()

// Route detail opens on a dark banner, so the navbar sits on top of it.
const navOverlay = computed(() => currentRoute.name === 'route-detail')

// The globe fills the screen below the navbar, so it has no footer.
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
