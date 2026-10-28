// D6: once the filter bar sticks to the top, a search field appears in it.
// <body class="mode-takeover"> swaps the filter dropdowns for the search (a Filters button brings them back);
// <body class="mode-inline"> slides the search in beside Sort and keeps the filters.
;(function () {
  const bar = document.querySelector('.dbar'); if (!bar) return
  const sentinel = document.createElement('div')
  sentinel.setAttribute('aria-hidden', 'true') // zero height, so it leaves no gap above the bar
  bar.before(sentinel)
  const wide = matchMedia('(min-width: 961px)')   // below this the bar is not sticky
  const toggle = bar.querySelector('.dfilters')
  const search = bar.querySelector('.dsearch input')

  function setStuck(on) {
    on = on && wide.matches
    if (document.body.classList.contains('bar-stuck') === on) return
    document.body.classList.toggle('bar-stuck', on)
    if (!on) { document.body.classList.remove('show-filters'); if (toggle) toggle.setAttribute('aria-expanded', 'false') }
    // Close any open dropdown when the bar changes shape
    bar.querySelectorAll('.dd-btn[aria-expanded="true"]').forEach((b) => b.click())
  }
  // Stuck once the spot the bar started from has scrolled above the top of the window
  const check = () => setStuck(sentinel.getBoundingClientRect().top < 0)
  addEventListener('scroll', check, { passive: true })
  check()
  wide.addEventListener('change', check)

  if (toggle) toggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('show-filters')
    document.body.classList.toggle('show-filters', open)
    toggle.setAttribute('aria-expanded', open)
    toggle.querySelector('span').textContent = open ? 'Search' : 'Filters'
    if (!open && search) search.focus()
  })

  // Sort dropdown: option buttons drive the hidden select the filters already listen to
  const sel = bar.querySelector('.dd-sort select'), opts = bar.querySelector('.sortopts'), sum = bar.querySelector('[data-sum=sort]')
  if (sel && opts) {
    opts.innerHTML = [...sel.options].map((o) => '<button type="button" data-v="' + o.value + '" aria-pressed="false">' + o.textContent + '</button>').join('')
    const sync = () => { opts.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === sel.value)); sum.textContent = sel.options[sel.selectedIndex].textContent }
    opts.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return
      sel.value = b.dataset.v; sel.dispatchEvent(new Event('change', { bubbles: true })); sync()
      bar.querySelector('.dd-sort .dd-btn').click()
    })
    sync()
  }
})()
