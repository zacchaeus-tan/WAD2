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

CAIRN reads like a well-made field index: a near-white page, ink type, heavy two-pixel rules, square edges, and numbers set like measurements. The trail is the image. Every route is shown as its own line, drawn in a heat colour on a dark photograph, so a hiker can tell an easy walk from a hard climb before reading a word. Pine marks the places where you act on the page (the filter bar, the section bar, the fit verdict, the quiz button); ink carries everything else.

The system is plain until it matters, then unmistakable. Most of a screen is ground and ink. Colour appears on purpose: heat for difficulty, pine for controls and the personal verdict, blaze for a failed check or the one key action, amber for hazards. Every redesigned page opens on a full-screen, dimmed photograph with a transparent navbar over it (a parallax cairn on browse, the route's line on detail, a cairn in a valley on sign-in, hikers on a ridge for the quiz), then settles into wide, ruled bands with lots of space between them.

There is warmth inside the strictness. The route-detail page is a walk: a plain brown trail with grass winds behind the sections and is drawn as you scroll. The gear list is a ring-bound notepad with a red margin, the reviews are a trail register, and the quiz is a climb whose checkpoint cairns are built as you reach them. These handmade touches sit inside the same square, ruled grid; they never become cartoon illustration.

**Key Characteristics:**
- Ink on near-white ground, square corners, 2px ink rules to start and end sections.
- Route lines in a four-step heat scale (green, yellow, orange, red), always paired with a grade shape and name.
- Pine for interactive bars and the fit verdict; blaze only for a failure or the single key action.
- Lato 900 for every heading; Montserrat with tabular figures for every number a hiker compares.
- Full-screen dimmed photographs under light type; drawn lines and cairns, no stock illustration or cartoon art.
- A transparent navbar on every page: light text over photo banners, dark text on light pages.
- Full-width bands; the main tools (fit, weather, gear, reviews) take most of the page width.

## Colors

Ink and ground carry the page; a forest pine runs the controls; a heat scale borrowed from trail ratings shows difficulty; blaze and amber are kept for failure and danger.

### Primary
- **Pine** (#1F5B43): the colour of doing. The sticky filter bar on browse, the sticky section bar on detail, the fit-check band, register avatars, the selected weather day, the "Take the quiz" button in the navbar, the highlight behind the chosen word on sign-in, built quiz cairns and chosen quiz answers, link text. **Pine Deep** (#174633) is the hover and open state. **Pine Mist** (#E4EFE8) is the fill of success messages.
- **Sage** (#B9D3C6): small labels on pine ("COUNTRY", "SORT"), the tint of muted text on any pine surface.
- **Lichen** (#C9D6CF): body text on ink and on dark photographs (footer copy, tile facts on dark).

### Secondary
- **Blaze** (#C2481A): failure and the single key action. A failed fit check (a solid blaze box with a white cross, ringed in **Ember** #FFB08A), the community-adjusted grade band on the dial, star ratings, the "Generate checklist" and "Generate plan" buttons, the hiker marker on the trail and on the quiz mountain, the weather chart's trailhead line. **Blaze Deep** (#9E3A14) is its hover and its colour as text.

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
- **Hazard** (#FFC94D): the warning triangle on the route banner and on weather days that have warnings. **Warning** (#8A5A00) on **Warning Mist** (#FFF4DB): altitude warnings and incident chips on light grounds.
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
- **Display** (900, clamp(48px, 8vw, 124px), 0.95, -0.04em): banner titles, the route name on detail ("Gunung Merbabu"), the quiz heading (sized min(6.2vw, 11.5vh) so it fills the space above the mountain). Balanced, max about 12–14ch. The giant vertical "Sign In" / "Register" words use 900 at clamp(72px, 15vh, 170px).
- **Headline** (900, clamp(30px, 3.6vw, 52px), 1–1.04, -0.03em): section titles ("Is this route right for you?", "Trail register").
- **Title** (900, 16px, 22px): route names on tiles (clamped to two lines), register entry names, notepad heading at 20px.
- **Body** (400, 16px, 24px): paragraphs. **Lede** (400, 18px, 28px, Granite 700, max 52ch): the sentence under a section title. Review quotes sit at 17px/26px.
- **Label** (700, 11px, +0.12em to +0.14em, uppercase): filter keys, fact labels ("DISTANCE"), country on a tile, crumbs. Granite 500 on ground, Sage on pine.
- **Data** (Montserrat 500–600, 13–15px, tabular): tile facts ("8.7 km · +2,200 m · 2 days"), dropdown counts, temperatures.
- **Data display** (Montserrat 600, clamp(32px, 4.6vw, 68px), 1, -0.02em): the four big route numbers under the detail banner, the review score (84px), the grade values on the dial key (30–32px).

### Named Rules
**The Numbers Are Montserrat Rule.** Any figure a hiker compares is Montserrat with tabular, lining figures. Numbers inside sentences stay in Lato.

**The Signed Climb Rule.** Climb is always signed (+893 m); highest point never is (3,115 m). Metric only. A missing value shows "—" with the accessible name "Not listed".

**The No Eyebrow Rule.** Headings carry themselves. Small uppercase labels name a value or a control; they never sit above a heading as a kicker.

## Layout

A content width of 1200px (1320px for the route-detail sections) inside a fluid gutter of clamp(16px, 4vw, 48px), on a 4px spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96). Sections are full-width bands; detail stops are spaced clamp(140px, 16vw, 220px) apart so the trail between them reads as distance walked. More space sits above a heading than below it. Everything works from 375px; the breakpoints in use are 480, 640, 820, 900/960 and 1100px.

**Navbar.** 63px tall plus a 2px rule, exactly `--nav-height` (4rem + 1px). Always transparent. Over a photo or the night globe (browse, route detail, sign-in, quiz, globe) it is absolutely positioned on top with paper text; on light pages it stays in the flow with ink text.

**Full-screen openings.** The browse banner and the route-detail banner are 100svh with the navbar on top. A route page always opens at its banner: the router resets scroll when you open a different route, while back and forward keep their position. The sign-in and quiz pages are a single full-screen photo with the content on top.

**Browse.** Banner, then the sticky pine filter bar directly beneath (static below 961px), then the results: filter pills and the difficulty key, a four-column tile grid (gaps 56px by 28px; three columns at 1100px, two at 820px), 24 tiles at a time with "Show more".

**Route detail.** Banner, the four route numbers, the sticky pine section bar flush beneath them, then the walked trail with the stops: fit check, grade dial, weather, plan, gear, and the full-bleed trail register last. Two-column splits collapse to one column at 900px.

**Sign-in.** Three columns: the giant vertical "Sign In" word, the 460px form in the centre, the giant vertical "Register" word. Each word stays centred on screen while the form scrolls (sticky, offset by half its own measured height) and comes to rest at the end of the form. Below 900px the two words sit side by side above the form, reading normally.

**Quiz.** On wide screens (over 900px) the page is exactly one screen tall: the heading sits large in the empty space above the left of the mountain, the mountain fills the left column, and the question panel (up to 520px) is centred on the right. Nothing scrolls at 1280×665 and larger. On phones the page stacks and scrolls.

**Globe.** The one page dressed as a hiking map: one full screen of night with faint sage contour lines behind the satellite globe and the transparent navbar on top; no footer. It opens on a dimmed, spinning globe under a large CAIRN wordmark, with a cairn built stone by stone as things load, then a wooden signpost reading "Explore the globe". Exploring brings in the route index as a trailhead notice board: a 312px paper sheet in a wooden frame with a roof and two legs running off the screen, on the left. It holds the route count, the countries as "This way to" fingerposts on one post, the "Trail blazes" difficulty key and a square Map / Satellite switch. The globe centres in the space beside it. Bottom right are a compass that follows the map's bearing (click to face north and go back to all routes) and square zoom buttons; just past the board, a GPS-style readout gives the view's position and scale. Each route is a square ink tag (its short name and grade shape in bright heat) that turns ground with a heat-ink shape on hover, and nearby routes group into outlined squares with a Montserrat count, larger from 20 routes. Hovering a tag shows its card; clicking pins it with a close button and an "Open route" plank, and a dot walks along the route's solid heat line. The card is a tilted page of field notes on Notepad, with the #E5A3A3 margin, #B8D2E6 rules and a tack: country label, full name clamped at two lines, grade and rating (or "No reviews yet"), then distance, climb, duration and highest point. It always opens clear of its tag and of the board and navbar. Opening a route flies down onto it, then fades to night under "Heading to the trailhead", the route's name and a line of trail. Below 641px the board folds into a wooden "routes · Trail board" bar along the bottom that opens as a sheet, the readout goes, and a tapped tag first glides up under the navbar so its card can hang below it. Wood is Trail (#7A5A3A) with #8D6A46 and #5C4933, on this page only.

## Elevation & Depth

Mostly flat and ruled. Depth comes from 2px ink rules, hairline row dividers, and contrast between ground, pine and night, not from shadows. Shadows are kept for things that physically float: dropdown panels, the sign-in card over its photo, section cards hovering over the walked trail, and the handmade objects (the notepad and sticky note), which also tilt slightly.

### Shadow Vocabulary
- **panel** (`box-shadow: 0 12px 32px rgb(23 32 28 / 0.18)`, token `--shadow-panel`): dropdown panels from the pine bar, the sign-in card, the phone menu.
- **stop** (`box-shadow: 0 18px 40px rgb(23 32 28 / 0.14)`, token `--shadow-stop`): section cards sitting over the trail on detail. Full-bleed stops drop it.
- **object** (`filter: drop-shadow(0 16px 24px rgb(23 32 28 / 0.18))`): the notepad (rotated -0.6deg); the sticky note uses `0 10px 18px rgb(23 32 28 / 0.15)` at +1.5deg.

### Named Rules
**The Rule Before Shadow Rule.** Separate with a rule or a fill change first. A shadow means the thing is lifted off the page, not that it is important.

## Shapes

Square everywhere: buttons, inputs, chips, tiles, panels, avatars, checkboxes and the fit marks all have 0 radius. Edges are drawn with weight instead of curvature: 2px ink for section rules, outlined buttons and switches; 1px for chips and filter pills; 1px hairlines for rows.

Round forms are reserved for natural or physical things: the trail line and grass (round caps and joins), the hiker marker, the stones of a cairn, the ring at the tip of the community needle, the notepad's binding holes, and the grade-dial arc. The pine highlight on sign-in has rough, hand-drawn edges (a jagged clip-path), not round corners. Ticks, arrows, crosses and stars are drawn SVG or clip-path shapes, never CSS border tricks or Unicode glyphs.

## Components

### Buttons
Square, uppercase, heavy (`.cairn-btn`).
- **Shape:** 0 radius, 52px tall (44px with `.is-small`), 14px Lato 700, +0.08em, uppercase, 2px border matching the fill.
- **Ink** (default): ink fill, ground text; hover turns pine.
- **Ghost** (`.is-ghost`): transparent with ink border; hover fills ink. Secondary actions ("Show more", "More details").
- **Light** (`.is-light`): paper fill, pine text, for use on pine or on dark photos.
- **Blaze** (`.is-blaze`): the one key action on a screen ("Generate checklist", "Generate plan").
- **Text link** (`.cairn-link`): ink, 700, 2px underline offset 5px; hover pine.
- **Focus:** 3px Lake outline offset 2–3px (Glacier on pine and on dark photos). Disabled: 50% opacity.

### Navbar
Transparent, 63px plus a 2px rule. Left: Home, Browse routes, Globe as 12px uppercase links, underlined when current or hovered. Centre: the square cairn mark and CAIRN, letter-spaced. Right: Profile and Log out when signed in, or a solid Sign in when not, then "Take the quiz" in pine (hover Pine Deep). Below 960px the links fold into a square menu button that opens a solid ground panel with the same links and a pine quiz button. Over photos the text, rule and mark turn paper.

### Pine bar (filters and section links)
- **Style:** full-width pine strip, sticky at the top once scrolled to. Items are separated by 1px lines at 18% paper.
- **Filter item:** 64px tall, a Sage 11px label over a white 15px bold value; the value turns Sand when a filter is set. A chevron rotates 180° when open; hover or open fills Pine Deep. Only one panel is open at a time; Escape or a click outside closes it.
- **Filters:** Country (select), Difficulty and Trip length (square checkbox options with route counts), Distance and Climb (two-handle range sliders; distance on a log scale, climb on a square scale), Sort (Name A to Z, Shortest first, Longest first, Least climb first, Most climb first; routes missing the value always go last).
- **Dropdown panel:** white, square, 18px padding, the **panel** shadow. Options are full-width square rows with a 1px Granite 300 border; the chosen one is solid ink with a drawn white tick. A footer row holds a note and an underlined "Reset".
- **Search in the bar:** once the bar sticks (wide screens only), a white square search field slides in beside Sort (0.45s, expo ease-out) and the filter buttons tighten so their values still fit.
- **Section links (detail):** Overview, Is it for you, Weather, Plan, Gear, Reviews as 13px uppercase links in #D4E3DB; the current one turns white with a 3px Sand underline. The bar sits flush under the route numbers.

### Route tile
The trail line is the picture.
- **Field:** square, a dimmed stock photo (45% opacity, saturate 0.55, brightness 0.8) on Night, with the route line in its heat colour. The four photos rotate by route name for now. Hover zooms the photo to 1.04 and lifts it to 60%.
- **Labels:** country top right (11px uppercase, lichen); grade bottom left on a ground chip, coloured heat-ink, with its shape. A community-adjusted grade adds a people icon and a Montserrat decimal (2.53) after a 1px divider.
- **Caption:** name in Lato 900 16px (two lines max, underlined on hover), then Montserrat facts in Granite 700 ("8.7 km · +2,200 m · 2 days").
- **Motion:** tiles slide to their new places when filters or sort change (layout animation) and fade in as they arrive.

### Difficulty key and filter pills
- **Key:** grade shape plus name only, 13px bold ink, top right of the results.
- **Active filter pill:** 30px, 1px ink border, transparent; hover fills ink. A drawn × removes it. "Clear all filters" follows them.

### Route banner (detail)
Full-screen dimmed photo; crumb (Routes / country), the route name in display type, then its grade (shape and label in the heat-line colour) and, when it differs, the community grade. The route line is drawn large on the right and draws itself in once. A warning triangle with its note appears under the navbar only when there is a risk: safety status caution or closed, or a community hazard of moderate or elevated. Nothing is shown for an open route with a low hazard.

### Route numbers band
Four columns under the banner: Distance, Elevation gain, Highest point, Duration. Each is an 11px label over a data-display figure that counts up, split by hairlines. No captions and no closing rule; the section bar sits directly beneath. Missing values show "—".

### Fit check
- **Band:** the pine stop. Title and verdict share one line over a 2px paper rule; the verdict shows a three-bar heat meter before its word (Comfortable, Good challenge, A stretch, Not enough information yet), with a one-line description under it.
- **Rows:** full-width, 18px text, 1px rules at 18% paper. Pass is a 30px paper box with a pine tick; fail is a 30px blaze box with a white cross and a 3px ember ring, and its row text warms to #FFD2BD; unknown is an outlined box with a question mark.
- **Warnings and states:** altitude warnings sit under the rows with a drawn triangle in #FFE7A8. Signed out, the band asks you to sign in; with no quiz answers it links to the quiz.

### Grade dial
On a sand card. A half-circle arc in the four heat steps. The official grade is a solid ink needle with an arrowhead; the community-adjusted grade is a thicker blaze band ending in a ring. Needles turn about the hub (CSS transform, origin 200px 200px) and swing in from Easy when the dial enters view (1.6s; the community needle 0.4s later). A key beside it repeats both marks with ticking Montserrat values, and a sentence explains when hikers rate the route harder or easier than its official grade.

### Weather (two lines)
One column per forecast day, with a trailhead line (blaze) and a summit line (lake) plotted through their dots on one shared scale; a line runs flat when the value does not change. The lines wipe in from the left when the chart enters view. A day with warnings shows a small hazard triangle in its corner. Days are buttons (arrow keys move between them): the selected one gets a pine header, a 12% pine wash and a 4px pine base. Under the chart: a linen summary row (date, condition, and the warnings with a warning icon, or "No warnings"), and a "More details" drawer with every forecast figure (feels like, rain by morning and afternoon, wind and gusts, UV, visibility, humidity, sunrise and sunset, summit figures) and the warnings again.

### Plan your itinerary
A pale lake card (#D6E4EC) with an outlined AI-generated tag. Form: start date, number of days, pace as a square segmented control (Relaxed, Moderate, Fast), and the blaze Generate plan button. Generated days are white cards with a 3px ink top rule, Montserrat distance, climb and hours, highlights and notes.

### Gear notepad
A ring-bound sheet in Notepad cream with a red margin and blue ruling, tilted -0.6deg, headed "{route} · pack list". Checked items get a hand-drawn blaze tick and a strike that draws across. Once saved, each item has Edit and Remove and the sheet has "+ Add item"; the add/edit form is square and white. Beside the pad: a yellow sticky note (AI-generated; adjust to your experience), the blaze Generate / Regenerate button, the Save checklist / Saved button, and the help text.

### Trail register (reviews)
Full-bleed, with 2px ink rules top and bottom. A sticky summary column: the average score in 84px Montserrat ("4.0 / 5", or "No ratings yet"), the five star bars (a placeholder for now: grey tracks with "—", see Implementation), then Felt like, Completed and Reviews figures. Beside it, the entries: a square pine initial avatar, the name and drawn stars, the date, a 17px quote, then meta (a four-step "felt" meter in ink, Completed or Did not complete, and amber incident chips). Reviews load five at a time with "Show more". "Write a review" (or "Edit your review") opens the square review form above the register.

### Sign-in
Full-screen dimmed photo of a cairn in a valley. The square card in the centre holds the fields (square inputs, uppercase labels) and the ink submit button; error and success messages are square tinted boxes. The giant vertical words on each side are the switch between Sign in and Register: the current one is solid paper on a pine highlight, the other is a 2px outline. Hover slides a word 14px away from the form, brightens its outline and opens its letter-spacing; a click gives a springy press; switching sweeps the pine highlight along the word in its reading direction (up for Sign In, down for Register).

### Quiz (the ascent)
Full-screen dimmed photo of hikers on a ridge. The five questions are stops on a trail up a drawn mountain: a faint fill fading downwards, an outlined skyline, a dashed trail, and short stop labels (Experience, Distance, Elevation, Altitude, Trip length, then Summit). The blaze hiker dot springs from stop to stop and the walked trail fills in Sand. A checkpoint shows only a dashed marker until it is reached; on arrival its cairn is built, three stones dropping in bottom first; going back topples the cairns above you, top stone first. Built cairns turn pine once their question is answered. The panel shows "Stop n of 5", the question and the answers as two-column square tiles (a pine fill slides to the chosen tile); picking an answer moves on to the next stop, including re-picking a saved answer. The summit holds a summary with "Change" links and Save answers, enabled when all five are answered. There is no progress ring.

### Footer
Ink with lichen text, four columns ("Know before you go." with a light Browse routes button; Explore; Account; Data credits for OpenStreetMap and Open-Meteo), a giant CAIRN wordmark (clamp(96px, 22vw, 330px), Lato 900) and a hairline base row. Shown on every page except the full-screen globe.

### Motion
Built with Motion for Vue (`motion-v`). One expo ease-out curve, `cubic-bezier(0.16, 1, 0.3, 1)`, for transitions; springs for things that move into place (the hiker, highlights, stones, button presses). Content is visible by default; motion only adds to it. Every effect has a `prefers-reduced-motion` fallback that shows the end state. Where it is used:
- **Scroll-linked** (`useScroll`, `useTransform`): the browse banner parallax (sky, title and mountain move at 0.6, 0.45 and 0.05 of the scroll), the walked trail on detail, the section-bar progress.
- **Layout and presence** (`layout`, `layoutId`, `AnimatePresence`): tiles re-flowing on filter, gear items and reviews arriving, the sliding pine fill on chosen quiz answers, quiz questions blurring in and out, cairns built and toppled.
- **Gestures** (`whileHover`, `whilePress`): the sign-in words.
- **In view** (`useInView`): number tickers, the grade-dial needles, the weather lines.
- **State** (`animate` bound to Vue state): the globe page's intro, cairn stones, board, camera buttons, readout, route tags and fade to night.

### Number ticker
Big Montserrat figures (route numbers, review score, dial values) count up once from zero when they enter view, over 1.2s on the expo curve, keeping tabular figures so the width never jumps. Screen readers get the final value only.

### Text highlighter
After Magic UI's Highlighter, rebuilt with Motion: a pine marker with rough hand-drawn edges sits behind the chosen word and sweeps along it in its reading direction when the choice changes. Used on the sign-in / register words. One highlight at a time.

### Animated list
Items that arrive (AI gear items after "Generate checklist", reviews as pages load) enter one at a time, 60ms apart, rising 12px with a fade; removed items collapse. Existing items never re-animate.

### Scroll progress
On route detail, a Sand bar on a dark pine track (#0F3326, 5px) runs along the bottom of the section bar and fills as you scroll through the sections. No readout. Decorative, so hidden from screen readers.

## Do's and Don'ts

### Do:
- **Do** keep every corner square (0 radius), and draw edges with 2px ink rules or 1px hairlines.
- **Do** pair every heat colour with the grade's shape and name (The Shape Beside Colour Rule).
- **Do** put bright heat lines only on Night or ink, and use heat-ink steps for text on light grounds.
- **Do** set compared numbers in Montserrat tabular figures, metric only, climb signed.
- **Do** use pine for bars and controls you act on, and blaze only for failures, ratings and the one key action.
- **Do** open redesigned pages with a full-screen dimmed photo (about 32–45% over Night) and keep the navbar transparent over it.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` and show the final state under reduced motion.
- **Do** theme focus rings: 3px Lake on light grounds, Glacier on pine and on dark photos.
- **Do** show safety warnings only when there is a risk, and never hide them behind an interaction.
- **Do** build with the CAIRN classes and scoped component styles described in Implementation.

### Don't:
- **Don't** use rounded pills, rounded cards or soft rounded panels; that is the retired homepage style.
- **Don't** add shadows to flat content at rest (The Rule Before Shadow Rule).
- **Don't** put a small uppercase kicker above a heading.
- **Don't** use blaze as decoration or as a second button colour.
- **Don't** use cartoon illustration, badges, cairn icons along the route-detail trail, or "conquer the summit" language.
- **Don't** draw ticks, arrows, crosses or stars with CSS borders or Unicode; use drawn SVG.
- **Don't** truncate route names below two lines or translate them out of their own script.
- **Don't** show an "open" status, a trip-type tag or an "Above 2,500 m" caption on route detail; they were removed on purpose.
- **Don't** invent numbers or content for placeholders (star breakdown, route photos, sample reviews); show the placeholder.

## Implementation

Notes for anyone, people or AI, building or changing pages in the Vue app.

### Stack
Vue 3 (`<script setup>`, plain JavaScript, no TypeScript), Vite, Pinia, vue-router and Supabase. Animation uses `motion-v` with `@vueuse/core` (its required companion). Fonts are Lato (400/700/900) and Montserrat (500/600) from Google Fonts, linked in `index.html`. There is no Tailwind and no UI kit: the Magic UI ideas in use (number ticker, text highlighter, animated list, blur fade) are rebuilt with Motion.

### Where the styles live
- `src/assets/cairn.css`: every token as a CSS custom property on `:root` (colours, `--font`, `--font-data`, `--gutter`, `--max`, `--ease`, `--shadow-panel`, `--shadow-stop`, `--nav-height`) and the shared classes: `.cairn` (Lato, ground, ink and margin resets for a redesigned page), `.cairn-wrap`, `.cairn-btn` with `.is-ghost` / `.is-light` / `.is-blaze` / `.is-small`, `.cairn-link`, `.cairn-input`, `.cairn-label`, `.cairn-fine`, `.cairn-data`, `.cairn-headline` and `.cairn-visually-hidden`. It is imported in `src/main.js`, after Bootstrap.
- Everything else is a `<style scoped>` block in each `.vue` file. Use the tokens (`var(--pine)`) rather than raw hex.
- A redesigned page puts `class="cairn …"` on its root element. On the globe, which is dark, the class goes on each light piece instead (the index, the route card, the intro and the dive label). Pages that are not redesigned yet (Home, Profile, Admin) do not, and keep their Bootstrap look.

### Bootstrap
Bootstrap 5 CSS still loads globally (`src/main.js`) and remains the project's base framework. The redesigned pages and components (navbar, footer, browse, route detail, sign-in, quiz, globe and their components) do not use Bootstrap classes; they use the CAIRN classes and scoped styles, because Bootstrap's defaults (rounded corners, its spacing and type scale, blue focus) fight the square Field Index look. Bootstrap's reset still sits underneath. Home and Profile still use Bootstrap classes (the globe only uses `d-none` for its hidden card holder), so Bootstrap must stay until they are redesigned.

### Pages and their parts
- `src/App.vue`: `SiteNav` (overlaid on the routes-list, route-detail, auth, quiz and globe routes) and `SiteFooter` (hidden on the globe).
- Browse, `src/views/RoutesList.vue`: `components/routes/FilterDropdown`, `RangeFilter`, `RouteTile`, `RouteLine`, and `components/common/DifficultyMark`. Filtering, sorting and paging run in the view on the routes it already loads.
- Route detail, `src/views/RouteDetail.vue`: `RouteBanner`, `RouteNumbers`, `SectionNav`, `WalkedTrail` and `GradeDial` (in `components/routes`), `components/matching/FitCheck`, `components/weather/WeatherForecast`, `components/itinerary/ItineraryForm` and `ItineraryDay`, `components/checklist/GearChecklist` and `ChecklistForm` (also used on Profile), `components/reviews/TrailRegister`, `ReviewList`, `ReviewForm`, `IncidentFields` and `ReviewSummary`, and `components/common/NumberTicker`.
- Sign-in, `src/views/AuthView.vue`: self-contained.
- Quiz, `src/views/QuizView.vue` with `components/quiz/QuizAscent` (always `compact`) and `components/quiz/quizText.js` (short stop names, answer text).
- Shared helpers: `src/lib/difficultyStyle.js` (grade colours and shapes, `gradeOf`, `isCommunityAdjusted`) and `src/lib/routeLine.js` (`geometryToPath`: a route's GeoJSON line fitted to the 400×240 box and simplified to a short SVG path).
- Route lines: tiles and the detail banner draw each route's own line with `components/routes/RouteLine`. Browse loads only the columns its filters and tiles need (`listRouteTiles()`), with `routes.line_svg`, a ready-made path for the 400×240 box, instead of the full geometry. The detail banner builds its path from `route.geometry` with `geometryToPath`. A route without either falls back to `PlaceholderLine`, which the loading tiles also use.
- `line_svg` is filled by `node scripts/build-route-line-svg.mjs`, which writes `supabase/migrations/0013_route_line_svg_data.sql` with the same `geometryToPath`. Run it again after importing or changing route lines; until then a trigger (`0012`) clears the stale preview, so those tiles show the placeholder.

### Data and logic boundaries
- Do not change controllers, models, stores or `src/lib/matching.js` for a design change without the team's agreement. Views may compute display-only values from data they already load.
- Reviews load five at a time (`REVIEWS_PAGE_SIZE` in `src/controller/reviewsStore.js`); the signed-in user's own review is loaded separately (`fetchMyReview`) so the review form works whichever page is showing.
- The fit verdict and its checks come from `checkRouteSuitability()` in `src/lib/matching.js`, the weather figures and warnings from `src/controller/weatherController.js`, and the quiz questions from `src/lib/quizQuestions.js`. The design only presents them.

### Placeholders (to replace later)
- **Star breakdown.** The five bars in the trail register are grey placeholders with "—". Planned: counts stored on the route and kept up to date by `recalc_route_stats()`, because reviews are paged.
- **Photos.** Tiles rotate four stock photos and the detail banner uses one, until each route has its own. Images live in `src/assets/img/`: `cairn1.jpg` and `cairn1-mask.png` (browse banner), `card-*.jpg` (tiles, detail banner, quiz) and `cairn-valley.jpg` (sign-in).

### Visual references
The approved mockups are static HTML in `.impeccable/mocks/`, served with `node .impeccable/mocks/serve.cjs .impeccable/mocks 5180`: `browse/routes.html`, `detail/route-detail.html`, `landing/l1-summit.html`, and the design system page `system/index.html`. Where the app and a mockup differ, the app and this file are the current truth (for example the removed trip-type tag).
