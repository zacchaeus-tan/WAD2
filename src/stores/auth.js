import { defineStore } from 'pinia'
import * as authService from '@/services/auth.service'
import { calcFitnessScore } from '@/services/matching.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,       // Supabase auth user object (id, email, etc.)
    profile: null,     // row from `profiles` table (display_name, is_admin)
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => !!state.profile?.is_admin,
  },

  actions: {
    async register(email, password, displayName) {
      this.loading = true
      this.error = null

      const { data, error } = await authService.signUp(email, password, displayName)

      if (error) {
        this.error = error.message
        this.loading = false
        return { success: false, error: error.message }
      }

      this.user = data.user
      await this.fetchProfile()
      this.loading = false
      return { success: true }
    },

    async login(email, password) {
      this.loading = true
      this.error = null

      const { data, error } = await authService.signIn(email, password)

      if (error) {
        this.error = error.message
        this.loading = false
        return { success: false, error: error.message }
      }

      this.user = data.user
      await this.fetchProfile()
      this.loading = false
      return { success: true }
    },

    async logout() {
      await authService.signOut()
      this.user = null
      this.profile = null
    },

    async saveQuiz(answers) {
      if (!this.user) return { success: false, error: 'Not signed in' }

      const { error } = await authService.updateQuizAnswers(
        this.user.id,
        answers,
        calcFitnessScore(answers),
        this.profile?.quiz_completed_at ?? new Date().toISOString(),
      )

      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }

      await this.fetchProfile()
      return { success: true }
    },

    async fetchProfile() {
      if (!this.user) return

      const { data, error } = await authService.getProfile(this.user.id)
      if (error) return

      if (data) {
        this.profile = data
        return
      }

      // First sign-in: no profile row yet, so create it.
      const { data: created, error: createError } = await authService.createProfile(this.user)
      if (!createError) this.profile = created
    },

    // call this once on app load to restore session (e.g. in App.vue's onMounted)
    async initSession() {
      this.loading = true
      const { data } = await authService.getSession()

      if (data.session?.user) {
        this.user = data.session.user
        await this.fetchProfile()
      }

      this.loading = false

      // keep store in sync if the session changes (login/logout in another tab, token refresh, etc.)
      authService.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
        if (this.user) {
          this.fetchProfile()
        } else {
          this.profile = null
        }
      })
    },
  },
})
