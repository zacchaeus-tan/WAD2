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

// Open-Meteo weather codes from API Doc
const WEATHER_LABELS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Light freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Light snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

export function weatherLabel(code) {
  if (code === null || code === undefined) return '—'
  return WEATHER_LABELS[code] || `Code ${code}`
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
