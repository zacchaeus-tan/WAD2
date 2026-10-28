// S6 · Trail journey: the plain trail (no markers), weather designs, difficulty dial, gear checklist and review register.
// Needs detail.js (RD) first.
;(function () {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const { wx, warnings } = window.RD
  const SVGNS = 'http://www.w3.org/2000/svg'

  /* ---------- Trail ---------- */
  const journey = document.querySelector('.journey')
  const canvas = journey.querySelector('.trail-canvas')
  const LABELS = ['Trailhead · Wekas', 'The climb', 'Summit · 3,115 m', 'The descent', 'Basecamp', 'Trail register']
  let path, walk, hiker, marks = [], tufts = [], total = 0

  // Catmull-Rom through the points, written as cubic Béziers
  function smooth(pts) {
    let d = `M${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    }
    return d
  }
  function rand(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) }

  function build() {
    const W = canvas.clientWidth, H = journey.offsetHeight, stops = [...journey.querySelectorAll('.stop')]
    const jTop = journey.getBoundingClientRect().top + scrollY
    const narrow = W < 900
    const sideL = narrow ? 18 : W * 0.07, sideR = narrow ? W - 18 : W * 0.93
    const pts = [[W / 2, 0]], anchors = []
    stops.forEach((s, i) => {
      const top = s.getBoundingClientRect().top + scrollY - jTop, h = s.offsetHeight
      const prevBottom = i ? stops[i - 1].getBoundingClientRect().bottom + scrollY - jTop : 0
      const gapY = i ? (prevBottom + top) / 2 : Math.max(36, top / 2)
      const gx = narrow ? W / 2 : W / 2 + (i % 2 ? -1 : 1) * W * 0.12
      pts.push([gx, gapY]); anchors.push([gx, gapY])
      pts.push([i % 2 ? sideL : sideR, top + h * 0.5])
    })
    pts.push([W / 2, H])

    const d = smooth(pts), r = rand(7)
    canvas.innerHTML = ''
    const svg = document.createElementNS(SVGNS, 'svg')
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.innerHTML = `<path class="t-ghost" d="${d}"/>
      <path class="t-path" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
      <g class="grass"></g>
      <g class="marks"></g>
      <g class="hiker"><circle class="r" r="12"/><circle class="b" r="9"/></g>`
    canvas.appendChild(svg)
    path = svg.querySelector('.t-path'); walk = path; hiker = svg.querySelector('.hiker')
    total = path.getTotalLength()

    // Grass tufts on both sides of the line; each one grows when the walked line reaches it
    let grass = ''
    for (let L = 24; L < total; L += 38) {
      const a = path.getPointAtLength(L), b = path.getPointAtLength(Math.min(total, L + 1))
      const nx = -(b.y - a.y), ny = b.x - a.x, n = Math.hypot(nx, ny) || 1
      const side = r() < 0.5 ? -1 : 1, off = 9 + r() * 8, tx = a.x + (nx / n) * off * side, ty = a.y + (ny / n) * off * side
      const h = 6 + r() * 6
      grass += `<g data-at="${L.toFixed(0)}"><path d="M${tx.toFixed(1)} ${ty.toFixed(1)} l-${(h * 0.45).toFixed(1)} -${(h * 0.8).toFixed(1)} M${tx.toFixed(1)} ${ty.toFixed(1)} l0 -${h.toFixed(1)} M${tx.toFixed(1)} ${ty.toFixed(1)} l${(h * 0.45).toFixed(1)} -${(h * 0.8).toFixed(1)}"/></g>`
    }
    svg.querySelector('.grass').innerHTML = grass
    tufts = [...svg.querySelectorAll('.grass g')].map((g) => ({ g, at: +g.dataset.at }))

    marks = []
    progress()
  }

  function progress() {
    if (!path) return
    const box = journey.getBoundingClientRect(), vh = innerHeight
    const k = still ? 1 : Math.min(1, Math.max(0, (vh * 0.55 - box.top) / box.height))
    walk.setAttribute('stroke-dashoffset', (1 - k).toFixed(4))
    const p = path.getPointAtLength(total * k)
    hiker.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`)
    marks.forEach((m) => m.g.classList.toggle('reached', total * k >= m.at - 4))
    tufts.forEach((t) => t.g.classList.toggle('grown', total * k >= t.at))
  }
  let ticking = false
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; progress() }) } }, { passive: true })
  new ResizeObserver(() => build()).observe(journey)
  addEventListener('load', build)
  build()

  /* ---------- Difficulty dial ---------- */
  document.querySelectorAll('[data-dial]').forEach((el) => {
    const deg = (v) => -90 + ((v - 1) / 3) * 180
    el.querySelector('.n-official').style.transform = `rotate(${deg(+el.dataset.official)}deg)`
    el.querySelector('.n-comm').style.transform = `rotate(${deg(+el.dataset.community)}deg)`
  })

  /* ---------- Weather ---------- */
  const DN = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'], NUM = ['28', '29', '30', '31', '1', '2', '3'], MON = ['Oct', 'Oct', 'Oct', 'Oct', 'Nov', 'Nov', 'Nov']
  const FULL = ['Wednesday 28 October', 'Thursday 29 October', 'Friday 30 October', 'Saturday 31 October', 'Sunday 1 November', 'Monday 2 November', 'Tuesday 3 November']
  const COND = { 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 81: 'Rain showers' }
  const cloud = '<path d="M7 15.5h9.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.4A2.9 2.9 0 0 0 7 15.5z"/>'
  const ICON = {
    51: `${cloud}<line x1="10" y1="18.5" x2="10" y2="19.5"/><line x1="14" y1="18.5" x2="14" y2="19.5"/>`,
    53: `${cloud}<line x1="8.5" y1="18.5" x2="8.5" y2="20"/><line x1="12" y1="18.5" x2="12" y2="20"/><line x1="15.5" y1="18.5" x2="15.5" y2="20"/>`,
    55: `${cloud}<line x1="7.5" y1="18.5" x2="7.5" y2="20.5"/><line x1="10.5" y1="18.5" x2="10.5" y2="21"/><line x1="13.5" y1="18.5" x2="13.5" y2="20.5"/><line x1="16.5" y1="18.5" x2="16.5" y2="21"/>`,
    81: `${cloud}<line x1="9" y1="18" x2="7.5" y2="22"/><line x1="12.5" y1="18" x2="11" y2="22"/><line x1="16" y1="18" x2="14.5" y2="22"/>`,
  }
  const icon = (c) => `<svg class="wxi" viewBox="0 0 24 24" aria-hidden="true">${ICON[c]}</svg>`
  const cond = (i) => `<span class="cond">${icon(wx.codes[i])}${COND[wx.codes[i]]}</span>`
  const pct = (t) => { const [h, m] = t.split(':').map(Number); return ((h * 60 + m) / 1440) * 100 }

  function almanac() {
    return `<div class="almanac" role="group" aria-label="Pick a day">
      <div class="axis" aria-hidden="true"><span></span><span class="alt"><span>3,115 m</span><span>1,731 m</span></span><span></span></div>
      ${DN.map((d, i) => `<button type="button" class="aday" data-day="${i}" style="--i:${i}" aria-pressed="false" aria-label="${FULL[i]}, ${COND[wx.codes[i]]}, summit ${wx.sMax[i].toFixed(0)} degrees, trailhead ${wx.max[i].toFixed(0)} degrees, ${wx.rainChance[i]}% chance of rain">
        ${warnings(i).length ? '<i class="warn-dot" aria-hidden="true"></i>' : ''}
        <span class="hd"><span class="dn">${d}</span><span class="n">${NUM[i]}</span></span>
        <span class="slice"><svg viewBox="0 0 100 220" preserveAspectRatio="none" aria-hidden="true"><path class="hill" d="M0 220 L0 150 L30 95 L50 40 L70 90 L100 140 L100 220 Z"/><line class="lapse" x1="50" y1="52" x2="50" y2="168" vector-effect="non-scaling-stroke"/></svg>
          <span class="tt top">${wx.sMax[i].toFixed(0)}°</span><span class="tt bot">${wx.max[i].toFixed(0)}°</span>
          <span class="rain" aria-hidden="true">${'<i></i>'.repeat(Math.round(wx.rainChance[i] / 25))}</span></span>
        <span class="ft">${cond(i)}</span></button>`).join('')}
    </div>`
  }
  const label = (i) => `${FULL[i]}, ${COND[wx.codes[i]]}, summit ${wx.sMax[i].toFixed(0)} degrees, trailhead ${wx.max[i].toFixed(0)} degrees, ${wx.rainChance[i]}% chance of rain`
  const head = (d, i) => `<span class="hd"><span class="dn">${d}</span><span class="n">${NUM[i]}</span></span>`

  // Iteration 2 · Two lines: summit and trailhead highs across the week, over one ridge
  function almanac2() {
    const y = (t) => 100 - ((t - 4) / (26 - 4)) * 100
    const xs = DN.map((_, i) => ((i + 0.5) / 7) * 700)
    const line = (arr) => xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y(Math.round(arr[i])) * 2.3).toFixed(2)}`).join(' ')
    return `<div class="alm2" role="group" aria-label="Pick a day">
      <div class="yax" aria-hidden="true"><span></span><span class="lines"><span style="top:${y(13.7)}%"><i style="background:var(--lake)"></i>Summit</span><span style="top:${y(22.7)}%"><i style="background:var(--blaze)"></i>Trailhead</span></span><span></span></div>
      <div class="chart" aria-hidden="true"><svg viewBox="0 0 700 230" preserveAspectRatio="none"><path class="ridge" d="M0 230 L0 170 L90 120 L170 150 L260 70 L330 110 L420 40 L500 100 L590 80 L700 140 L700 230 Z"/>
        <path class="ls" pathLength="1" d="${line(wx.sMax)}" vector-effect="non-scaling-stroke"/><path class="lt" pathLength="1" d="${line(wx.max)}" vector-effect="non-scaling-stroke"/></svg></div>
      ${DN.map((d, i) => `<button type="button" class="a2day" data-day="${i}" aria-pressed="false" aria-label="${label(i)}">${head(d, i)}
        <span class="plot"><span class="pt s" style="top:${y(Math.round(wx.sMax[i]))}%"><i></i>${wx.sMax[i].toFixed(0)}°</span><span class="pt t" style="top:${y(Math.round(wx.max[i]))}%"><i></i>${wx.max[i].toFixed(0)}°</span></span>
        <span class="ft">${cond(i)}</span></button>`).join('')}
    </div>`
  }
  // Iteration 3 · Peaks: each day is its own mountain, rain falling on it in proportion to the chance
  function almanac3() {
    return `<div class="alm3" role="group" aria-label="Pick a day">${DN.map((d, i) => {
      const drops = Math.round(wx.rainChance[i] / 12)
      return `<button type="button" class="a3day" data-day="${i}" aria-pressed="false" aria-label="${label(i)}">${head(d, i)}
        <span class="peak"><svg viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true"><path class="mtn" d="M0 120 L50 18 L100 120 Z"/><path class="snow" d="M50 18 L64 47 L57 43 L50 50 L43 43 L36 47 Z"/><path class="foot" d="M0 120 L20 92 L40 100 L60 90 L80 98 L100 88 L100 120 Z"/></svg>
          <span class="drops" aria-hidden="true">${Array.from({ length: drops }, (_, k) => `<i style="left:${8 + ((k * 37) % 84)}%;animation-delay:${((k * 0.17) % 1.2).toFixed(2)}s"></i>`).join('')}</span>
          <span class="st"><small>Summit</small>${wx.sMax[i].toFixed(0)}°</span><span class="tb"><small>Trailhead</small>${wx.max[i].toFixed(0)}°</span></span>
        ${cond(i)}</button>`
    }).join('')}</div>`
  }
  // Iteration 4 · Span: one bar per day from the summit's coldest to the trailhead's warmest, on a shared scale
  function almanac4() {
    const lo = 4, hi = 26, y = (t) => 100 - ((t - lo) / (hi - lo)) * 100
    return `<div class="alm4" role="group" aria-label="Pick a day">
      <div class="tax" aria-hidden="true" style="margin-top:60px;height:260px">${[25, 20, 15, 10, 5].map((t) => `<span style="top:${y(t)}%">${t}°</span>`).join('')}</div>
      ${DN.map((d, i) => `<button type="button" class="a4day" data-day="${i}" style="--i:${i}" aria-pressed="false" aria-label="${label(i)}">${head(d, i)}
        <span class="rng"><span class="bar" style="top:${y(wx.max[i])}%;bottom:${100 - y(wx.sMin[i])}%"></span>
          <span class="tag" style="top:${y(wx.max[i])}%"><small>Trail</small>${wx.max[i].toFixed(0)}°</span>
          <span class="tag" style="top:${y(wx.sMax[i])}%"><small>Summit</small>${wx.sMax[i].toFixed(0)}°</span>
          <span class="tag" style="top:${y(wx.sMin[i])}%"><small>Night</small>${wx.sMin[i].toFixed(0)}°</span></span>
        <span class="ft">${cond(i)}</span></button>`).join('')}
    </div>`
  }
  const VIEWS = { slices: almanac, lines: almanac2, peaks: almanac3, span: almanac4 }
  function advice(i) {
    const out = []
    if (wx.rainChance[i] >= 70) out.push('Rain is likely. The reported river crossing can run high after rain: start early and turn back if the water rises.')
    if (wx.uv[i] >= 8) out.push(`UV index ${wx.uv[i].toFixed(1)} is very high. Cover up and use sunscreen, even under cloud.`)
    if (wx.sFeels[i] <= 6) out.push(`It feels like ${wx.sFeels[i].toFixed(0)}° at the summit. Pack a warm layer for the top.`)
    return out
  }
  function drawerHTML(i) {
    return `<div class="inner">
      <div class="col"><h3>Trailhead</h3><dl><dt>High / low</dt><dd>${wx.max[i].toFixed(1)}° / ${wx.min[i].toFixed(1)}°</dd><dt>Chance of rain</dt><dd>${wx.rainChance[i]}%</dd><dt>Rain total</dt><dd>${wx.rain[i].toFixed(1)} mm</dd><dt>Strongest gusts</dt><dd>${wx.gust[i].toFixed(0)} km/h</dd></dl></div>
      <div class="col"><h3>Summit · 3,115 m</h3><dl><dt>High / low</dt><dd>${wx.sMax[i].toFixed(1)}° / ${wx.sMin[i].toFixed(1)}°</dd><dt>Feels like at coldest</dt><dd>${wx.sFeels[i].toFixed(1)}°</dd><dt>UV index</dt><dd>${wx.uv[i].toFixed(1)}</dd><dt>Sunrise / sunset</dt><dd>${wx.sunrise[i]} / ${wx.sunset[i]}</dd></dl></div>
      <div class="advice">${advice(i).map((t) => `<p><svg viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>${t}</p>`).join('')}</div>
      <p class="fine src">Open-Meteo daily forecast. Summit figures are for 3,115 m at the route's location, not the exact summit spot.</p></div>`
  }
  document.querySelectorAll('[data-wx2]').forEach((root) => {
    const view = root.querySelector('[data-view]'), sum = root.querySelector('[data-sum]'), drawer = root.querySelector('.drawer'), more = root.querySelector('[data-more]')
    let cur = 0, mode = 'lines'
    function select(i) {
      cur = i
      view.querySelectorAll('[data-day]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.day === i))
      const w = warnings(i)
      sum.querySelector('.big').textContent = NUM[i]
      sum.querySelector('.what').innerHTML = `<span class="lab">${FULL[i]}</span><strong>${cond(i)}</strong><span class="fine">${w.length ? w.join(' · ') : 'No warnings'}</span>`
      drawer.firstElementChild.innerHTML = drawerHTML(i)
    }
    function render() { view.innerHTML = VIEWS[mode](); select(cur) }
    view.addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b) select(+b.dataset.day) })
    view.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
      e.preventDefault(); const n = Math.max(0, Math.min(6, cur + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1))); select(n); view.querySelector(`[data-day="${n}"]`).focus()
    })
    more.addEventListener('click', () => { const open = !drawer.classList.contains('open'); drawer.classList.toggle('open', open); more.setAttribute('aria-expanded', open); more.firstChild.textContent = open ? 'Fewer details ' : 'More details ' })
    root.querySelectorAll('[data-design]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.design; root.querySelectorAll('[data-design]').forEach((x) => x.setAttribute('aria-pressed', x === b)); render()
    }))
    render()
  })

  /* ---------- Gear checklist ---------- */
  const GEAR = ['Headlamp and spare batteries', 'Rain shell', 'Warm layer for 5 °C feels-like at the top', '2 L of water', 'Sunscreen and hat (UV index 9+)', 'Trekking poles for the descent', 'Shoes you can cross water in', 'First-aid kit']
  const ico = {
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>',
  }
  document.querySelectorAll('[data-gear]').forEach((box) => {
    const list = box.querySelector('.gear-list'), packed = box.querySelector('[data-packed]'), bar = box.querySelector('[data-packbar]')
    const gen = box.querySelector('[data-generate]'), save = box.querySelector('[data-save]'), add = box.querySelector('[data-add]'), msg = box.querySelector('.saved-msg')
    const item = (t, on) => `<div class="gitem"><label><input type="checkbox"${on ? ' checked' : ''}><span>${t}</span></label><span class="tools"><button type="button" data-edit aria-label="Edit ${t}">${ico.edit}</button><button type="button" data-del aria-label="Remove ${t}">${ico.del}</button></span></div>`
    function count() { const all = list.querySelectorAll('input'), n = [...all].filter((x) => x.checked).length; packed.textContent = all.length ? `${n} of ${all.length} packed` : 'No items yet'; if (bar) bar.style.setProperty('--p', all.length ? n / all.length : 0) }
    function fill(items) { list.innerHTML = items.map((t, i) => item(t, i < 2)).join(''); list.querySelectorAll('.gitem').forEach((g, i) => { g.classList.add('pop'); g.style.setProperty('--d', `${i * 60}ms`); requestAnimationFrame(() => g.classList.add('in')) }); count() }
    list.addEventListener('change', count)
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.gitem'); if (!row) return
      if (e.target.closest('[data-del]')) { row.remove(); count() }
      if (e.target.closest('[data-edit]')) { const s = row.querySelector('label span'); s.contentEditable = 'true'; s.focus(); s.addEventListener('blur', () => (s.contentEditable = 'false'), { once: true }) }
    })
    gen.addEventListener('click', () => {
      gen.disabled = true; gen.lastChild.textContent = ' Generating…'
      list.innerHTML = '<p class="fine" style="padding:16px 0">Writing a list for Gunung Merbabu from the route, the forecast and the hazard reports…</p>'
      setTimeout(() => { fill(GEAR); gen.disabled = false; gen.lastChild.textContent = ' Regenerate' }, still ? 0 : 900)
    })
    add.addEventListener('click', () => {
      list.insertAdjacentHTML('beforeend', item('New item', false)); const s = list.lastElementChild.querySelector('label span')
      s.contentEditable = 'true'; s.focus(); document.getSelection().selectAllChildren(s); s.addEventListener('blur', () => (s.contentEditable = 'false'), { once: true }); count()
    })
    save.addEventListener('click', () => {
      const on = save.getAttribute('aria-pressed') !== 'true'
      save.setAttribute('aria-pressed', on); save.textContent = on ? 'Saved' : 'Save checklist'
      msg.textContent = on ? 'Saved to your profile' : 'Removed from your profile'; msg.classList.add('on'); setTimeout(() => msg.classList.remove('on'), 2200)
    })
    fill(GEAR)
  })

  /* ---------- Fit list: check names stand in their own column, so drop the sentence full stop ---------- */
  document.querySelectorAll('.fitlist.minimal strong').forEach((el) => (el.textContent = el.textContent.replace(/.$/, '')))

  /* ---------- Fit section: design switch (mockup only) ---------- */
  document.querySelectorAll('[data-fitswitch]').forEach((sw) => sw.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fitv-show]'); if (!b) return
    sw.querySelectorAll('[data-fitv-show]').forEach((x) => x.setAttribute('aria-pressed', x === b))
    const card = sw.closest('.c-fit')
    card.querySelectorAll('.fitv').forEach((f) => (f.hidden = f.dataset.fitv !== b.dataset.fitvShow))
    card.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in')))
    build()
  }))
  if (new URLSearchParams(location.search).get('fit')) document.querySelector(`[data-fitv-show="${new URLSearchParams(location.search).get('fit')}"]`)?.click()

  /* ---------- Route details band: design switch (mockup only) ---------- */
  document.querySelectorAll('[data-fbswitch]').forEach((sw) => sw.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fb-show]'); if (!b) return
    sw.querySelectorAll('[data-fb-show]').forEach((x) => x.setAttribute('aria-pressed', x === b))
    document.querySelectorAll('.fb').forEach((f) => (f.hidden = f.dataset.fb !== b.dataset.fbShow))
    const shown = document.querySelector(`.fb[data-fb="${b.dataset.fbShow}"]`)
    shown.classList.remove('in'); requestAnimationFrame(() => requestAnimationFrame(() => shown.classList.add('in')))
    // A trail drawn while hidden has no size to fit, so fit it now it shows
    shown.querySelectorAll('svg.trail').forEach((t) => window.RD.fitTrail(t))
    build()
  }))

  /* ---------- Review register ---------- */
  document.querySelectorAll('[data-register]').forEach((reg) => {
    reg.querySelector('.reg-filter').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return
      reg.querySelectorAll('.reg-filter button').forEach((x) => x.setAttribute('aria-pressed', x === b))
      const f = b.dataset.f
      reg.querySelectorAll('.entry').forEach((en) => (en.hidden = f === 'inc' ? !en.dataset.inc : f === 'done' ? en.dataset.done !== '1' : false))
    })
  })

  // Open on a chosen design from the URL, e.g. ?fb=ruler&cal=peaks (mockup convenience)
  const q = new URLSearchParams(location.search)
  if (q.get('fb')) document.querySelector(`[data-fb-show="${q.get('fb')}"]`)?.click()
  if (q.get('cal')) document.querySelector(`[data-design="${q.get('cal')}"]`)?.click()
})()
