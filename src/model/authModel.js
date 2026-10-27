import { supabase } from '@/lib/supabase'

// Model: talks to Supabase Auth and the profiles table only. Each function
// returns Supabase's { data, error } unchanged; the controller decides what
// to do with errors.

// metadata is read by the on_auth_user_created trigger to fill in the profiles row
export function signUp(email, password, metadata) {
  return supabase.auth.signUp({ email, password, options: { data: metadata } })
}

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export function updateQuizAnswers(userId, answers) {
  return supabase
    .from('profiles')
    .update({
      experience_level: answers.experienceLevel,
      longest_distance_km: answers.longestDistanceKm,
      max_elevation_gain_m: answers.maxElevationGainM,
      highest_altitude_m: answers.highestAltitudeM,
      longest_trek_days: answers.longestTrekDays,
      quiz_completed_at: new Date().toISOString(),
    })
    .eq('id', userId)
}
