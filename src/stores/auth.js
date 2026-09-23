import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

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

      // The profiles row is created by the on_auth_user_created trigger, which
      // reads display_name out of this metadata.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      })

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

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },

    // fitness_score is computed by a trigger, so we save the answers and read back.
    async saveQuiz(answers) {
      if (!this.user) return { success: false, error: 'Not signed in' }

      const { error } = await supabase
        .from('profiles')
        .update({
          experience_level: answers.experienceLevel,
          longest_distance_km: answers.longestDistanceKm,
          max_elevation_gain_m: answers.maxElevationGainM,
          highest_altitude_m: answers.highestAltitudeM,
          goals_text: answers.goalsText,
        })
        .eq('id', this.user.id)

      if (error) {
        this.error = error.message
        return { success: false, error: error.message }
      }

      await this.fetchProfile()
      return { success: true }
    },

    async fetchProfile() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (!error) this.profile = data
    },

    // call this once on app load to restore session (e.g. in App.vue's onMounted)
    async initSession() {
      this.loading = true
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        this.user = data.session.user
        await this.fetchProfile()
      }

      this.loading = false

      // keep store in sync if the session changes (login/logout in another tab, token refresh, etc.)
      supabase.auth.onAuthStateChange((_event, session) => {
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