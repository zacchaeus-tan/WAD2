// How each difficulty grade looks: a heat colour for lines on dark grounds, a darker
// version of it for text on light grounds, and a shape so colour is never the only cue.

export const GRADES = {
  1: { key: 'easy', label: 'Easy', line: '#6fdc8c', ink: '#1d7a43' },
  2: { key: 'moderate', label: 'Moderate', line: '#f2d34f', ink: '#7a5e00' },
  3: { key: 'hard', label: 'Hard', line: '#ff9f43', ink: '#a34d00' },
  4: { key: 'strenuous', label: 'Strenuous', line: '#ff5b4f', ink: '#b42318' },
}

// The grade a route is shown at: community-adjusted when there is one, else official.
// Returns null when the route has no grade at all.
export function gradeOf(route) {
  const value = route.effective_difficulty ?? route.official_difficulty ?? route.technical_rating
  if (value == null || value === '' || !Number.isFinite(Number(value))) {
    return null
  }
  return Math.min(Math.max(Math.round(Number(value)), 1), 4)
}

// True when the community grade differs from the official one, so it is worth showing.
export function isCommunityAdjusted(route) {
  return (
    route.effective_difficulty != null &&
    route.official_difficulty != null &&
    Number(route.effective_difficulty) !== Number(route.official_difficulty)
  )
}
