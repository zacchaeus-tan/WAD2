// Field index refinements: tiles, active filter pills and the country key.
// Each page sets <body data-tiles="tint|dark|stack"> to pick a tile treatment.
;(function () {
  const FIELD = {
    Indonesia: '#e6d9c7', Malaysia: '#d3e3d6', Philippines: '#d6e4ec', Australia: '#ead2c3',
    'New Zealand': '#d9e0e6', Thailand: '#e8e0c4', Vietnam: '#dcd6e6', Singapore: '#e4e4dc',
  }
  const PHOTOS = ['card-lake-peaks', 'card-alpine-path', 'card-ridge-hikers', 'card-misty-lake']
  // A page may set window.D_LINE / window.D_LABEL to recolour lines and grade labels by difficulty
  const LIGHT = window.D_LINE || { 1: '#8fdcb2', 2: '#9fcdf2', 3: '#f2efea', 4: '#d9b3f7' }
  const LABEL = window.D_LABEL || {}
  const mode = document.body.dataset.tiles || 'tint'
  document.body.classList.add('t-' + mode)
  const PAGE = 24
  let shown = PAGE, current = []
  const tilesEl = document.getElementById('tiles'), moreEl = document.getElementById('more')

  const legend = document.getElementById('legend')
  if (legend) legend.innerHTML = Object.entries(FIELD).map(([c, col]) => `<span><i style="background:${col}"></i>${c}</span>`).join('')

  function grade(r) {
    const g = CB.GRADES[CB.gradeOf(r)]
    const shape = g.key === 'strenuous' ? `<svg viewBox="0 0 16 10" style="width:16px"><use href="#d-strenuous"/></svg>` : `<svg><use href="#d-${g.key}"/></svg>`
    const adjusted = r.eff != null && r.grade != null && Math.abs(r.eff - r.grade) >= 0.25
    return `<span class="grade" style="color:${LABEL[CB.gradeOf(r)] || g.color}">${shape}${g.label}${adjusted ? `<span class="adj" title="Official grade ${CB.GRADES[r.grade].label}"><svg viewBox="0 0 24 24"><use href="#i-people"/></svg>${r.eff.toFixed(2)}</span>` : ''}</span>`
  }
  function line(r) {
    const g = CB.gradeOf(r), closed = r.status === 'closed'
    const c = mode === 'tint' ? (closed ? '#5f6b65' : CB.GRADES[g].color) : closed ? '#aab3ae' : LIGHT[g]
    const under = mode === 'tint' ? `<path d="${r.svg}" fill="none" stroke="rgba(251,250,247,0.85)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` : ''
    return `<svg class="line" viewBox="0 0 400 240" aria-hidden="true">${under}<path d="${r.svg}" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
  function facts(r) {
    return `${CB.fmt.km(r.km)} · ${r.climb == null ? '<span aria-label="Climb not listed">—</span>' : CB.fmt.climb(r.climb)} · ${CB.fmt.days(r.days)}${r.rating != null && r.reviews ? ` · <span class="rt">★ ${r.rating.toFixed(1)}</span>` : ''}`
  }
  function tile(r, i) {
    const col = FIELD[r.country] || '#e4e4dc', photo = `<img class="photo" src="img/${PHOTOS[(r.name.length + i) % 4]}.jpg" alt="" loading="lazy">`
    const flag = `<span class="flag">${r.status === 'closed' ? 'Closed' + (r.note ? ' · ' + CB.esc(r.note) : '') : ''}</span>`
    const field = `<span class="field" style="background:${col}">${photo}<span class="ctry">${CB.esc(r.country)}</span>${line(r)}${grade(r)}</span>`
    const text = `<h2>${CB.esc(r.name)}</h2><span class="facts">${facts(r)}</span>`
    if (mode === 'stack') return `<a class="tile ${r.status === 'closed' ? 'is-closed' : ''}" href="#">${flag}${field}<span class="cap" style="background:${col}">${text}</span></a>`
    return `<a class="tile ${r.status === 'closed' ? 'is-closed' : ''}" href="#">${flag}${field}${text}</a>`
  }
  function render() {
    if (!current.length) { tilesEl.style.display = 'block'; tilesEl.innerHTML = CB.emptyHTML(); moreEl.innerHTML = ''; return }
    tilesEl.style.display = ''
    tilesEl.innerHTML = current.slice(0, shown).map(tile).join('')
    moreEl.innerHTML = current.length > shown ? `<button class="btn btn-ink" type="button" id="more-btn">${window.D_MORE_PLAIN ? 'Show more routes' : 'Show more · ' + (current.length - shown).toLocaleString('en') + ' left'}</button>` : ''
  }
  moreEl.addEventListener('click', (e) => { if (e.target.closest('#more-btn')) { shown += PAGE; render() } })

  // Active filters as removable pills, as in option C
  const activeEl = document.getElementById('active')
  CB.onUpdate(() => {
    const s = CB.state, p = []
    if (s.q) p.push(['q', `“${CB.esc(s.q)}”`])
    if (s.country) p.push(['country', CB.esc(s.country)])
    s.grades.forEach((g) => p.push(['grade:' + g, CB.GRADES[g].label]))
    s.trips.forEach((t) => p.push(['trip:' + t, CB.TRIPS[t]]))
    if (s.km[0] || s.km[1] !== 100) p.push(['km', document.querySelector('[data-range-val=km]').textContent])
    if (s.climb[0] || s.climb[1] !== 100) p.push(['climb', 'Climb ' + document.querySelector('[data-range-val=climb]').textContent])
    activeEl.innerHTML = p.map(([k, l]) => `<button class="pill-x" type="button" data-rm="${k}" aria-label="Remove filter ${l}">${l}<svg class="ico"><use href="#i-close"/></svg></button>`).join('')
  })
  activeEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return
    const [k, v] = b.dataset.rm.split(':'), s = CB.state
    if (k === 'q') s.q = ''; else if (k === 'country') s.country = ''; else if (k === 'grade') s.grades.delete(+v); else if (k === 'trip') s.trips.delete(v); else s[k] = [0, 100]
    CB.update()
  })

  CB.init({ render(list) { current = list; shown = PAGE; render() } })
})()
