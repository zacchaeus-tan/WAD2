// Each question feeds one check in src/lib/matching.js.
// Ranges save their lower end because the matching already allows 25% on top;
// the first option saves a small value so beginners don't fail every route.
export const quizQuestions = [
  {
    key: 'experienceLevel',
    column: 'experience_level',
    label: 'How experienced are you at hiking?',
    options: [
      { val: 'beginner', desc: 'New to hiking — short walks or my first real hike' },
      { val: 'occasional', desc: 'Occasional — a few day hikes a year' },
      { val: 'regular', desc: 'Regular — I hike most months, including full-day mountains' },
      { val: 'experienced', desc: 'Experienced — multi-day treks or big summits' },
    ],
  },
  {
    key: 'longestDistanceKm',
    column: 'longest_distance_km',
    label: "What's the longest distance you've hiked in a single day?",
    options: [
      { val: 3, desc: 'Under 5 km' },
      { val: 5, desc: '5–10 km' },
      { val: 10, desc: '10–20 km' },
      { val: 20, desc: '20–30 km' },
      { val: 30, desc: '30 km or more' },
    ],
  },
  {
    key: 'maxElevationGainM',
    column: 'max_elevation_gain_m',
    label: "What's the most elevation you've climbed in a single day?",
    hint: 'Walking up to the Bukit Timah summit is about 160 m of climbing.',
    options: [
      { val: 150, desc: 'Under 300 m' },
      { val: 300, desc: '300–800 m' },
      { val: 800, desc: '800–1,500 m' },
      { val: 1500, desc: '1,500–2,000 m' },
      { val: 2000, desc: '2,000 m or more' },
    ],
  },
  {
    key: 'highestAltitudeM',
    column: 'highest_altitude_m',
    label: "What's the highest altitude you've hiked to?",
    options: [
      { val: 500, desc: 'Under 1,000 m' },
      { val: 1000, desc: '1,000–2,000 m' },
      { val: 2000, desc: '2,000–3,000 m' },
      { val: 3000, desc: '3,000–3,500 m' },
      { val: 3500, desc: '3,500 m or more (e.g. Kinabalu, Rinjani)' },
    ],
  },
  {
    key: 'longestTrekDays',
    column: 'longest_trek_days',
    label: "What's the longest duration you have trekked?",
    options: [
      { val: 1, desc: 'Day hikes only' },
      { val: 2, desc: 'Overnight (2 days)' },
      { val: 3, desc: '3 days or more' },
    ],
  },
]

// The option the user picked for a question, or null if it isn't answered.
export function quizAnswer(profile, question) {
  if (!profile) return null
  const value = profile[question.column]
  return question.options.find((option) => String(option.val) === String(value)) || null
}
