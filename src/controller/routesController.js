import {
  listRoutes,
  listRouteTiles,
  listRouteSummaries,
  getRoute,
  getRouteGeometry,
  listRoutesByIds,
} from '@/model/routesModel'

export async function fetchRoutes() {
  const { data, error } = await listRoutes()
  if (error) {
    throw error
  }

  return data
}

export async function fetchRouteTiles() {
  const { data, error } = await listRouteTiles()
  if (error) {
    throw error
  }

  return data
}

export async function fetchRouteSummaries() {
  const { data, error } = await listRouteSummaries()
  if (error) {
    throw error
  }

  return data
}

// Returns the route's GeoJSON line, or null if it has none
export async function fetchRouteGeometry(id) {
  if (!id) {
    throw new Error('A route ID is required to load its line.')
  }

  const { data, error } = await getRouteGeometry(id)
  if (error) {
    throw error
  }

  return data?.geometry ?? null
}

export async function fetchRouteById(id) {
  if (!id) {
    throw new Error('A route ID is required to load a route.')
  }

  const { data, error } = await getRoute(id)
  if (error) {
    throw error
  }

  return data
}

// A route fetched ahead of its page opening, so the page can show it straight away with no
// loading message. If this fails the page fetches the route itself and shows any error.
let preloadedRoute = null

export async function preloadRoute(id) {
  try {
    preloadedRoute = await fetchRouteById(id)
  } catch {
    preloadedRoute = null
  }
}

// Used once: a later visit to the same page fetches a fresh copy
export function takePreloadedRoute(id) {
  const route = preloadedRoute?.id === id ? preloadedRoute : null
  preloadedRoute = null
  return route
}

export async function fetchRoutesByIds(ids) {
  if (!ids || ids.length === 0) {
    return []
  }

  const { data, error } = await listRoutesByIds(ids)
  if (error) {
    throw error
  }

  return data
}
