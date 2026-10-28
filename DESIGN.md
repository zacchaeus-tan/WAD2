---
name: CAIRN
description: Know if a trek suits you before you go.
colors:
  ink: "#17201C"
  ground: "#FBFAF7"
  white: "#FFFFFF"
  pine: "#1F5B43"
  pine-deep: "#174633"
  pine-mist: "#E4EFE8"
  sage: "#B9D3C6"
  lichen: "#C9D6CF"
  blaze: "#C2481A"
  blaze-deep: "#9E3A14"
  ember: "#FFB08A"
  lake: "#1E5F8C"
  glacier: "#75C5D1"
  paper: "#F2EFEA"
  linen: "#EBE7DF"
  sand: "#E4DED3"
  night: "#101814"
  granite-700: "#3A4540"
  granite-500: "#5F6B65"
  granite-300: "#C9D0CB"
  granite-200: "#E1E6E2"
  granite-100: "#EEF1EE"
  heat-1: "#6FDC8C"
  heat-2: "#F2D34F"
  heat-3: "#FF9F43"
  heat-4: "#FF5B4F"
  heat-ink-1: "#1D7A43"
  heat-ink-2: "#7A5E00"
  heat-ink-3: "#A34D00"
  heat-ink-4: "#B42318"
  hazard: "#FFC94D"
  warning: "#8A5A00"
  warning-mist: "#FFF4DB"
  trail: "#7A5A3A"
  grass: "#6F9A5C"
  notepad: "#FFFBE9"
typography:
  display:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(48px, 8vw, 124px)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 52px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.375
  body:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Lato, Noto Sans Thai, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.12em"
  data:
    fontFamily: "Montserrat, Lato, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "tnum, lnum"
  data-display:
    fontFamily: "Montserrat, Lato, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.6vw, 68px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum, lnum"
rounded:
  none: "0px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
  section: "clamp(88px, 11vw, 160px)"
  gutter: "clamp(16px, 4vw, 48px)"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 28px"
  button-ink-hover:
    backgroundColor: "{colors.pine}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 28px"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pine}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 28px"
  button-blaze:
    backgroundColor: "{colors.blaze}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    height: "52px"
    padding: "0 28px"
  button-blaze-hover:
    backgroundColor: "{colors.blaze-deep}"
  pine-bar:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    height: "64px"
  pine-bar-item-hover:
    backgroundColor: "{colors.pine-deep}"
  dropdown-panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "18px"
  filter-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "30px"
    padding: "0 6px 0 12px"
  route-tile:
    backgroundColor: "{colors.night}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  grade-label:
    backgroundColor: "{colors.ground}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "5px 8px"
  fit-band:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    padding: "clamp(24px, 3vw, 44px)"
  register-avatar:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    size: "44px"
  footer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.lichen}"
---

# Design System: CAIRN

## Overview

**Creative North Star: "The Field Index"**

CAIRN reads like a well-made field index: a near-white page, ink type, heavy two-pixel rules, square edges, and numbers set like measurements. The trail is the image. Every route is shown as its own real line, drawn in a heat colour on a dark photograph, so a hiker can tell an easy walk from a hard climb before reading a word. Pine marks the places where you act on the page (the filter bar, the section bar, the fit verdict); ink carries everything else.

The system is plain until it matters, then unmistakable. Most of a screen is ground and ink. Colour appears on purpose: heat for difficulty, pine for controls and the personal verdict, blaze for a failed check or the one key action, amber for hazards. Big photographic banners with a parallax or the route's own line open each page, then the page settles into wide, ruled bands with lots of space between them.

There is warmth inside the strictness. The route-detail page is a walk: a plain brown trail with grass winds behind the sections and is drawn as you scroll. The gear list is a ring-bound notepad with a red margin, and the reviews are a trail register. These handmade touches sit inside the same square, ruled grid; they never become cartoon illustration.

