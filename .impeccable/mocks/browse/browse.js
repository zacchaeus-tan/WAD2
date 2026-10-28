// Shared browse logic: filter state, matching, sorting, formatting and markup helpers.
// Each option page calls CB.init({ render }) and draws the results its own way.
;(function () {
  const ROUTES = window.CAIRN_BROWSE || []

  document.body.insertAdjacentHTML(
    'afterbegin',
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/></symbol>
  <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/></symbol>
  <symbol id="i-list" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></symbol>
  <symbol id="i-closed" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></symbol>
  <symbol id="i-peak" viewBox="0 0 24 24"><path d="M3 20 10 7l3.5 5.5L15.5 10 21 20z"/></symbol>
  <symbol id="d-strenuous" viewBox="0 0 16 10"><path d="M4 0 8 5 4 10 0 5zM12 0l4 5-4 5-4-5z" fill="currentColor"/></symbol>
</svg>`,
  )

  const GRADES = {
    1: { key: 'easy', label: 'Easy', color: '#1f5b43' },
    2: { key: 'moderate', label: 'Moderate', color: '#1e5f8c' },
    3: { key: 'hard', label: 'Hard', color: '#17201c' },
    4: { key: 'strenuous', label: 'Strenuous', color: '#5b2c83' },
  }
  const TRIPS = { day: 'Day hike', overnight: 'Overnight', multi: 'Multi-day' }

  // Slider positions 0–100 map onto skewed scales: most routes are short and low.
  const KM = { min: 3, max: 1000, toVal: (p) => 3 * Math.pow(1000 / 3, p / 100), toPos: (v) => (100 * Math.log(v / 3)) / Math.log(1000 / 3) }
  const CLIMB = { min: 0, max: 7000, toVal: (p) => 7000 * Math.pow(p / 100, 2), toPos: (v) => 100 * Math.sqrt(v / 7000) }

  const state = { q: '', country: '', grades: new Set(), trips: new Set(), km: [0, 100], climb: [0, 100], sort: 'name' }

  const gradeOf = (r) => Math.min(4, Math.max(1, Math.round(r.eff ?? r.grade ?? 2)))
  const tripOf = (r) => (r.days == null ? null : r.days <= 1 ? 'day' : r.days === 2 ? 'overnight' : 'multi')
  const countries = [...new Set(ROUTES.map((r) => r.country))].sort((a, b) => a.localeCompare(b))

  function kmBounds() { return [state.km[0] === 0 ? 0 : KM.toVal(state.km[0]), state.km[1] === 100 ? Infinity : KM.toVal(state.km[1])] }
  function climbBounds() { return [state.climb[0] === 0 ? 0 : CLIMB.toVal(state.climb[0]), state.climb[1] === 100 ? Infinity : CLIMB.toVal(state.climb[1])] }

  function matches(r, skip) {
    const q = state.q.trim().toLowerCase()
    if (q && !r.name.toLowerCase().includes(q)) return false
    if (state.country && r.country !== state.country) return false
    if (skip !== 'grade' && state.grades.size && !state.grades.has(gradeOf(r))) return false
    if (skip !== 'trip' && state.trips.size && !state.trips.has(tripOf(r))) return false
    const [k0, k1] = kmBounds()
    if (r.km != null && (r.km < k0 || r.km > k1)) return false
    if (state.climb[0] !== 0 || state.climb[1] !== 100) {
      if (r.climb == null) return false
      const [c0, c1] = climbBounds()
      if (r.climb < c0 || r.climb > c1) return false
    }
    return true
  }

  const SORTS = {
    name: (a, b) => a.name.localeCompare(b.name),
    'km-asc': (a, b) => a.km - b.km,
    'km-desc': (a, b) => b.km - a.km,
    'climb-asc': (a, b) => (a.climb ?? Infinity) - (b.climb ?? Infinity),
    'climb-desc': (a, b) => (b.climb ?? -1) - (a.climb ?? -1),
  }

  function results() { return ROUTES.filter((r) => matches(r)).sort(SORTS[state.sort]) }

  function isFiltered() {
    return !!(state.q || state.country || state.grades.size || state.trips.size || state.km[0] || state.km[1] !== 100 || state.climb[0] || state.climb[1] !== 100)
  }

  // Formatting
  const fmt = {
    km: (v) => (v == null ? '—' : `${v.toLocaleString('en', { maximumFractionDigits: v < 100 ? 1 : 0 })} km`),
    climb: (v) => (v == null ? '—' : `+${Math.round(v).toLocaleString('en')} m`),
    alt: (v) => (v == null ? '—' : `${Math.round(v).toLocaleString('en')} m`),
    days: (v) => (v == null ? '—' : `${v} ${v === 1 ? 'day' : 'days'}`),
    kmShort: (v) => (v >= 1000 ? 'Any' : v >= 100 ? Math.round(v / 10) * 10 : v >= 20 ? Math.round(v) : Math.round(v * 2) / 2),
    climbShort: (v) => (v >= 7000 ? 'Any' : v >= 1000 ? (Math.round(v / 100) * 100).toLocaleString('en') : Math.round(v / 50) * 50),
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const nl = (label) => `<span class="nl" aria-label="Not listed">—</span>`

  function tag(r) {
    const g = GRADES[gradeOf(r)]
    const adjusted = r.eff != null && r.grade != null && Math.abs(r.eff - r.grade) >= 0.25
    const shape = g.key === 'strenuous' ? `<svg viewBox="0 0 16 10" style="width:16px"><use href="#d-strenuous"/></svg>` : `<svg><use href="#d-${g.key}"/></svg>`
    const adj = adjusted ? `<span class="adj" title="Community-adjusted from official ${GRADES[r.grade].label}"><svg viewBox="0 0 24 24"><use href="#i-people"/></svg>${r.eff.toFixed(2)}</span>` : ''
    return `<span class="tag tag-${g.key}">${shape}${g.label}${adj}</span>`
  }
  function facts(r, opts = {}) {
    const i = (id) => `<svg class="ico"><use href="#${id}"/></svg>`
    return `<span>${i('i-distance')}${r.km == null ? nl() : fmt.km(r.km)}</span><span>${i('i-climb')}${r.climb == null ? nl() : fmt.climb(r.climb)}</span><span>${i('i-days')}${fmt.days(r.days)}</span>${opts.alt && r.alt ? `<span>${i('i-peak')}${fmt.alt(r.alt)}</span>` : ''}`
  }
  function stamp(r) {
    return r.status === 'closed' ? `<span class="stamp"><svg class="ico"><use href="#i-closed"/></svg>Closed${r.note ? ' · ' + esc(r.note) : ''}</span>` : ''
  }
  function rating(r) {
    return r.rating != null && r.reviews ? `<span class="rating"><svg><use href="#i-star"/></svg>${r.rating.toFixed(1)}<span class="n">(${r.reviews})</span></span>` : ''
  }
  // The route's own line, in its grade colour over a white under-stroke
  function trail(r, w = 3.5) {
    const c = r.status === 'closed' ? '#5f6b65' : GRADES[gradeOf(r)].color
    return `<svg class="line" viewBox="0 0 400 240" aria-hidden="true"><path d="${r.svg}" fill="none" stroke="#fff" stroke-width="${w * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${r.svg}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
  function contours(seed) {
    let s = seed
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
    let d = ''
    for (let k = 0; k < 4; k++) {
      const y = 50 + k * 46 + rnd() * 14
      d += `M-10 ${y.toFixed(1)} C 100 ${(y - 30 + rnd() * 60).toFixed(1)}, 260 ${(y - 30 + rnd() * 60).toFixed(1)}, 410 ${(y - 10 + rnd() * 20).toFixed(1)}`
    }
    return `<svg class="contours" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/></svg>`
  }

  // Controls: any element with data-f binds to state; every change re-renders live.
  let render = () => {}
  const listeners = []
  function update() { render(results()); refreshControls(); listeners.forEach((fn) => fn()) }

  function counts(kind) {
    const c = {}
    ROUTES.forEach((r) => { if (matches(r, kind)) { const k = kind === 'grade' ? gradeOf(r) : tripOf(r); c[k] = (c[k] || 0) + 1 } })
    return c
  }

  function refreshControls() {
    const gc = counts('grade'), tc = counts('trip')
    document.querySelectorAll('[data-count-grade]').forEach((el) => (el.textContent = gc[el.dataset.countGrade] || 0))
    document.querySelectorAll('[data-count-trip]').forEach((el) => (el.textContent = tc[el.dataset.countTrip] || 0))
    document.querySelectorAll('[data-f=grade]').forEach((el) => (el.checked = state.grades.has(+el.value)))
    document.querySelectorAll('[data-f=trip]').forEach((el) => (el.checked = state.trips.has(el.value)))
    document.querySelectorAll('[data-f=q]').forEach((el) => { if (el.value !== state.q) el.value = state.q })
    document.querySelectorAll('[data-f=country]').forEach((el) => (el.value = state.country))
    document.querySelectorAll('[data-f=sort]').forEach((el) => (el.value = state.sort))
    document.querySelectorAll('.dual').forEach(syncDual)
    document.querySelectorAll('[data-clear]').forEach((el) => (el.hidden = !isFiltered()))
    const n = results().length
    document.querySelectorAll('[data-total]').forEach((el) => (el.textContent = n.toLocaleString('en')))
  }

  function syncDual(el) {
    const key = el.dataset.range, [a, b] = el.querySelectorAll('input'), v = state[key]
    a.value = v[0]; b.value = v[1]
    el.querySelector('.fill').style.cssText = `left:${v[0]}%;right:${100 - v[1]}%`
    const S = key === 'km' ? KM : CLIMB, short = key === 'km' ? fmt.kmShort : fmt.climbShort, unit = key === 'km' ? ' km' : ' m'
    const lo = v[0] === 0 ? (key === 'km' ? '0' : '0') : short(S.toVal(v[0]))
    const hi = v[1] === 100 ? 'Any' : short(S.toVal(v[1]))
    const out = document.querySelector(`[data-range-val=${key}]`)
    if (out) out.textContent = v[0] === 0 && v[1] === 100 ? 'Any' : hi === 'Any' ? `${key === 'climb' ? '+' : ''}${lo}${unit} or more` : `${key === 'climb' ? '+' : ''}${lo}–${hi}${unit}`
    a.setAttribute('aria-valuetext', v[0] === 0 ? 'No minimum' : `${lo}${unit}`)
    b.setAttribute('aria-valuetext', v[1] === 100 ? 'No maximum' : `${hi}${unit}`)
  }

  function dualHTML(key, label) {
    return `<div class="range"><div class="range-head"><span class="t-label group-label" id="lbl-${key}">${label}</span><span class="range-val" data-range-val="${key}">Any</span></div>
      <div class="dual" data-range="${key}"><span class="track"><span class="fill"></span></span>
      <input type="range" min="0" max="100" step="1" value="0" aria-label="Minimum ${label.toLowerCase()}">
      <input type="range" min="0" max="100" step="1" value="100" aria-label="Maximum ${label.toLowerCase()}"></div></div>`
  }
  function gradeChipsHTML() {
    return Object.entries(GRADES).map(([n, g]) => `<label class="chip"><input type="checkbox" data-f="grade" value="${n}"><span><svg ${g.key === 'strenuous' ? 'viewBox="0 0 16 10" style="width:16px"' : ''}><use href="#d-${g.key}"/></svg>${g.label}<span class="count" data-count-grade="${n}"></span></span></label>`).join('')
  }
  function tripChipsHTML() {
    return Object.entries(TRIPS).map(([k, l]) => `<label class="chip"><input type="checkbox" data-f="trip" value="${k}"><span>${l}<span class="count" data-count-trip="${k}"></span></span></label>`).join('')
  }
  function countryOptionsHTML() { return `<option value="">All countries</option>` + countries.map((c) => `<option>${esc(c)}</option>`).join('') }
  function sortOptionsHTML() {
    return `<option value="name">Name, A to Z</option><option value="km-asc">Shortest first</option><option value="km-desc">Longest first</option><option value="climb-asc">Least climb first</option><option value="climb-desc">Most climb first</option>`
  }

  function bind() {
    document.querySelectorAll('[data-slot=grades]').forEach((el) => (el.innerHTML = gradeChipsHTML()))
    document.querySelectorAll('[data-slot=trips]').forEach((el) => (el.innerHTML = tripChipsHTML()))
    document.querySelectorAll('[data-slot=km]').forEach((el) => (el.innerHTML = dualHTML('km', 'Distance')))
    document.querySelectorAll('[data-slot=climb]').forEach((el) => (el.innerHTML = dualHTML('climb', 'Elevation gain')))
    document.querySelectorAll('[data-f=country]').forEach((el) => (el.innerHTML = countryOptionsHTML()))
    document.querySelectorAll('[data-f=sort]').forEach((el) => (el.innerHTML = sortOptionsHTML()))

    document.addEventListener('input', (e) => {
      const t = e.target
      if (t.dataset.f === 'q') { state.q = t.value; update() }
      const dual = t.closest('.dual')
      if (dual) {
        const [a, b] = dual.querySelectorAll('input'), key = dual.dataset.range
        let lo = +a.value, hi = +b.value
        if (lo > hi - 2) { if (t === a) lo = hi - 2; else hi = lo + 2 }
        state[key] = [Math.max(0, lo), Math.min(100, hi)]
        update()
      }
    })
    document.addEventListener('change', (e) => {
      const t = e.target, f = t.dataset.f
      if (f === 'country') state.country = t.value
      else if (f === 'sort') state.sort = t.value
      else if (f === 'grade') t.checked ? state.grades.add(+t.value) : state.grades.delete(+t.value)
      else if (f === 'trip') t.checked ? state.trips.add(t.value) : state.trips.delete(t.value)
      else return
      update()
    })
    document.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) clear() })
  }

  function clear() { Object.assign(state, { q: '', country: '', km: [0, 100], climb: [0, 100] }); state.grades.clear(); state.trips.clear(); update() }

  function emptyHTML() {
    return `<div class="empty" role="status"><h2>No routes match these filters</h2><p>Try a wider distance or climb range, or include more difficulty grades. Your search is kept until you clear it.</p><button class="btn btn-secondary" type="button" data-clear>Clear all filters</button></div>`
  }

  window.CB = {
    ROUTES, GRADES, TRIPS, KM, CLIMB, state, gradeOf, tripOf, matches, results, isFiltered, fmt, esc, tag, facts, stamp, rating, trail, contours, emptyHTML, clear, update,
    onUpdate: (fn) => listeners.push(fn),
    init(opts) { render = opts.render; bind(); update() },
  }
})()
