// Motion for the S1–S3 route pages: count-ups, staggered reveals, the difficulty gauge, a scroll-drawn trail,
// stacking chapters, pinned horizontal strips, day pickers and the desk calendar. Needs detail.js (RD) first.
;(function () {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const { wx, days, code, warnings } = window.RD

  // Reveal once in view; children marked [data-stagger] get increasing delays
  document.querySelectorAll('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--d', `${i * 80}ms`)))
  const seen = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    e.target.classList.add('in')
    e.target.querySelectorAll('[data-count]').forEach(count)
    e.target.querySelectorAll('[data-gauge]').forEach(gauge)
    seen.unobserve(e.target)
  }), { rootMargin: '0px 0px -12% 0px' })
  document.querySelectorAll('.pop, [data-watch]').forEach((el) => seen.observe(el))

  // Numbers count up from zero, keeping their format (decimals, sign, thousands)
  function count(el) {
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, pre = el.dataset.pre || '', suf = el.dataset.suf || ''
    const show = (v) => (el.textContent = pre + v.toLocaleString('en', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf)
    if (still) return show(to)
    const t0 = performance.now(), dur = 1400
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); show(to * e); if (k < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }

  // Gauge: the needle swings to the community grade on a 1–4 arc
  function gauge(el) {
    const v = parseFloat(el.dataset.gauge), deg = -90 + ((v - 1) / 3) * 180
    el.querySelector('.needle').style.transform = `rotate(${still ? deg : -90}deg)`
    if (!still) requestAnimationFrame(() => requestAnimationFrame(() => (el.querySelector('.needle').style.transform = `rotate(${deg}deg)`)))
  }

  // A path that draws itself as you scroll through its container
  const drawn = [...document.querySelectorAll('[data-scrollpath]')]
  // Chapters that shrink back as the next one stacks over them
  const stacks = [...document.querySelectorAll('[data-stack] > .chapter')]
  // Strips that scroll sideways while pinned
  const strips = [...document.querySelectorAll('[data-hscroll]')]
  let ticking = false
  function frame() {
    ticking = false
    const vh = innerHeight
    drawn.forEach((p) => {
      const box = p.closest('[data-scrolltrack]').getBoundingClientRect()
      const k = Math.min(1, Math.max(0, (vh * 0.6 - box.top) / box.height))
      p.style.strokeDashoffset = still ? 0 : (1 - k).toFixed(4)
      const dot = document.querySelector('[data-hiker]')
      if (dot) { const len = p.getTotalLength(), pt = p.getPointAtLength(len * k); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y) }
    })
    if (!still) stacks.forEach((c, i) => {
      const next = stacks[i + 1]; if (!next) return
      const r = next.getBoundingClientRect(), top = parseFloat(getComputedStyle(next).top) || 0
      const k = Math.min(1, Math.max(0, 1 - (r.top - top) / vh))
      c.style.transform = `scale(${(1 - k * 0.05).toFixed(4)})`
      c.style.filter = `brightness(${(1 - k * 0.25).toFixed(3)})`
    })
    strips.forEach((s) => {
      const box = s.getBoundingClientRect(), track = s.querySelector('.track')
      const max = track.scrollWidth - s.querySelector('.pin').clientWidth
      const k = Math.min(1, Math.max(0, -box.top / (box.height - vh)))
      track.style.transform = `translate3d(${(-max * k).toFixed(1)}px, 0, 0)`
    })
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame) } }, { passive: true })
  addEventListener('resize', frame)

  // Day picker: click a day to open its details beneath (bento weather)
  document.querySelectorAll('[data-daypick]').forEach((root) => {
    const out = root.querySelector('[data-dayout]')
    const show = (i) => {
      root.querySelectorAll('[data-day]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.day === i))
      out.innerHTML = dayDetail(i)
      out.classList.remove('swap'); void out.offsetWidth; out.classList.add('swap')
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b) show(+b.dataset.day) })
    show(0)
  })
  function dayDetail(i) {
    const w = warnings(i)
    return `<div class="dd-grid">
      <div><span class="lab">Trailhead</span><b class="data">${wx.max[i].toFixed(0)}° / ${wx.min[i].toFixed(0)}°</b></div>
      <div><span class="lab">Summit, 3,115 m</span><b class="data">${wx.sMax[i].toFixed(0)}° / ${wx.sMin[i].toFixed(0)}°</b><span class="fine">Feels like ${wx.sFeels[i].toFixed(0)}°</span></div>
      <div><span class="lab">Rain</span><b class="data">${wx.rainChance[i]}%</b><span class="fine">${wx.rain[i].toFixed(1)} mm</span></div>
      <div><span class="lab">Gusts</span><b class="data">${wx.gust[i].toFixed(0)} km/h</b></div>
      <div><span class="lab">UV index</span><b class="data">${wx.uv[i].toFixed(1)}</b></div>
      <div><span class="lab">Daylight</span><b class="data">${wx.sunrise[i]}–${wx.sunset[i]}</b></div>
    </div>${w.length ? `<p class="dd-warn">${w.map((x) => `<span class="wtag">${RD.icons.warnIco}${x}</span>`).join('')}</p>` : ''}`
  }

  // Desk calendar: one page per day; picking a date tears the current page off to reveal the new one
  const MONTH = ['OCT', 'OCT', 'OCT', 'OCT', 'NOV', 'NOV', 'NOV'], DAYN = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday']
  const NUM = ['28', '29', '30', '31', '1', '2', '3']
  document.querySelectorAll('[data-cal]').forEach((cal) => {
    const stage = cal.querySelector('.stage'), tabs = cal.querySelector('.tabs')
    tabs.innerHTML = days.map((d, i) => `<button type="button" class="tab" data-i="${i}" aria-pressed="false"><span class="m">${MONTH[i]}</span><span class="n">${NUM[i]}</span><span class="t data">${wx.sMax[i].toFixed(0)}°</span>${warnings(i).length ? '<i class="flag" aria-label="Has warnings"></i>' : ''}</button>`).join('')
    let cur = -1
    const page = (i) => `<article class="page" aria-live="polite">
      <header><span>${MONTH[i]} 2026</span><span>${DAYN[i]}</span></header>
      <div class="big"><span class="n">${NUM[i]}</span><span class="c">${code[wx.codes[i]]}</span></div>
      ${dayDetail(i)}
      <footer class="fine">Open-Meteo forecast for Gunung Merbabu. Summit figures are for 3,115 m at the route's location.</footer>
    </article>`
    function go(i) {
      if (i === cur) return
      const old = stage.querySelector('.page')
      stage.insertAdjacentHTML('beforeend', page(i))
      const fresh = stage.lastElementChild
      if (old) {
        if (still) old.remove()
        else { old.classList.add('tear'); old.addEventListener('animationend', () => old.remove(), { once: true }) }
      }
      fresh.classList.add('arrive')
      tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-pressed', +t.dataset.i === i))
      cur = i
    }
    tabs.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) go(+t.dataset.i) })
    tabs.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return
      const n = Math.max(0, Math.min(6, cur + (e.key === 'ArrowRight' ? 1 : -1))); go(n); tabs.children[n].focus()
    })
    go(0)
  })

  // Expanders (S1 fit checks)
  document.querySelectorAll('[data-expand]').forEach((b) => b.addEventListener('click', () => {
    const t = document.getElementById(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') !== 'true'
    b.setAttribute('aria-expanded', open); t.hidden = !open; b.textContent = open ? 'Hide the checks' : 'See all 5 checks'
  }))

  frame()
})()
