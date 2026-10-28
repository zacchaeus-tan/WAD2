// Route detail mockups: real data for Gunung Merbabu (Wekas BC) and the shared renderers.
// Route, review and incident come from the CAIRN Supabase tables; the forecast is Open-Meteo for 28 Oct–3 Nov 2026.
;(function () {
  const R = (window.CAIRN_BROWSE || []).find((r) => r.name === 'Gunung Merbabu (Wekas BC)')
  const route = {
    name: 'Gunung Merbabu (Wekas BC)', country: 'Indonesia', km: 10.01, climb: 1177, days: 1, alt: 3115,
    multiday: false, permit: null, guide: false, status: 'open', statusNote: null,
    official: 1, effective: 1.33, perceived: 3.0, rating: 5.0, reviews: 1, completion: 1.0,
    hazard: 'elevated', hazardNote: '1 hiker reported: flash flood or difficult river crossing',
    svg: R ? R.svg : '', lat: -7.4213, lon: 110.4208,
  }
  const review = { rating: 5, perceived: 3, completed: true, text: 'tough', date: '23 Oct 2026', incident: { category: 'Water hazard', note: 'flood' } }
  const days = ['Wed 28', 'Thu 29', 'Fri 30', 'Sat 31', 'Sun 1', 'Mon 2', 'Tue 3']
  const code = { 81: 'Rain showers', 53: 'Drizzle', 55: 'Heavy drizzle', 51: 'Light drizzle' }
  const wx = {
    codes: [81, 53, 53, 55, 53, 55, 51],
    max: [21.8, 23.2, 22.5, 22.0, 22.7, 23.0, 23.9], min: [15.6, 15.3, 15.9, 15.8, 15.0, 16.0, 16.2],
    rainChance: [100, 100, 100, 96, 67, 100, 78], rain: [11.0, 3.0, 3.3, 5.8, 4.5, 7.8, 1.2],
    gust: [30.2, 32.4, 36.0, 33.1, 34.2, 34.6, 37.8], uv: [9.3, 8.7, 7.35, 9.3, 9.65, 9.4, 9.65],
    sunrise: ['05:11', '05:11', '05:11', '05:10', '05:10', '05:10', '05:10'], sunset: ['17:32', '17:32', '17:32', '17:32', '17:32', '17:33', '17:33'],
    sMax: [12.8, 14.2, 13.5, 13.0, 13.7, 14.0, 14.9], sMin: [6.6, 6.3, 6.9, 6.8, 6.0, 7.0, 7.2], sFeels: [5.1, 5.2, 6.0, 5.5, 4.8, 5.7, 6.1],
  }
  // Warnings follow the app's threshold style: wet day at 70%+, very high UV at 8+
  function warnings(i) {
    const w = []
    if (wx.rainChance[i] >= 70) w.push('Wet day likely')
    if (wx.uv[i] >= 8) w.push('Very high UV')
    return w
  }
  const HEAT = { 1: '#6fdc8c', 2: '#f2d34f', 3: '#ff9f43', 4: '#ff5b4f' }

  // Fit checks for an example hiker: best day 14 km and +1,200 m, highest 2,000 m, day hikes, beginner
  const checks = [
    { ok: true, rule: 'Distance a day', msg: '10 km a day is within your experience (14 km).' },
    { ok: true, rule: 'Climb a day', msg: '+1,177 m a day is within your experience (+1,200 m).' },
    { ok: false, rule: 'Highest point', msg: 'Peaks at 3,115 m, more than 25% above your highest (2,000 m).' },
    { ok: true, rule: 'Trip length', msg: "You've done a day hike or longer before." },
    { ok: true, rule: 'Grade', msg: 'Rated Easy, which suits your experience level (beginner).' },
  ]

  const tick = '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>'
  const cross = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  const warnIco = '<svg viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>'

  function trailSVG(color, width = 3.6) {
    return `<svg class="trail" viewBox="0 0 400 240" aria-hidden="true"><path d="${route.svg}" pathLength="1" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
  // Crop an SVG's viewBox to its path so a narrow route still fills its box; the stroke keeps its screen width
  function fitTrail(svg, pad = 0.06) {
    const p = svg && svg.querySelector('path'); if (!p) return
    const b = p.getBBox(), m = Math.max(b.width, b.height) * pad
    svg.setAttribute('viewBox', [b.x - m, b.y - m, b.width + 2 * m, b.height + 2 * m].map((n) => n.toFixed(1)).join(' '))
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    p.setAttribute('vector-effect', 'non-scaling-stroke')
  }
  function checksHTML() {
    return checks.map((c) => `<li><span class="${c.ok ? 'ok' : 'no'}">${c.ok ? tick : cross}</span><span><strong>${c.rule}.</strong> ${c.msg}</span></li>`).join('')
  }
  function weatherRows(mode) {
    return days.map((d, i) => {
      const hi = mode === 'summit' ? wx.sMax[i] : wx.max[i], lo = mode === 'summit' ? wx.sMin[i] : wx.min[i]
      const w = warnings(i).map((x) => `<span class="wtag">${warnIco}${x}</span>`).join('')
      return `<tr><th scope="row">${d}</th><td>${code[wx.codes[i]]}</td><td class="data">${hi.toFixed(0)}° / ${lo.toFixed(0)}°</td><td class="data">${wx.rainChance[i]}% · ${wx.rain[i].toFixed(1)} mm</td><td class="data">${wx.gust[i].toFixed(0)} km/h</td><td>${w || '<span class="nl">None</span>'}</td></tr>`
    }).join('')
  }
  function bindWeather(root) {
    const body = root.querySelector('tbody'), btns = root.querySelectorAll('[data-wx]')
    const set = (m) => { body.innerHTML = weatherRows(m); btns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.wx === m)) }
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.wx)))
    set('trailhead')
  }
  function bindChecklist(root) {
    root.addEventListener('change', (e) => {
      if (!e.target.matches('input[type=checkbox]')) return
      const all = root.querySelectorAll('input[type=checkbox]'), done = [...all].filter((x) => x.checked).length
      const c = root.querySelector('[data-packed]'); if (c) c.textContent = `${done} of ${all.length} packed`
    })
  }
  // Pace buttons in the itinerary form behave as a single-choice group
  function bindSeg(root) {
    root.querySelectorAll('.seg').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return
      g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b))
    }))
  }
  // Section nav: highlight the section in view
  function bindSectionNav(nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')], secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean)
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return
      links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id))
    }), { rootMargin: '-45% 0px -50% 0px' })
    secs.forEach((s) => io.observe(s))
  }

  window.RD = { fitTrail, route, review, wx, days, code, warnings, checks, HEAT, trailSVG, checksHTML, weatherRows, bindWeather, bindChecklist, bindSeg, bindSectionNav, icons: { tick, cross, warnIco } }
  document.querySelectorAll('[data-trail]').forEach((el) => { el.innerHTML += trailSVG(el.dataset.trail || HEAT[1], +el.dataset.width || 3.6); if (el.hasAttribute('data-fit')) fitTrail(el.querySelector('svg.trail')) })
  document.querySelectorAll('[data-checks]').forEach((el) => (el.innerHTML = checksHTML()))
  document.querySelectorAll('[data-weather]').forEach(bindWeather)
  document.querySelectorAll('[data-checklist]').forEach(bindChecklist)
  document.querySelectorAll('[data-secnav]').forEach(bindSectionNav)
  bindSeg(document)
})()
