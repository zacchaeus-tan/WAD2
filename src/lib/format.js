const DIFFICULTY_LABELS = ['Easy', 'Moderate', 'Hard', 'Strenuous']

export function difficultyLabel(value) {
  if (value === null || value === undefined) return '—'
  const index = Math.min(Math.max(Math.round(Number(value)), 1), 4) - 1
  return DIFFICULTY_LABELS[index]
}

export function difficultyClass(value) {
  const rounded = Math.round(Number(value))
  if (rounded >= 4) return 'bg-danger'
  if (rounded === 3) return 'bg-warning text-dark'
  if (rounded === 2) return 'bg-info text-dark'
  return 'bg-success'
}

export function verdictLabel(verdict) {
  return {
    comfortable: 'Comfortable — well within your range',
    good_match: 'Good match',
    stretch: 'A stretch — train before you commit',
    not_ready: 'Not ready yet',
    unknown: 'Take the quiz to see your match',
  }[verdict] || verdict
}

export function verdictClass(verdict) {
  return {
    comfortable: 'alert-success',
    good_match: 'alert-success',
    stretch: 'alert-warning',
    not_ready: 'alert-danger',
    unknown: 'alert-secondary',
  }[verdict] || 'alert-secondary'
}

export function hazardClass(level) {
  return { elevated: 'bg-danger', moderate: 'bg-warning text-dark', low: 'bg-secondary' }[level] || 'bg-secondary'
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
