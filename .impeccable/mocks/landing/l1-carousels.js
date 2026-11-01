// L1 "How it works" carousel: drag, scroll or use the controls; the middle panel is current
// and its photo fades in behind the section. A copy of the set sits on each side of the real
// panels, and once a move settles on a copy the strip jumps to the same panel in the real set,
// so it never reaches an end.
;(function () {
  const tour = document.querySelector('.tour')
  const view = tour.querySelector('.t-view')
  const track = tour.querySelector('.t-track')
  const ctl = tour.querySelector('.t-ctl')
  const slides = [...tour.querySelectorAll('.slide')]
  const n = slides.length
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const arrow = '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"/></svg>'
  const wrap = (k) => ((k % n) + n) % n

  const back = tour.querySelector('.t-back')
  back.innerHTML = slides.map((s) => `<img src="${s.querySelector('.s-photo').getAttribute('src')}" alt="">`).join('')
  const backs = [...back.children]

  const copy = () => slides.map((s) => {
    const c = s.cloneNode(true)
    c.setAttribute('aria-hidden', 'true')
    return c
  })
  track.prepend(...copy())
  track.append(...copy())
  const panels = [...track.children]
  let pos = n // index into panels; the real set runs from n to 2n - 1
  let moving = false
  let settleTimer = 0

  ctl.innerHTML = `
    <button class="t-btn prev" type="button" aria-label="Previous step">${arrow}</button>
    <div class="t-ticks">${slides.map((s, k) => `<button class="t-tick" type="button" aria-label="Step ${k + 1}: ${s.querySelector('h3').textContent}"></button>`).join('')}</div>
    <span class="t-count" aria-live="polite"></span>
    <button class="t-btn next" type="button" aria-label="Next step">${arrow}</button>`
  const ticks = [...ctl.querySelectorAll('.t-tick')]
  const count = ctl.querySelector('.t-count')

  function render() {
    const i = wrap(pos)
    panels.forEach((s, p) => s.classList.toggle('is-on', wrap(p) === i))
    backs.forEach((b, k) => b.classList.toggle('is-on', k === i))
    ticks.forEach((t, k) => {
      if (k === i) t.setAttribute('aria-current', 'step')
      else t.removeAttribute('aria-current')
      t.style.setProperty('--fill', k <= i ? 1 : 0)
    })
    count.textContent = `${i + 1} / ${n}`
  }

  const leftOf = (p) => panels[p].offsetLeft - (view.clientWidth - panels[p].offsetWidth) / 2

  function moveTo(p, smooth = true) {
    pos = Math.max(0, Math.min(panels.length - 1, p))
    render()
    moving = smooth && !still
    view.scrollTo({ left: leftOf(pos), behavior: moving ? 'smooth' : 'auto' })
    if (!moving) settle()
  }

  function nearest() {
    const mid = view.scrollLeft + view.clientWidth / 2
    const off = (p) => Math.abs(panels[p].offsetLeft + panels[p].offsetWidth / 2 - mid)
    return panels.reduce((best, _, p) => (off(p) < off(best) ? p : best), 0)
  }

  // Back onto the real set, at the same scroll offset within the panel
  function settle() {
    if (drag) return
    moving = false
    pos = nearest()
    const shift = pos < n ? n : pos >= 2 * n ? -n : 0
    if (shift) {
      view.scrollLeft += panels[pos + shift].offsetLeft - panels[pos].offsetLeft
      pos += shift
    }
    render()
  }

  ctl.querySelector('.prev').addEventListener('click', () => moveTo(pos - 1))
  ctl.querySelector('.next').addEventListener('click', () => moveTo(pos + 1))
  ticks.forEach((t, k) => t.addEventListener('click', () => moveTo(pos - wrap(pos) + k)))
  tour.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') moveTo(pos + 1)
    if (e.key === 'ArrowLeft') moveTo(pos - 1)
  })

  // Mouse drag; touch scrolls natively
  let drag = null
  view.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return
    if (moving) settle()
    drag = { x: e.clientX, left: view.scrollLeft }
    view.classList.add('dragging')
  })
  addEventListener('pointermove', (e) => { if (drag) view.scrollLeft = drag.left - (e.clientX - drag.x) })
  addEventListener('pointerup', () => {
    if (!drag) return
    drag = null
    view.classList.remove('dragging')
    moveTo(nearest())
  })

  view.addEventListener('scroll', () => {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(settle, 140)
    if (moving || nearest() === pos) return
    pos = nearest()
    render()
  }, { passive: true })
  addEventListener('resize', () => moveTo(pos, false))

  moveTo(n, false)
})()
