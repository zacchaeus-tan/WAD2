<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { supabase } from '@/lib/supabase'

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession()
  console.log('Supabase connection check:', data, error)
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
