import { supabase } from '@/lib/supabase'

export function listIncidentCategories() {
  return supabase.from('incident_categories').select('*').order('sort_order')
}

export function listReviewsForRoute(routeId) {
  return supabase
    .from('reviews')
    .select('*, profiles(display_name), review_incidents(*, route_points(name))')
    .eq('route_id', routeId)
    .order('created_at', { ascending: false })
}

// One review per user per route, so this upserts on that pair.
export function upsertReview({ routeId, userId, rating, perceivedDifficulty, completed, reviewText }) {
  return supabase
    .from('reviews')
    .upsert(
      {
        route_id: routeId,
        user_id: userId,
        rating,
        perceived_difficulty: perceivedDifficulty,
        completed,
        review_text: reviewText,
      },
      { onConflict: 'route_id,user_id' },
    )
    .select()
    .single()
}

export function deleteIncidentsForReview(reviewId) {
  return supabase.from('review_incidents').delete().eq('review_id', reviewId)
}

export function insertIncidents(reviewId, routeId, incidents) {
  return supabase.from('review_incidents').insert(
    incidents.map((i) => ({
      review_id: reviewId,
      route_id: routeId,
      point_id: i.pointId || null,
      category: i.category,
      note: i.note,
    })),
  )
}

export function deleteReview(reviewId) {
  return supabase.from('reviews').delete().eq('id', reviewId)
}

// Community stats on `routes` are written by the recalc-route-stats Edge
// Function, not from the browser (users have no write access to routes).
// Call this after any review or incident note changes.
export function recalcRouteStats(routeId) {
  return supabase.functions.invoke('recalc-route-stats', { body: { routeId } })
}
