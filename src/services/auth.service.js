import { supabase } from '@/lib/supabase'

// display_name is kept in the auth metadata so createProfile() can use it on
// first sign-in (with email confirmation on, there is no session until then).
export function signUp(email, password, displayName) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
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

// data is null (not an error) when the user has no profile row yet.
export function getProfile(userId) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
}

export function createProfile(user) {
  return supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email.split('@')[0],
    })
    .select()
    .single()
}

export function updateQuizAnswers(userId, answers, fitnessScore, quizCompletedAt) {
  return supabase
    .from('profiles')
    .update({
      experience_level: answers.experienceLevel,
      longest_distance_km: answers.longestDistanceKm,
      max_elevation_gain_m: answers.maxElevationGainM,
      highest_altitude_m: answers.highestAltitudeM,
      goals_text: answers.goalsText,
      fitness_score: fitnessScore,
      quiz_completed_at: quizCompletedAt,
    })
    .eq('id', userId)
}
