import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as reviewsModel from '@/model/reviewsModel'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([])
  const categories = ref([])
  const error = ref(null) // saving, deleting or checking the form: shown by ReviewForm
  const loadError = ref(null) // loading the route's reviews: shown by the page
  const loading = ref(false)

  function clearError() {
    error.value = null
  }

  function validate({ rating, perceivedDifficulty, completed, incidents }) {
    if (rating == null) {
      error.value = 'Select a rating.'
      return false
    }
    if (perceivedDifficulty == null) {
      error.value = 'Select how hard the route felt.'
      return false
    }
    if (completed == null) {
      error.value = 'Select whether you finished the route.'
      return false
    }
    for (const [index, incident] of incidents.entries()) {
      if (!incident.category) {
        error.value = `Select a category for incident ${index + 1}.`
        return false
      }
      if (incident.note == null || incident.note.trim() === '') {
        error.value = `Describe what happened in incident ${index + 1}, or remove it.`
        return false
      }
    }
    return true
  }

  async function fetchCategories() {
    if (categories.value.length) {
      return true
    }

    clearError()
    const { data, error: err } = await reviewsModel.listIncidentCategories()
    if (err) {
      error.value = err.message
      return false
    }
    categories.value = data
    return true
  }

  async function fetchForRoute(routeId) {
    loading.value = true
    loadError.value = null
    const { data, error: err } = await reviewsModel.listReviewsForRoute(routeId)
    loading.value = false
    if (err) {
      loadError.value = err.message
      reviews.value = []
      return false
    }
    reviews.value = data
    return true
  }

  // The signed-in user's own review on this route, or null.
  function myReview(userId) {
    return reviews.value.find((r) => r.user_id === userId) || null
  }

  async function save({
    routeId,
    userId,
    rating,
    perceivedDifficulty,
    completed,
    reviewText,
    incidents,
  }) {
    clearError()
    if (!validate({ rating, perceivedDifficulty, completed, incidents })) {
      return false
    }

    const { data: review, error: err } = await reviewsModel.upsertReview({
      routeId,
      userId,
      rating,
      perceivedDifficulty,
      completed,
      reviewText,
    })
    if (err) {
      error.value = err.message
      return false
    }

    await reviewsModel.deleteIncidentsForReview(review.id)

    if (incidents.length) {
      const { error: incidentErr } = await reviewsModel.insertIncidents(
        review.id,
        routeId,
        incidents,
      )
      if (incidentErr) {
        error.value = incidentErr.message
        await recalcStats(routeId)
        return false
      }
    }

    await recalcStats(routeId)
    await fetchForRoute(routeId)
    return true
  }

  async function remove(reviewId, routeId) {
    clearError()
    const { error: err } = await reviewsModel.deleteReview(reviewId)
    if (err) {
      error.value = err.message
      return false
    }
    await recalcStats(routeId)
    await fetchForRoute(routeId)
    return true
  }

  // The review itself is already saved, so a failure here only leaves the
  // route's averages stale until the next review; it does not fail the save.
  async function recalcStats(routeId) {
    const { error: err } = await reviewsModel.recalcRouteStats(routeId)
    if (err) {
      console.warn(`Could not refresh stats for route ${routeId}:`, err.message)
    }
  }

  return {
    reviews,
    categories,
    error,
    loadError,
    loading,
    clearError,
    fetchCategories,
    fetchForRoute,
    myReview,
    save,
    remove,
  }
})
