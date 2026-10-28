// Shared helpers for the homepage iterations: icon sprite, trail lines, contours.
;(function () {
  const sprite = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-cairn" viewBox="0 0 24 24"><g fill="currentColor" stroke="none"><ellipse cx="12" cy="20" rx="8" ry="2.4"/><ellipse cx="12" cy="15.2" rx="6" ry="2.2"/><ellipse cx="12" cy="10.6" rx="4.4" ry="2"/><ellipse cx="12" cy="6.4" rx="3" ry="1.8"/><ellipse cx="12" cy="3" rx="1.6" ry="1.2"/></g></symbol>
  <symbol id="i-altitude" viewBox="0 0 24 24"><path d="M3 20 10 8l4 6 2-3 5 9z"/><path d="M10 8V3l4 1.5L10 6"/></symbol>
  <symbol id="i-distance" viewBox="0 0 24 24"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h7a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h7"/></symbol>
  <symbol id="i-climb" viewBox="0 0 24 24"><path d="M3 18l6-6 4 4 8-8"/><path d="M15 8h6v6"/></symbol>
  <symbol id="i-days" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/></symbol>
  <symbol id="i-weather" viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 18z"/></symbol>
  <symbol id="i-checklist" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 9l1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17"/></symbol>
  <symbol id="i-ai" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></symbol>
  <symbol id="i-incident" viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></symbol>
  <symbol id="i-safety" viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.2 2.9 7.8 7 9.5 4.1-1.7 7-5.3 7-9.5V6z"/></symbol>
  <symbol id="i-people" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
  <symbol id="d-easy" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"/></symbol>
  <symbol id="d-moderate" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="currentColor"/></symbol>
  <symbol id="d-hard" viewBox="0 0 10 10"><path d="M5 0 10 5 5 10 0 5z" fill="currentColor"/></symbol>
</svg>`
  document.body.insertAdjacentHTML('afterbegin', sprite)

  const R = window.CAIRN_ROUTES || {}
  const NAMES = {
    kinabalu: 'Mt. Kinabalu Climbathon Summit Race',
    rinjani: 'Mount Rinjani via Senaru',
    pisang: 'Pisang Falls Loop',
    tongariro: 'GW - 02 Tongariro Northern Circuit',
    langbiang: 'Lang Biang Peak',
  }
  const COLORS = { easy: '#1f5b43', moderate: '#1e5f8c', hard: '#17201c', strenuous: '#5b2c83' }

  // Faint contour lines behind a trail, seeded so each card differs.
  function contours(seed, stroke) {
    let s = seed
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    let d = ''
    for (let k = 0; k < 4; k++) {
      const y = 70 + k * 42 + rnd() * 14
      d += `M-10 ${y.toFixed(1)} C 100 ${(y - 30 + rnd() * 60).toFixed(1)}, 260 ${(y - 30 + rnd() * 60).toFixed(1)}, 410 ${(y - 10 + rnd() * 20).toFixed(1)}`
    }
    return `<svg class="contours" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.2"/></svg>`
  }

  document.querySelectorAll('[data-trail]').forEach((el, i) => {
    const key = el.dataset.trail
    const grade = el.dataset.grade || 'hard'
    const path = R[NAMES[key]]
    if (!path) return
    el.insertAdjacentHTML(
      'afterbegin',
      contours(i * 37 + 11, el.dataset.contour || 'rgba(255,255,255,0.55)') +
        `<svg class="line" viewBox="0 0 400 240" aria-hidden="true">
          <path d="${path}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="trail-path" d="${path}" fill="none" stroke="${COLORS[grade]}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    )
  })

  window.CAIRN = { routes: R, contours }
})()
