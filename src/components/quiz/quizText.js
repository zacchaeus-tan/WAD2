// Display helpers for the quiz designs. The questions themselves live in lib/quizQuestions.js.

// Short names for each question, for progress labels and summaries
export const SHORT_LABELS = {
  experienceLevel: 'Experience',
  longestDistanceKm: 'Distance',
  maxElevationGainM: 'Elevation',
  highestAltitudeM: 'Altitude',
  longestTrekDays: 'Trip length',
}

// "Occasional — a few day hikes a year" → { title: 'Occasional', detail: 'a few day hikes a year' }
export function splitOption(desc) {
  const [title, ...rest] = desc.split(' — ')
  return { title, detail: rest.join(' — ') }
}

// The text of the option picked for a question, or null
export function answerText(question, answers) {
  const option = question.options.find((o) => String(o.val) === String(answers[question.key]))
  return option ? option.desc : null
}
