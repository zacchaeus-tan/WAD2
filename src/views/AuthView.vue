<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion, useReducedMotion } from 'motion-v'
import { useAuthStore } from '@/controller/authStore'
import { countries, genderLabels } from '@/lib/countries'
import valleyPhoto from '@/assets/img/cairn-valley.jpg'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

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

  if (!result.success) return

  if (result.needsConfirmation) {
    message.value = 'Account created. Check your email to confirm, then sign in.'
    mode.value = 'login'
  } else {
    // back to the page the router guard sent them away from, if any
    router.push(route.query.redirect || { name: 'profile' })
  }
}

const reduceMotion = useReducedMotion()

// Each word needs half its own height to sit centred on screen while it sticks
const leftPin = ref(null)
const rightPin = ref(null)
let pinObserver = null

onMounted(() => {
  pinObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      entry.target.style.setProperty('--pin-half', `${entry.target.offsetHeight / 2}px`)
    }
  })
  pinObserver.observe(leftPin.value)
  pinObserver.observe(rightPin.value)
})

onBeforeUnmount(() => pinObserver?.disconnect())
</script>

<template>
  <div class="cairn auth">
    <img class="auth-photo" :src="valleyPhoto" alt="" />

    <div class="cairn-wrap auth-inner">
      <h1 class="cairn-visually-hidden">{{ mode === 'login' ? 'Sign in' : 'Create your profile' }}</h1>

      <!-- The two giant words are the switch between signing in and registering.
           Each reads along its side with its baseline facing the form, and the chosen one
           gets a hand-drawn pine highlight that sweeps along the word. -->
      <div class="auth-word-slot is-left">
        <div ref="leftPin" class="auth-word-pin">
        <motion.button
          type="button"
          class="auth-word is-left"
          :class="{ 'is-current': mode === 'login' }"
          :aria-pressed="mode === 'login' ? 'true' : 'false'"
          :while-hover="reduceMotion ? undefined : { x: -14 }"
          :while-press="reduceMotion ? undefined : { scale: 0.94 }"
          :transition="{ type: 'spring', stiffness: 320, damping: 20 }"
          @click="setMode('login')"
        >
          <motion.span
            class="auth-word-mark"
            aria-hidden="true"
            :initial="false"
            :animate="{ scaleY: mode === 'login' ? 1 : 0 }"
            :transition="{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }"
          />
          <span class="auth-word-text">Sign In</span>
        </motion.button>
        </div>
      </div>

      <div class="auth-card">
        <form class="auth-form" @submit.prevent="submit">
          <template v-if="mode === 'register'">
            <div class="auth-field">
              <label class="cairn-label" for="name">Name</label>
              <div class="auth-input">
                <input id="name" v-model="name" class="cairn-input" maxlength="60" autocomplete="name" required />
              </div>
            </div>

            <div class="auth-row">
              <div class="auth-field">
                <label class="cairn-label" for="age">Age</label>
                <div class="auth-input">
                  <input id="age" v-model="age" type="number" class="cairn-input" min="13" max="120" step="1" required />
                </div>
              </div>

              <div class="auth-field">
                <label class="cairn-label" for="gender">Gender</label>
                <div class="auth-input">
                  <select id="gender" v-model="gender" class="cairn-input" required>
                    <option value="" disabled>Select…</option>
                    <option v-for="(label, value) in genderLabels" :key="value" :value="value">{{ label }}</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <div class="auth-field">
            <label class="cairn-label" for="email">Email</label>
            <div class="auth-input">
              <input id="email" v-model="email" type="email" class="cairn-input" autocomplete="email" required />
            </div>
          </div>

          <div class="auth-field">
            <label class="cairn-label" for="password">Password</label>
            <div class="auth-input">
              <input id="password" v-model="password" type="password" class="cairn-input" minlength="6"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
            </div>
            <p v-if="mode === 'register'" class="auth-hint">At least 6 characters.</p>
          </div>

          <template v-if="mode === 'register'">
            <div class="auth-field">
              <label class="cairn-label" for="country">Country</label>
              <div class="auth-input">
                <select id="country" v-model="country" class="cairn-input" autocomplete="country-name" required>
                  <option value="" disabled>Select…</option>
                  <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div class="auth-field">
              <label class="cairn-label" for="about">About <span class="auth-optional">(optional)</span></label>
              <div class="auth-input">
                <textarea id="about" v-model="about" class="cairn-input auth-textarea" rows="3" maxlength="500"></textarea>
              </div>
            </div>
          </template>

          <button class="cairn-btn auth-submit" :disabled="auth.loading" type="submit">
            {{ mode === 'login' ? 'Sign in' : 'Create profile' }}
          </button>
        </form>

        <p v-if="auth.error" class="auth-error" role="alert">{{ auth.error }}</p>
        <p v-if="message" class="auth-message" role="status">{{ message }}</p>
      </div>

      <div class="auth-word-slot is-right">
        <div ref="rightPin" class="auth-word-pin">
        <motion.button
          type="button"
          class="auth-word is-right"
          :class="{ 'is-current': mode === 'register' }"
          :aria-pressed="mode === 'register' ? 'true' : 'false'"
          :while-hover="reduceMotion ? undefined : { x: 14 }"
          :while-press="reduceMotion ? undefined : { scale: 0.94 }"
          :transition="{ type: 'spring', stiffness: 320, damping: 20 }"
          @click="setMode('register')"
        >
          <motion.span
            class="auth-word-mark"
            aria-hidden="true"
            :initial="false"
            :animate="{ scaleY: mode === 'register' ? 1 : 0 }"
            :transition="{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }"
          />
          <span class="auth-word-text">Register</span>
        </motion.button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full-screen dimmed cairn photo with the navbar on top of it */
