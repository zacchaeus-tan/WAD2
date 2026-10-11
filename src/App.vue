<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/common/AppNavbar.vue'

const auth = useAuthStore()

onMounted(() => {
  auth.initSession()
})
</script>

<template>
  <AppNavbar />
  <RouterView />
</template>
