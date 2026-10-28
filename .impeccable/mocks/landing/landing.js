// Landing page helpers: featured route tiles, scroll reveal, parallax layers, word-by-word letter, route dot map.
// Needs ../browse/routes-data.js and ../browse/browse.js (for CB helpers and the icon sprite) loaded first.
;(function () {
  const R = window.CAIRN_BROWSE || []
  const byName = Object.fromEntries(R.map((r) => [r.name, r]))
  const HEAT = { 1: '#6fdc8c', 2: '#f2d34f', 3: '#ff9f43', 4: '#ff5b4f' }
  const LABEL = { 1: '#1d7a43', 2: '#7a5e00', 3: '#a34d00', 4: '#b42318' }
  const PHOTOS = ['card-lake-peaks', 'card-alpine-path', 'card-ridge-hikers', 'card-misty-lake']
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.toggle('js-motion', !still)

  function grade(r) {
    const n = CB.gradeOf(r), g = CB.GRADES[n]
    const shape = g.key === 'strenuous' ? `<svg viewBox="0 0 16 10" style="width:16px"><use href="#d-strenuous"/></svg>` : `<svg><use href="#d-${g.key}"/></svg>`
    const adjusted = r.eff != null && r.grade != null && Math.abs(r.eff - r.grade) >= 0.25
    return `<span class="grade" style="color:${LABEL[n]}">${shape}${g.label}${adjusted ? `<span class="adj"><svg viewBox="0 0 24 24"><use href="#i-people"/></svg>${r.eff.toFixed(2)}</span>` : ''}</span>`
  }
  function tile(r, i) {
    const n = CB.gradeOf(r)
    return `<a class="ltile" href="../browse/routes.html">
      <span class="field"><img class="photo" src="../browse/img/${PHOTOS[i % 4]}.jpg" alt="" loading="lazy"><span class="ctry">${CB.esc(r.country)}</span>
      <svg class="line" viewBox="0 0 400 240" aria-hidden="true"><path d="${r.svg}" fill="none" stroke="${HEAT[n]}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${grade(r)}</span>
      <h3>${CB.esc(r.name)}</h3>
      <span class="facts">${CB.fmt.km(r.km)} · ${r.climb == null ? '—' : CB.fmt.climb(r.climb)} · ${CB.fmt.days(r.days)}</span></a>`
  }
  document.querySelectorAll('[data-routes]').forEach((el) => {
    el.innerHTML = el.dataset.routes.split('|').map((n) => byName[n.trim()]).filter(Boolean).map(tile).join('')
  })

  // Reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -10% 0px' })
  document.querySelectorAll('.rise').forEach((el) => io.observe(el))

  // Parallax: inside [data-parallax], each [data-speed] layer moves down by scroll × speed
  const px = [...document.querySelectorAll('[data-parallax]')].map((box) => ({ box, layers: [...box.querySelectorAll('[data-speed]')].map((el) => ({ el, k: +el.dataset.speed })), fade: box.querySelector('[data-fade]') }))
  let ticking = false
  function frame() {
    ticking = false
    if (still) return
    px.forEach(({ box, layers, fade }) => {
      const h = box.offsetHeight, y = Math.min(Math.max(scrollY - box.offsetTop, 0), h)
      layers.forEach(({ el, k }) => (el.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0)`))
      if (fade) { fade.style.opacity = Math.max(0, 1 - (y / h) * 1.8).toFixed(3); fade.style.transform = `translate3d(0, ${(-y * 0.15).toFixed(1)}px, 0)` }
    })
    letters.forEach(lightLetter)
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame) } }, { passive: true })
  addEventListener('resize', frame)

  // Letter: words light up one by one as the block scrolls through the viewport
  const letters = [...document.querySelectorAll('[data-letter]')].map((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ')
    return { el, words: [...el.querySelectorAll('.w')] }
  })
  function lightLetter({ el, words }) {
    // A pinned letter tracks its section's scroll; a free one tracks its own position
    const box = el.closest('[data-letter-track]'), vh = innerHeight
    const r = (box || el).getBoundingClientRect()
    const t = box
      ? Math.min(1, Math.max(0, (0.1 * vh - r.top) / (r.height - vh * 1.1)))
      : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)))
    const lit = Math.round(t * words.length)
    words.forEach((w, i) => w.classList.toggle('lit', still || i < lit))
  }

  // Route dot map: every route's trailhead, projected over the region
  document.querySelectorAll('[data-dotmap]').forEach((svg) => {
    const [x0, x1, y0, y1] = [92, 180, -48, 26], W = 1000, H = 640
    const p = (lon, lat) => [((lon - x0) / (x1 - x0)) * W, ((y1 - lat) / (y1 - y0)) * H]
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.innerHTML = R.map((r) => { const [x, y] = p(r.lon, r.lat); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${HEAT[CB.gradeOf(r)]}"><title>${CB.esc(r.name)}</title></circle>` }).join('') +
      [['Philippines', 122, 18], ['Malaysia', 104, 8], ['Indonesia', 112, -1], ['Vietnam', 104, 19], ['Thailand', 96, 15], ['Australia', 132, -24], ['New Zealand', 164, -36]]
        .map(([n, lon, lat]) => { const [x, y] = p(lon, lat); return `<text x="${x}" y="${y}" class="dm-label">${n}</text>` }).join('')
  })

  window.CL = { byName, HEAT, LABEL }
  frame()
})()