.auth {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  /* clip, not hidden: hidden would stop the words sticking while the form scrolls */
  overflow: clip;
  background: var(--night);
  isolation: isolate;
}

.auth-photo {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 30%;
  opacity: 0.42;
  filter: saturate(0.7) brightness(0.8);
}

/* Form in the middle, a giant vertical word on each side */
.auth-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 460px) minmax(0, 1fr);
  grid-template-areas: 'left card right';
  align-items: center;
  gap: clamp(16px, 3vw, 48px);
  min-height: 100vh;
  min-height: 100svh;
  /* Room for the highlight when the words come to rest at the end of the form */
  padding-bottom: 24px;
}

.auth-word {
  padding: 0;
  border: 0;
  background: none;
  color: var(--paper);
  font: 900 clamp(72px, 15vh, 170px) / 0.85 var(--font);
  letter-spacing: -0.03em;
  white-space: nowrap;
  cursor: pointer;
}

/* Each word fills its side of the form and stays centred on screen while the form scrolls */
.auth-word-slot {
  align-self: stretch;
}

.auth-word-slot.is-left {
  grid-area: left;
}

.auth-word-slot.is-right {
  grid-area: right;
}

/* Each word sticks with its centre at the middle of the screen while the form scrolls
   past (--pin-half is half the word's height, measured in the script) */
.auth-word-slot {
  display: flex;
}

.auth-word-slot.is-left {
  justify-content: flex-end;
}

.auth-word-pin {
  position: sticky;
  top: calc(50vh - var(--pin-half, 0px));
  top: calc(50svh - var(--pin-half, 0px));
  align-self: flex-start;
}

.auth-word {
  position: relative;
}

/* Hand-drawn pine highlight behind the chosen word (after Magic UI's Highlighter).
   It sweeps along the word's reading direction: up for Sign In, down for Register. */
.auth-word-mark {
  position: absolute;
  inset: -10px -10px;
  z-index: 0;
  background: var(--pine);
  clip-path: polygon(8% 1%, 92% 0, 97% 4%, 100% 22%, 96% 48%, 100% 76%, 95% 97%, 88% 100%, 12% 99%, 4% 96%, 0 74%, 3% 50%, 0 24%, 4% 3%);
  pointer-events: none;
}

.auth-word.is-left .auth-word-mark {
  transform-origin: 50% 100%;
}

.auth-word.is-right .auth-word-mark {
  transform-origin: 50% 0;
}

/* Vertical text; the left word is turned the other way so both baselines face the form */
.auth-word-text {
  position: relative;
  z-index: 1;
  display: inline-block;
  writing-mode: vertical-rl;
  color: transparent;
  -webkit-text-stroke: 2px rgb(242 239 234 / 0.6);
  transition:
    color 0.35s var(--ease),
    -webkit-text-stroke-color 0.35s var(--ease),
    letter-spacing 0.45s var(--ease);
}

.auth-word.is-left .auth-word-text {
  transform: rotate(180deg);
}

/* Hover: the outline brightens and the letters open up a little */
.auth-word:hover .auth-word-text {
  -webkit-text-stroke-color: var(--paper);
  letter-spacing: 0.01em;
}

/* The chosen word is solid */
.auth-word.is-current .auth-word-text {
  color: var(--paper);
  -webkit-text-stroke-color: var(--paper);
}

.auth-word:focus-visible {
  outline: 3px solid var(--glacier);
  outline-offset: 8px;
}


/* The form floats over the photo */
.auth-card {
  grid-area: card;
  margin: calc(var(--nav-height) + 32px) 0 48px;
  display: grid;
  gap: 24px;
  padding: clamp(24px, 3vw, 36px);
  background: var(--ground);
  box-shadow: var(--shadow-panel);
}

.auth-form {
  display: grid;
  gap: 18px;
}


.auth-field {
  display: grid;
  gap: 8px;
}

.auth-field .cairn-label {
  color: var(--granite-700);
}

.auth-optional {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

.auth-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.auth-input {
  position: relative;
}


.auth-input .cairn-input {
  position: relative;
  min-height: 48px;
  font-size: 16px;
}

.auth-textarea {
  padding-top: 10px;
  padding-bottom: 10px;
  resize: vertical;
}

.auth-hint {
  color: var(--granite-700);
  font-size: 13px;
}

.auth-submit {
  width: 100%;
  margin-top: 6px;
}

.auth-error {
  padding: 10px 12px;
  background: #fdecea;
  color: #b42318;
  font-size: 14px;
}

.auth-message {
  padding: 10px 12px;
  background: var(--pine-mist);
  color: var(--pine-deep);
  font-size: 14px;
}

/* Narrow screens: the two words sit side by side above the form, reading normally */
@media (max-width: 900px) {
  .auth-inner {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'left right'
      'card card';
    align-content: start;
    gap: 20px 16px;
  }

  .auth-word {
    font-size: clamp(36px, 11vw, 72px);
  }

  .auth-word-slot.is-left,
  .auth-word-slot.is-right {
    justify-content: center;
  }

  .auth-inner {
    padding-top: calc(var(--nav-height) + 24px);
  }

  .auth-word-pin {
    position: static;
    height: auto;
    justify-content: center;
  }

  .auth-card {
    margin: 0 0 48px;
  }

  .auth-word-text,
  .auth-word.is-left .auth-word-text {
    writing-mode: horizontal-tb;
    transform: none;
  }
}

@media (max-width: 480px) {
  .auth-row {
    grid-template-columns: 1fr;
  }
}
</style>
