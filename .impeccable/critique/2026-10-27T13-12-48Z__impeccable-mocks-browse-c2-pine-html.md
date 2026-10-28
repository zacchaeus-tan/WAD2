---
target: C2 pine filters browse page
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\Daryl P\\Desktop\\Y2S1\\WAD2\\TrekApp-cairn-main\\.impeccable\\mocks\\browse\\c2-pine.html"
target_fingerprint: "sha256:61b6760864f637e321d617eed5db231ab5faa1977d1cefeaa044b15fa3fab4a3"
target_path: "C:\\Users\\Daryl P\\Desktop\\Y2S1\\WAD2\\TrekApp-cairn-main\\.impeccable\\mocks\\browse\\c2-pine.html"
timestamp: 2026-10-27T13-12-48Z
slug: impeccable-mocks-browse-c2-pine-html
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 26/40 (Acceptable)
1 Status 3 (no aria-live on count) · 2 Real world 3 (hidden log scale on distance) · 3 Control 3 (drawer: no Esc/scrim, no URL state) · 4 Consistency 3 (A-Z opens on closed route) · 5 Error prevention 2 (0-count chips clickable) · 6 Recognition 3 · 7 Flexibility 2 (name-only search, limited sorts, 24-at-a-time) · 8 Aesthetic 3 (banner + pine panel compete with cards) · 9 Error recovery 2 (generic empty state) · 10 Help 2 (3.50, "—", log sliders unexplained)

## Design specificity
Grid is CAIRN-specific (real trail lines, shape-coded grades, closed stamps, Montserrat facts). Frame (photo banner + green sidebar) is generic. Community-vs-official grade under-shown.
Detector: 7 CLI findings (2 warnings, 5 advisories). low-contrast #3a4540 on pine = false positive (no such element rendered). cramped-padding on .band = false positive (gutter on .wrap). Advisories: off-token colours #d4e3db, text-shadow, #d3e5da; sizes 18px, 17px. Overlay: straggler "long." in banner paragraph (real); overused-font + cream-palette (sanctioned). Contrast all passes; no overflow.

## Priority issues
- [P0] Closed mobile drawer stays in tab order/a11y tree; no focus move, trap, Esc, scrim. Fix: dialog semantics, inert/visibility hidden when closed, focus management. (harden)
- [P1] Focus rings invisible on pine: lake ring 1.2:1 on sliders, Clear all, close; input ring 2.5:1. Fix: glacier focus everywhere in .rail; chip border ~0.6. (polish)
- [P1] Banner (clamp 460-640px) pushes results below the fold. Fix: ~300-360px, or search in banner. Note: user asked for bigger banner last round. (layout)
- [P2] 0-count chips lead to empty results; empty-state copy generic and blames distance for a typo. Fix: dim 0 chips, cause-specific copy, country search. (clarify)
- [P2] Official vs community grade not side by side (tooltip only). Fix: "Hard → Strenuous" with people icon. (clarify)

## Persona red flags
Jordan: unexplained 3.50/log sliders, opens on closed route, six filter groups. Casey: banner fills screen, drawer no tap-outside, filters lost on refresh, 24 per page. Sam: off-screen drawer focusable, invisible focus on pine, count not announced, cards read as one long string. SEA first multi-day trekker: AU/NZ long trails dominate Multi-day; 3 vs 42 days lumped; no altitude filter.

## Minor
Double spaces in "Show 247 routes"; broken-geometry plates need fallback; stamp covers trail; km sort NaN with nulls; hard-coded 247; nested scroll on sticky rail.

## Questions
Presets instead of six filter groups? Does 640px banner earn its place? Should 42-day AU walks share a grid with 3-day SEA treks?
