import { supabase } from '@/lib/supabase'

// RLS only lets profiles with is_admin = true run these writes.

export function updateSafetyStatus(routeId, status, note) {
  return supabase
    .from('routes')
    .update({ safety_status: status, safety_status_note: note })
    .eq('id', routeId)
}

export function listReviewsForModeration() {
  return supabase
    .from('reviews')
    .select('*, profiles(display_name), routes(name), review_incidents(*)')
    .order('created_at', { ascending: false })
}

export function deleteIncident(incidentId) {
  return supabase.from('review_incidents').delete().eq('id', incidentId)
}