**Key Characteristics:**
- Ink on near-white ground, square corners, 2px ink rules to start and end sections.
- Route lines in a four-step heat scale (green, yellow, orange, red), always paired with a grade shape and name.
- Pine for interactive bars and the fit verdict; blaze only for a failure or the single key action.
- Lato 900 for every heading; Montserrat with tabular figures for every number a hiker compares.
- Dark, desaturated photographs under light lines; real route geometry, no stock illustration.
- Full-width bands; the main tools (fit, weather, gear, reviews) take most of the page width.

## Colors

Ink and ground carry the page; a forest pine runs the controls; a heat scale borrowed from trail ratings shows difficulty; blaze and amber are kept for failure and danger.

### Primary
- **Pine** (#1F5B43): the colour of doing. The sticky filter bar on browse, the sticky section bar on detail, the fit-check band, register avatars, the selected weather day, link text. **Pine Deep** (#174633) is the hover and open state of a bar item. **Pine Mist** (#E4EFE8) tints the "within stretch" zone and the open-status halo.
- **Sage** (#B9D3C6): small labels on pine ("COUNTRY", "SORT"), the tint of muted text on any pine surface.
- **Lichen** (#C9D6CF): body text on ink and on dark photographs (footer copy, tile facts on dark).

### Secondary
- **Blaze** (#C2481A): failure and the single key action. A failed fit check (a solid blaze box with a white cross, ringed in **Ember** #FFB08A), the community-adjusted grade band on the dial, star ratings, the "Generate checklist" button, the hiker marker on the trail. **Blaze Deep** (#9E3A14) is its hover and its colour as text.

### Tertiary
- **Heat scale**, for route lines on dark grounds: **Heat 1** Easy (#6FDC8C), **Heat 2** Moderate (#F2D34F), **Heat 3** Hard (#FF9F43), **Heat 4** Strenuous (#FF5B4F). The same steps fill the verdict meter (Comfortable 1 green bar, Good challenge 2 yellow, Stretch 3 orange).
- **Heat ink**, the readable version of each step for text on light labels: **Heat Ink 1** (#1D7A43), **Heat Ink 2** (#7A5E00), **Heat Ink 3** (#A34D00), **Heat Ink 4** (#B42318).
- **Lake** (#1E5F8C): focus rings on light grounds and the summit line in the weather chart. **Glacier** (#75C5D1): focus rings and input glow on pine.

### Neutral
- **Ink** (#17201C): all text, 2px rules, the solid button, the footer, selected chips and sort options.
- **Ground** (#FBFAF7): the page. Also the label chip on photo tiles.
- **White** (#FFFFFF): dropdown panels, search inputs, the comparison card.
- **Paper** (#F2EFEA), **Linen** (#EBE7DF), **Sand** (#E4DED3): quiet section fills (sand behind the grade dial, linen behind the selected-day summary), and the light button on pine.
- **Night** (#101814): the base under every dimmed route photograph.
- **Granite 700** (#3A4540): secondary text and facts. **Granite 500** (#5F6B65): small labels on ground, dates, axis ticks. **Granite 300 / 200 / 100**: option borders, hairline dividers between rows, empty bar tracks.
- **Hazard** (#FFC94D): the warning triangle and its heading on the banner. **Warning** (#8A5A00) on **Warning Mist** (#FFF4DB): altitude warnings and incident chips on light grounds.
- **Trail** (#7A5A3A) and **Grass** (#6F9A5C): the walked trail and its tufts on the detail page. **Notepad** (#FFFBE9): the gear sheet, with a #E5A3A3 margin and #B8D2E6 ruling.

### Named Rules
**The Shape Beside Colour Rule.** Heat colour never stands alone. Every grade shows its shape (circle, square, diamond, double diamond) and its name, and every pass or fail shows a tick or a cross in a box.

**The Two Heats Rule.** Bright heat (#6FDC8C to #FF5B4F) only sits on night or ink. On ground or white, use the heat-ink step for text and labels.

**The Blaze Means Stop Rule.** Blaze marks a failed check, a rating, or the one key action on a screen. It is never decoration and never a second button colour.

## Typography

**Display Font:** Lato (with Noto Sans Thai, system-ui)
**Body Font:** Lato
**Data Font:** Montserrat, tabular and lining figures

**Character:** Lato at 900 weight gives headings a heavy, carved, signpost quality; at 400 it stays warm and readable. Montserrat is a measuring voice: it appears only where figures are compared, so numbers line up in columns and read as data rather than prose.

### Hierarchy
- **Display** (900, clamp(48px, 8vw, 124px), 0.95, -0.04em): banner titles, the route name on detail ("Gunung Merbabu"). Balanced, max about 12–14ch.
- **Headline** (900, clamp(30px, 3.6vw, 52px), 1–1.04, -0.03em): section titles ("Is this route right for you?", "Trail register").
- **Title** (900, 16px, 22px): route names on tiles (clamped to two lines), register entry names, notepad heading at 20px.
- **Body** (400, 16px, 24px): paragraphs. **Lede** (400, 18px, 28px, Granite 700, max 52ch): the sentence under a section title. Review quotes sit at 17px/26px.
- **Label** (700, 11px, +0.12em to +0.14em, uppercase): filter keys, fact labels ("DISTANCE"), country on a tile, crumbs. Granite 500 on ground, Sage on pine.
- **Data** (Montserrat 500–600, 13–15px, tabular): tile facts ("8.7 km · +2,200 m · 2 days"), dropdown counts, temperatures.
- **Data display** (Montserrat 600, clamp(32px, 4.6vw, 68px), 1, -0.02em): the four big route numbers under the detail banner, the review score (84px), the grade values on the dial key (30–32px).

### Named Rules
**The Numbers Are Montserrat Rule.** Any figure a hiker compares is Montserrat with tabular, lining figures. Numbers inside sentences stay in Lato, except the highlighted values in the fit sentence.

**The Signed Climb Rule.** Climb is always signed (+893 m); highest point never is (3,115 m). Metric only. A missing value shows "—" with the accessible name "Not listed".

**The No Eyebrow Rule.** Headings carry themselves. Small uppercase labels name a value or a control; they never sit above a heading as a kicker.

## Layout

A content width of 1200px (1320px for the route-detail sections) inside a fluid gutter of clamp(16px, 4vw, 48px), on a 4px spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96). Sections are full-width bands with vertical padding of clamp(88px, 11vw, 160px); detail stops are spaced clamp(140px, 16vw, 220px) apart so the trail between them reads as distance walked. More space sits above a heading than below it.

Each page opens on a tall photographic banner (clamp(600px, 88vh, 800px) on browse with a three-layer parallax; clamp(600px, 86vh, 820px) on detail with the route's own line drawn large on the right). A sticky pine bar follows directly beneath with no gap: filters on browse, section links on detail.

Browse is a four-column tile grid (gaps 56px by 28px) that drops to three at 1100px, two at 820px. Detail stacks wide stops: a four-column numbers band, then fit, grade, weather, plan, gear and a full-bleed register. Two-column splits (copy beside a demonstration) collapse to one column at 900–960px. The sticky bars become static below 961px. Everything works from 375px.

## Elevation & Depth

Mostly flat and ruled. Depth comes from 2px ink rules, hairline row dividers, and contrast between ground, pine and night, not from shadows. Shadows are kept for things that physically float: dropdown panels over the page, section cards hovering over the walked trail, and the handmade objects (the notepad and sticky note), which also tilt slightly.

### Shadow Vocabulary
- **panel** (`box-shadow: 0 12px 32px rgb(23 32 28 / 0.18)`): dropdown panels from the pine bar.
- **stop** (`box-shadow: 0 18px 40px rgb(23 32 28 / 0.14)`): section cards sitting over the trail on detail. Full-bleed stops drop it.
- **object** (`filter: drop-shadow(0 16px 24px rgb(23 32 28 / 0.18))`): the notepad (rotated -0.6deg); the sticky note uses `0 10px 18px rgb(23 32 28 / 0.15)` at +1.5deg.

### Named Rules
**The Rule Before Shadow Rule.** Separate with a rule or a fill change first. A shadow means the thing is lifted off the page, not that it is important.

## Shapes

Square everywhere: buttons, inputs, chips, tiles, panels, avatars, checkboxes and the fit marks all have 0 radius. Edges are drawn with weight instead of curvature: 2px ink for section rules, outlined buttons and switches; 1px for chips and filter pills; 1px hairlines for rows.

Round forms are reserved for natural or physical things: the trail line and grass (round caps and joins), the hiker marker, the ring at the tip of the community needle, the notepad's binding holes, and the grade-dial arc. Ticks, arrows and crosses are drawn SVG or clip-path shapes, never CSS border tricks or Unicode glyphs.

## Components

### Buttons
Square, uppercase, heavy.
- **Shape:** 0 radius, 52px tall (44px in compact rows), 14px Lato 700, +0.08em, uppercase, 2px border matching the fill.
- **Ink:** ink fill, ground text; hover turns pine. The default action.
- **Ghost:** transparent with ink border; hover fills ink. Secondary actions ("Show more").
- **Light:** paper fill, pine text, for use on pine bands.
- **Blaze:** the one key action on a screen ("Generate checklist").
- **Text link:** ink, 700, 2px underline offset 5px; hover pine.
- **Focus:** 3px Lake outline offset 2–3px (Glacier on pine).

### Pine bar (filters and section links)
- **Style:** full-width pine strip, sticky at the top once scrolled to. Items are separated by 1px lines at 18% paper.
- **Filter item:** 64px tall, a Sage 11px label over a white 15px bold value; the value turns Sand when a filter is set. A chevron rotates 180° when open; hover or open fills Pine Deep.
- **Dropdown panel:** white, square, 18px padding, the **panel** shadow. Options are full-width square rows with a 1px Granite 300 border; the chosen one is solid ink with a drawn white tick. A footer row holds the count and an underlined "Clear".
- **Search in the bar:** once stuck, a white square search field slides in beside Sort (0.45s, expo ease-out) with a Glacier glow on focus.
- **Section links (detail):** 13px uppercase links in #D4E3DB; the current one turns white with a 3px Sand underline.

### Route tile
The trail line is the picture.
- **Field:** square, a dimmed photo (45% opacity, saturate 0.55, brightness 0.8) on Night, with the route's real line in its heat colour. Hover zooms the photo to 1.04 and lifts it to 60%.
- **Labels:** country top right (11px uppercase, lichen); grade bottom left on a ground chip, coloured heat-ink, with its shape. A community-adjusted grade adds a people icon and a Montserrat decimal (2.53) after a 1px divider.
- **Caption:** name in Lato 900 16px (two lines max, underlined on hover), then Montserrat facts in Granite 700.
- **Closed route:** photo turns greyscale.

### Difficulty key and filter pills
- **Key:** grade shape plus name only, 13px bold ink, top right of the results.
- **Active filter pill:** 30px, 1px ink border, transparent; hover fills ink. A drawn × removes it.

### Route numbers band
Four columns under the detail banner, each a label over a data-display figure, split by hairlines and closed with a 2px ink rule. A caption under each figure adds context ("Day hike" as an ink tag, "Above 2,500 m").

### Fit check
- **Band:** the pine stop. Title and verdict share one line over a 2px paper rule; the verdict shows a three-bar heat meter before its word.
- **Rows:** full-width, 18px text, 1px rules at 18% paper. Pass is a 30px paper box with a pine tick; fail is a 30px blaze box with a white cross and a 3px ember ring, and its row text warms to #FFD2BD.
- **Warning:** altitude risk sits under the rows with a drawn triangle in #FFE7A8.

### Grade dial
A half-circle arc in the four heat steps. Official grade is a solid ink needle with an arrowhead; community-adjusted is a thicker blaze band ending in a ring. Needles swing in when the section enters view (1.6s, expo ease-out). A key beside it repeats both marks with Montserrat values.

### Weather (two lines)
Seven day columns with a trailhead line and a summit line plotted through their dots (flat when the value does not change). Days are buttons: the selected one gets a pine header, a 12% pine wash and a 4px pine base. A linen summary row and a "More details" drawer (ink-bordered, grid-rows reveal) follow.

### Gear notepad
A ring-bound sheet in Notepad cream with a red margin and blue ruling, tilted -0.6deg. Checked items get a hand-drawn blaze tick and a strike that draws across. A yellow sticky note and the Generate (blaze) and Save (ink) buttons sit beside it.

### Trail register (reviews)
Full-bleed, closed in 2px ink. A sticky summary column (an 84px Montserrat score, blaze star-distribution bars, finish facts) beside stacked entries: a square pine initial avatar, name and stars, a 17px quote, then meta (a five-step "felt" meter in ink, finished or turned back, and amber incident chips). Filter chips are 1px ink outlines that fill ink when pressed. Sample entries carry a small outlined "Sample" tag.

### Footer
Ink with lichen text, four columns, and a giant CAIRN wordmark (clamp(96px, 22vw, 330px), Lato 900) above a hairline base row.

### Motion
Built with Motion (`motion-v` in Vue). One expo ease-out curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for everything. Content is visible by default; motion only adds to it (rise from 28px, lines drawing in, needles swinging, the trail walking with the scroll). Every effect has a `prefers-reduced-motion` fallback that shows the end state.

### Number ticker
Big Montserrat figures (route numbers, review score, dial values) count up once from zero when they enter view, over about 1.2s on the expo curve, keeping tabular figures so the width never jumps. The real value is in the markup; the count is decoration, and screen readers get the final value only.

### Text highlighter
One phrase in a sentence gets a marker underline (4px, offset 6px) that draws from left to right when it enters view: the verdict word in the fit sentence uses Heat 2 yellow; a failed figure uses a blaze fill. Never more than one highlight per paragraph.

### Animated list
Items that arrive (AI gear items after "Generate checklist", register entries after a filter) enter one at a time, 60ms apart, rising 12px with a fade; removed items collapse their height. Existing items never re-animate.

### Scroll progress
On route detail, a 3px Sand bar along the bottom of the pine section bar fills as you walk down the route, tied to the same scroll range as the trail. At the bar's right end a Montserrat readout ("4.2 / 10.01 km", Sage label "Walked") converts that progress into the route's own distance. Decorative: hidden from screen readers; under reduced motion it still tracks scroll but without smoothing.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0 radius), and draw edges with 2px ink rules or 1px hairlines.
- **Do** pair every heat colour with the grade's shape and name (The Shape Beside Colour Rule).
- **Do** put bright heat lines only on Night or ink, and use heat-ink steps for text on light grounds.
- **Do** set compared numbers in Montserrat tabular figures, metric only, climb signed.
- **Do** use pine for bars and controls you act on, and blaze only for failures, ratings and the one key action.
- **Do** dim route photographs (about 45% over Night) so the line always reads first.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` and show the final state under reduced motion.
- **Do** theme focus rings: 3px Lake on light grounds, Glacier on pine.

### Don't:
- **Don't** use rounded pills, rounded cards or soft rounded panels; that is the retired homepage style.
- **Don't** add shadows to flat content at rest (The Rule Before Shadow Rule).
- **Don't** put a small uppercase kicker above a heading.
- **Don't** use blaze as decoration or as a second button colour.
- **Don't** use cartoon illustration, badges, cairn icons along the trail, or "conquer the summit" language.
- **Don't** draw ticks, arrows or crosses with CSS borders or Unicode; use drawn SVG.
- **Don't** truncate route names below two lines or translate them out of their own script.
