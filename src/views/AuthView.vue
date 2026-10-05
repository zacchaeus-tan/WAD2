<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const message = ref('')

async function submit() {
  message.value = ''
  const result =
    mode.value === 'login'
      ? await auth.login(email.value, password.value)
      : await auth.register(email.value, password.value, displayName.value)

  if (result.success) {
    if (auth.isLoggedIn) {
      router.push({ name: 'quiz' })
    } else {
      message.value = 'Account created. Check your email to confirm, then sign in.'
      mode.value = 'login'
    }
  }
}
</script>

<template>
  <div class="container" style="max-width: 460px">
    <h1 class="h3 mb-3">{{ mode === 'login' ? 'Sign in' : 'Create an account' }}</h1>

    <div class="btn-group mb-3 w-100">
      <button class="btn" :class="mode === 'login' ? 'btn-primary' : 'btn-outline-primary'" @click="mode = 'login'">
        Sign in
      </button>
      <button class="btn" :class="mode === 'register' ? 'btn-primary' : 'btn-outline-primary'" @click="mode = 'register'">
        Register
      </button>
    </div>

    <form @submit.prevent="submit">
      <div v-if="mode === 'register'" class="mb-3">
        <label class="form-label" for="display-name">Display name</label>
        <input id="display-name" v-model="displayName" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label" for="password">Password</label>
        <input id="password" v-model="password" type="password" class="form-control" minlength="6" required />
      </div>

      <button class="btn btn-success w-100" :disabled="auth.loading" type="submit">
        {{ mode === 'login' ? 'Sign in' : 'Register' }}
      </button>
    </form>

    <div v-if="auth.error" class="alert alert-danger mt-3">{{ auth.error }}</div>
    <div v-if="message" class="alert alert-info mt-3">{{ message }}</div>
  </div>
</template>
