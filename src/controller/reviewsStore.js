import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as reviewsModel from '@/model/reviewsModel'

// Reviews load this many at a time; "Show more" loads the next page.
export const REVIEWS_PAGE_SIZE = 5

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([]) // the pages loaded so far, newest first
  const totalReviews = ref(0) // all of the route's reviews, loaded or not
  const ownReview = ref(null) // the signed-in user's review on this route, loaded separately
  const categories = ref([])
  const error = ref(null) // saving, deleting or checking the form: shown by ReviewForm
  const loadError = ref(null) // loading the route's reviews: shown by the page
  const loading = ref(false)
  const loadingMore = ref(false)

  const hasMore = computed(() => reviews.value.length < totalReviews.value)

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

  // Loads the first page again, e.g. when the page opens or after a review changes.
  async function fetchForRoute(routeId) {
    loading.value = true
    loadError.value = null
    const { data, count, error: err } = await reviewsModel.listReviewsForRoute(
      routeId,
      0,
      REVIEWS_PAGE_SIZE - 1,
    )
    loading.value = false
    if (err) {
      loadError.value = err.message
      reviews.value = []
      totalReviews.value = 0
      return false
    }
    reviews.value = data
    totalReviews.value = count ?? data.length
    return true
  }

  // Adds the next page to the end of the list.
  async function loadMore(routeId) {
    if (!hasMore.value || loadingMore.value) {
      return false
    }
    loadingMore.value = true
    const from = reviews.value.length
    const { data, count, error: err } = await reviewsModel.listReviewsForRoute(
      routeId,
      from,
      from + REVIEWS_PAGE_SIZE - 1,
    )
    loadingMore.value = false
    if (err) {
      loadError.value = err.message
      return false
    }
    reviews.value = [...reviews.value, ...data]
    totalReviews.value = count ?? totalReviews.value
    return true
  }

  // Loads the signed-in user's review on this route (or clears it when signed out).
  async function fetchMyReview(routeId, userId) {
    if (!userId) {
      ownReview.value = null
      return true
    }
    const { data, error: err } = await reviewsModel.getMyReview(routeId, userId)
    if (err) {
      console.warn('Could not load your review for this route:', err.message)
      ownReview.value = null
      return false
    }
    ownReview.value = data
    return true
  }

  // The signed-in user's own review on this route, or null.
  function myReview(userId) {
    return ownReview.value && ownReview.value.user_id === userId ? ownReview.value : null
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
    await Promise.all([fetchForRoute(routeId), fetchMyReview(routeId, userId)])
    return true
  }

  async function remove(reviewId, routeId) {
    clearError()
    const { error: err } = await reviewsModel.deleteReview(reviewId)
    if (err) {
      error.value = err.message
      return false
    }
    ownReview.value = null
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
    totalReviews,
    ownReview,
    hasMore,
    categories,
    error,
    loadError,
    loading,
    loadingMore,
    clearError,
    fetchCategories,
    fetchForRoute,
    loadMore,
    fetchMyReview,
    myReview,
    save,
    remove,
  }
})
