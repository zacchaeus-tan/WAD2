<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { countries, genderLabels } from '@/lib/countries'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const age = ref('')
const gender = ref('')
const country = ref('')
const about = ref('')
const message = ref('')

function setMode(next) {
  mode.value = next
  auth.error = null
  message.value = ''
}

async function submit() {
  message.value = ''
  const result =
    mode.value === 'login'
      ? await auth.login(email.value, password.value)
      : await auth.register({
          email: email.value,
          password: password.value,
          name: name.value,
          age: age.value,
          gender: gender.value,
          country: country.value,
          about: about.value,
        })

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
    <h1 class="h3 mb-3">{{ mode === 'login' ? 'Sign in' : 'Create your profile' }}</h1>

    <div class="btn-group mb-3 w-100">
      <button class="btn" :class="mode === 'login' ? 'btn-primary' : 'btn-outline-primary'" @click="setMode('login')">
        Sign in
      </button>
      <button class="btn" :class="mode === 'register' ? 'btn-primary' : 'btn-outline-primary'" @click="setMode('register')">
        Register
      </button>
    </div>

    <form @submit.prevent="submit">
      <template v-if="mode === 'register'">
        <div class="mb-3">
          <label class="form-label" for="name">Name</label>
          <input id="name" v-model="name" class="form-control" maxlength="60" autocomplete="name" required />
        </div>

        <div class="row">
          <div class="col-sm-4 mb-3">
            <label class="form-label" for="age">Age</label>
            <input id="age" v-model="age" type="number" class="form-control" min="13" max="120" step="1" required />
          </div>

          <div class="col-sm-8 mb-3">
            <label class="form-label" for="gender">Gender</label>
            <select id="gender" v-model="gender" class="form-select" required>
              <option value="" disabled>Select…</option>
              <option v-for="(label, value) in genderLabels" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
        </div>
      </template>

      <div class="mb-3">
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="form-control" autocomplete="email" required />
      </div>

      <div class="mb-3">
        <label class="form-label" for="password">Password</label>
        <input id="password" v-model="password" type="password" class="form-control" minlength="6"
               :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
        <div v-if="mode === 'register'" class="form-text">At least 6 characters.</div>
      </div>

      <template v-if="mode === 'register'">
        <div class="mb-3">
          <label class="form-label" for="country">Country</label>
          <select id="country" v-model="country" class="form-select" autocomplete="country-name" required>
            <option value="" disabled>Select…</option>
            <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label" for="about">About <span class="text-muted">(optional)</span></label>
          <textarea id="about" v-model="about" class="form-control" rows="3" maxlength="500"></textarea>
        </div>
      </template>

      <button class="btn btn-success w-100" :disabled="auth.loading" type="submit">
        {{ mode === 'login' ? 'Sign in' : 'Create profile' }}
      </button>
    </form>

    <div v-if="auth.error" class="alert alert-danger mt-3">{{ auth.error }}</div>
    <div v-if="message" class="alert alert-info mt-3">{{ message }}</div>
  </div>
</template>
