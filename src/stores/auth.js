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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        this.error = error.message
        this.loading = false
        return { success: false, error: error.message }
      }

      // create the matching profiles row
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, display_name: displayName, is_admin: false })

        if (profileError) {
          this.error = profileError.message
          this.loading = false
          return { success: false, error: profileError.message }
        }
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