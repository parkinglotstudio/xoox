---
name: DEAD GRID
description: A live voxel evacuation street with restrained survival instrumentation.
colors:
  petrol: "#142525"
  ink: "#eee8d3"
  display-ivory: "#eee7ca"
  safety-orange: "#f2a15b"
  safety-orange-hover: "#ffb974"
  experience-sage: "#87d7c0"
  experience-track: "#82cdb6"
  panel-sage: "#192f25"
  picker-sage: "#142b25"
  upgrade-sage: "#20372b"
  upgrade-hover: "#304b35"
  muted-sage: "#adbca3"
  world-petrol: "#1d3637"
  world-fog: "#243e3b"
typography:
  display:
    fontFamily: "Barlow Condensed, Impact, Arial Narrow, sans-serif"
    fontSize: "clamp(100px, 13.7vw, 207px)"
    fontWeight: 800
    lineHeight: 0.78
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "16px"
    lineHeight: 1.7
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "14px"
    letterSpacing: "0.12em"
rounded:
  straight: "0px"
  keycap: "3px"
  touch: "50%"
components:
  button-primary:
    backgroundColor: "{colors.safety-orange}"
    textColor: "#142520"
    rounded: "{rounded.straight}"
    padding: "16px 23px"
  button-primary-hover:
    backgroundColor: "{colors.safety-orange-hover}"
    textColor: "#10231e"
  button-start:
    backgroundColor: "{colors.safety-orange}"
    textColor: "#142520"
    rounded: "{rounded.straight}"
    padding: "18px 24px"
    width: "247px"
  button-secondary:
    textColor: "#c8d2b6"
    rounded: "{rounded.straight}"
    padding: "14px 22px"
  upgrade-card:
    backgroundColor: "{colors.upgrade-sage}"
    textColor: "#dfe1c4"
    rounded: "{rounded.straight}"
    padding: "20px 23px 0"
  survivor-picker:
    backgroundColor: "{colors.picker-sage}"
    rounded: "{rounded.straight}"
    padding: "30px"
    width: "min(1060px, calc(100vw - 40px))"
  modal-panel:
    backgroundColor: "{colors.panel-sage}"
    rounded: "{rounded.straight}"
    padding: "36px 40px"
  rescue-objective:
    textColor: "{colors.ink}"
    rounded: "{rounded.straight}"
    padding: "10px 0"
  rescue-objective-healing:
    textColor: "{colors.experience-sage}"
  rescue-objective-urgent:
    textColor: "{colors.safety-orange}"
---

# Design System: DEAD GRID

## Overview

**Creative North Star: "Evacuation Street Planning"**

The city is the primary visual surface: a live, orthographic cubic world of ruined buildings, crosswalks, abandoned cars, barricades, and zombie silhouettes. Petrol darkness and dusty sage concrete make warm typography and safety signals legible. The interface feels like mission wayfinding laid over an active street, with a large condensed title and quiet field instrumentation.

The implemented world uses TypeScript, Vite, React Three Fiber, and instanced box geometry. `concept.png` is the aesthetic and composition reference; its density and illustrated detail differ from the live geometry. `screenshots/desktop.jpg` and `screenshots/mobile.jpg` record the earlier menu compositions; `.impeccable/review/desktop.jpg` and `.impeccable/review/mobile.jpg` record the current survivor picker. Preserve their hierarchy and atmosphere without treating either screenshot or concept as a pixel-equality target. The code is the source of truth for current values and behavior.

**Key Characteristics:**

- Live voxel geometry remains visually dominant.
- Large ivory title, orange start action, and restrained sage instrumentation.
- Straight panel edges, thin rules, and small monospaced operational labels.
- Desktop keyboard movement and mouse-directed automatic attacks, with a secondary mobile virtual stick and movement-direction aiming.

## Colors

A muted petrol and sage environment carries warm ivory reading surfaces and rare, purposeful orange signals. Frontmatter values are extracted from the implementation, replacing the earlier directional palette.

### Primary

- **Safety Orange:** start and primary actions, title punctuation, mission timer, selected survivor borders, wave labels, and evolution emphasis. Its lighter hover variant marks an actionable response.

### Secondary

- **Experience Sage:** completion and progress cues, including completed boss markers. The experience bar uses its own slightly darker track-fill token; live experience drops use related mint tones.

### Neutral

- **Petrol:** the root surface and dark atmospheric frame.
- **Ink / Display Ivory:** UI text and the large title respectively.
- **Panel Sage / Upgrade Sage:** readable overlay surfaces that remain part of the city palette.
- **Picker Sage:** the centered survivor panel, its sticky launch footer, and the scrollbar track share this darker surface.
- **Muted Sage:** supporting overlay copy and secondary information.
- **World Petrol / World Fog:** the R3F background and distance atmosphere. City materials extend this family with desaturated concrete, vegetation, rust, and asphalt.

**The Signal Rule.** Use orange to direct action or mark consequential state; let petrol and sage carry the surrounding surface.

**The Rescue State Rule.** Keep the rescue HUD and minimap signal ivory at rest, sage while treating, and orange below 20% patient health when treatment is inactive. Pair color with the medical cross, written status, and health information.

## Typography

**Display Font:** Barlow Condensed, with Impact, Arial Narrow, and sans-serif fallbacks.  
**Body Font:** Noto Sans KR, with sans-serif fallback.  
**Label/Mono Font:** IBM Plex Mono, with monospace fallback.

All three families are bundled under `public/fonts/` and loaded through local `@font-face` rules with `font-display: swap`. The project includes glyph subsets and SIL Open Font License files. No external font request is needed at runtime; new copy must retain coverage in the bundled subsets or use the fallback stack.

The pairing combines a tall, dense Latin wordmark, clear Korean gameplay copy, and compact operational numerals. Player-facing instructions and descriptions use Korean; the title, sector identifiers, and brief field labels use Latin lettering.

### Hierarchy

- **Display:** the frontmatter display role is the two-line menu title. The second line has a small interline gap (9px); the orange period is part of the wordmark. There is no additional eyebrow above this title.
- **Headline:** overlay headings use the frontmatter headline role. The survivor picker heading is 32px, reduced to 27px at its mobile breakpoint; its selected survivor name is 34px, reduced to 28px. Narrow portrait modal headings use 28px and result headings use 34px.
- **Title:** upgrade names use the title role. Menu tagline copy is medium-weight Korean text (22px, line-height 1.55), reduced on smaller viewports.
- **Body:** overlay prose, upgrade descriptions, guide content, and survivor biographies retain readable 16px text. Compact landscape upgrade descriptions use 14px; research descriptions use 15px on desktop and 14px at the picker mobile breakpoint.
- **Label:** operational kickers use the monospaced label role. Most supporting field labels use 12–14px; compact survivor card labels and stat captions use 11px on mobile. Keyboard caps use the mono family and a thin border.
- **Numerals:** the mission timer uses condensed type (66px desktop), the gameplay timer uses 60px desktop and 40px narrow portrait, and counters use mono or condensed type according to prominence. Survivor health and speed use mono numerals (24px desktop, 20px mobile).

The rescue HUD uses a compact status hierarchy rather than overlay body sizing: desktop title (16px), distance and health/countdown data (14px), and secondary treatment instruction (13px). At the mobile/tablet breakpoint the title is 14px, data is 13px, and the instruction is 12px. Distance uses mono numerals; health and time use tabular numerals. Idle run counts and the narrow-menu cumulative count use 14px. These intentional HUD steps keep the right-side field panel subordinate to the city; guide and result copy retain their larger reading roles.

**The Hierarchy Rule.** Keep the title and final-contact time prominent; supporting labels remain compact and quiet rather than competing with the playfield.

## Layout

The app fills the viewport (100dvh), hides page overflow, and places the R3F canvas beneath absolute-positioned UI. The desktop menu places the title/action block at the left (5.4%), the mission briefing at the right (4%), and a compact controls summary at the bottom. Starting opens a centered survivor picker over the dimmed city. The central intersection and player silhouette retain open space. The player has a dark contact shadow and no emissive floor plate. The top bar is a narrow horizontal row with branding left and utility actions right.

Gameplay replaces the menu composition with perimeter instrumentation: health upper-left, timer upper-center, kills upper-right, minimap and wave information right, loadout lower-left, and abilities lower-right. The experience bar runs along the bottom edge. Notices and boss status temporarily enter the upper center; overtime combat guidance appears below boss status.

The rescue objective sits directly below the minimap and above wave information, using thin rules rather than another filled card. Desktop menus place the cumulative rescue count in the existing mission panel. At most 800px, a compact inline count appears below the start copy. Narrow portrait rescue instrumentation widens the field panel to 128px while using a 100px minimap, preserving space for readable status lines. Short viewports at most 610px hide only the secondary treatment instruction and tighten the objective spacing; status, distance, health, and time remain visible.

### Responsive behavior

- **Wide desktop (from 1600px):** title grows to 240px; the briefing gains space. The survivor picker remains capped at 1060px.
- **Compact desktop (at most 1100px):** side margins contract; briefing width narrows. At most 1050px, the picker choice column contracts from 300px to 240px and internal gaps narrow.
- **Tablet and mobile (at most 800px):** utility text becomes icon-only and the title uses a narrower clamp. HUD panels, minimap, and loadout shrink while the scene remains full-viewport. At most 760px, the picker stacks its three choices above the portrait and dossier, uses 20px padding, and retains a compact bottom controls summary in the menu.
- **Narrow portrait (at most 520px):** the title uses `clamp(110px, 29vw, 145px)` and the compact briefing sits above the bottom controls summary. Upgrade choices become a vertical list of compact horizontal cards, with the icon at the left. At most 390px, the picker portrait sits above the biography and stats in a single column. The picker has one internal scroll region and a sticky launch footer, so the action stays available as details scroll.
- **Short viewports:** desktop heights at most 760px compress the menu and picker portrait, spacing, and padding. Mobile/tablet heights at most 610px reduce title and footer height, restore three upgrade columns, lower modal padding, and move touch controls upward from the bottom margin.
- **Coarse pointers:** gameplay shows a bottom-left virtual stick and bottom-right action buttons; the keyboard ability HUD is hidden. This depends on pointer capability rather than width alone.

Panels use practical 12–42px padding and narrow gaps; thin separators establish rhythm. Overlays permit internal scrolling, with the settings/guide panel capped at 90dvh or 92dvh on narrow portrait layouts. The picker is capped at the viewport minus 48px on desktop or 24px on mobile, with a sticky footer; short desktop layouts use compact spacing. These are viewport game compositions rather than a scrolling page or generic card grid.

## Elevation & Depth

Gameplay has a 17m line-of-sight field blocked by intact building hulls. Unexplored terrain is black; explored terrain outside current sight is dimmed to 20%. Enemies and automatic targeting respect sight, and the minimap remembers terrain without revealing unseen enemies. The gameplay orthographic vertical span is 33 units on desktop and 32 on narrow screens. Visible actors and supply boxes occluded from the camera receive depth-tested cubic edge outlines; they do not reveal enemies beyond player sight. Enemy and damaged building health bars billboard toward the camera. Buildings collapse into low, scattered rubble and lose collision and line-of-sight blocking.

Most depth comes from the real cubic scene: orthographic projection, directional lighting, soft fog, material tone, and contact shadows. The camera follows the player smoothly from an elevated diagonal view. High graphics quality enables scene shadows and DPR up to 1.6; low quality disables scene shadows and uses DPR 1.

UI surfaces use translucent dark fills, top rules, and tonal separation. The menu vignette darkens the edges and title area while preserving the center of the city. Overlays dim the full scene and apply a small blur (5px). There is no general drop-shadow card system. The survivor picker uses one structural dark panel shadow (0 20px 60px #0008), while its individual choice cards remain flat. The title has a subtle dark drop shadow; small status dots have a restrained warm glow. Upgrade hover creates temporary lift (5px upward).

## Shapes

Cubic geometry defines buildings, actors, projectiles, debris, and many effects. Panels, survivor choices, upgrade cards, primary buttons, and the picker launch footer have straight corners. Thin top or bottom rules mark structure and selection. Small keyboard caps are the limited rounded UI detail (3px).

Touch controls are the deliberate circular exception: a 112px stick with a 40px knob, plus 56px shockwave and 65px dodge buttons. The stick contracts to 90px on short mobile viewports. Circular world contact shadows and segmented ring effects coexist with the cubic objects; do not force every effect into a rectangular UI silhouette.

## Components

### Buttons and utility navigation

Primary buttons use safety orange with dark text and a default minimum height of 54px; the picker launch action uses 50px. The menu start variant has larger Korean text and a directional arrow; its desktop width is 247px. Hover brightens the fill, active moves the button down 1px, and disabled actions become translucent with a non-action cursor. Secondary actions use a thin sage outline and a faint sage hover fill. Text and icon utilities remain lightweight in the top bar.

Buttons, links, and selects receive an orange visible-focus outline (2px with 5px offset); survivor cards use their warm focus variant (2px with 3px offset). General color, background, and transform transitions last 0.18s. Icon-only mobile utilities retain accessible labels.

### Mission briefing and survivor picker

The briefing is a translucent, straight-edged panel with a thin sage top rule, condensed orange final-contact timer, and sparse divided facts. Its colon blinks on a two-second step animation. Difficulty is a two-option segmented control with a light sage selected state.

The menu start action opens a centered, straight-edged survivor dialog. Desktop places a two-column grid of three portrait cards on the left and the selected portrait and dossier on the right. Each card shows role, name, and actual starting weapon. Selection uses a warm border, sage fill, checkmark, and `aria-pressed`; hover lightens the border and keyboard focus uses a separate warm outline. Selecting a card updates the politely announced biography, base health, movement speed, unique trait, starting weapon description, and named launch action without starting combat.

The local portrait atlas (`public/portraits/survivors-v14.png`) supplies the same voxel illustrations to thumbnails and the large selected portrait. Biographies are fictional product copy; stats and weapons come from the playable character data. On mobile the three cards remain visible above the detail area; narrow portrait stacks the large portrait above its dossier. A sticky footer pairs the 30-minute/six-boss mission condition with the orange survivor-named launch button.

### Gameplay instrumentation

The upper-left survivor profile reuses the selected illustration atlas with an individually positioned 240px square face crop. It displays at 64px on desktop, 40px on tablet and 36px/32px on narrow screens; the portrait stays visible on mobile without overlapping the timer.

Health and experience are thin horizontal tracks, with numeric health and level close to the track. Weapon slots use compact icons, level pips, and lower-border emphasis; evolution changes the slot to orange. The minimap shows current enemies and supply markers with smooth exploration shading. Preserve perimeter placement and keep status panels out of the player's movement center.

### Survivor rescue signals

The medical objective extends the existing right-side field instrumentation. Its header pairs a heart-pulse icon with “구조 신호” or “치료 중” and distance; a thin health track (5px) precedes patient health and either bleeding time or time until rescue. A short instruction explains the 3m approach or asks the player to remain in range. With no wounded patient, the same slot becomes a quiet heart icon and current-run rescue count. The health track has an accessible progressbar name and numeric value; status also remains written in Korean.

The minimap uses an outlined medical cross on a petrol disc. This signal remains visible in unexplored terrain and outside current sight. When the patient is beyond the map radius, it pins to the edge and adds a rotated direction arrow; its tooltip includes health, distance, and the off-map state. This exception guides exploration while enemies and supplies keep their existing visibility rules. Ivory, sage, and orange match the HUD state treatment.

World cues remain attached to the patient: a seated, bandaged voxel pose, a segmented treatment boundary (3m radius), a camera-facing health bar and medical cross. The boundary and health cue shift from a muted warm tint to sage during treatment. Small green crosses rise above the patient only; reduced motion replaces their rise with one fixed small cross. Rescued patients stand and run along the road to the perimeter. These cues share the existing instanced voxel, outline, and health-bar rendering grammar and respect world sight.

The menu uses a heart icon and the written cumulative rescue count. Desktop places it in a divided mission row; narrow/mobile uses a sage inline line below the start copy. Results pair the current-run count with a muted cumulative count in one divided row that may wrap. Guide copy explains the cross, proximity treatment, restored health, and reward; pause copy states that rescue totals persist when combat progress is discarded.

### Upgrade choices

Consequential build decisions pause gameplay and show three selectable choices. Desktop cards have sage fills, top rules, a large icon, Korean name, level, effect text, evolution recipe when relevant, and numbered keyboard caps. Hover lifts and brightens the card. Passive cards retain their rarity-colored top rule; keyboard focus remains a separate orange outline. Evolution choices use a warmer surface and orange rule. Narrow portrait layout retains the choice number and description while removing the separate footer action line.

### Persistent research

The research overlay uses seven divided rows: 생존 프로토콜, 충격파 제어, 회피 훈련, 무기 정비, 회수 센서, 전투 분석, and 기동 훈련. Each row pairs a small icon with its name, current/max rank, per-rank effect, progress pips, and an outlined resource-price action. The balance remains prominent above the list and the footer states that purchases apply from the next launch. Completed or unaffordable actions are disabled; completion is also written as text.

Prices are `base + current rank × step`: protocol, shockwave, damage, and experience start at 10 resources and rise by 6; dodge starts at 12 and rises by 8; pickup and movement start at 8 and rise by 5. Protocol has ten ranks; the other rows have five. Shockwave and dodge descriptions explicitly state a 6% cooldown reduction per rank for Q and Space. On mobile, row gaps and action widths contract while descriptions and rank labels stay readable.

### Overlays, settings, and guide

Pause, upgrade, result, guide, research, survivor selection, and settings views use dimmed scene overlays. Settings and guide panels scroll within viewport limits. Settings use rectangular toggles and a native select; active toggles become light sage. Guide tabs use an orange bottom rule for selection.

An open overlay focuses its first enabled visible control, makes background app siblings inert, contains Tab and Shift+Tab navigation, and restores prior focus when closed. Dialogs declare their modal role and accessible name. Preserve this behavior as panels change. Escape closes auxiliary modals or toggles pause; hiding the page or losing window focus also pauses active play and clears movement input.

### Controls, motion, and sound

PC movement uses WASD or arrow keys; Space dodges, Q triggers shockwave, M toggles sound, Enter opens survivor selection from the menu, and 1–3 chooses an upgrade. Combat fires automatically toward the mouse direction independently of movement; the visible ground reticle and crosshair cursor communicate aiming. With no mouse aim, including mobile play, attacks follow movement direction. The mobile stick captures its active pointer, limits knob displacement to 40px, and resets movement on release/cancellation; two touch buttons provide shockwave and dodge. Keyboard and touch ability taps remain queued until the next simulation frame consumes them, so short taps trigger reliably.

Directional weapons have distinct visible grammar: the katana traces a pale segmented sweep and blade, the sniper shows a thin warm aiming line ending at cover or range, and the flamethrower sends a warm cubic cone that stops at solid structures. Burning enemies carry flickering orange cubes and small stack markers above them; burning structures also show flame cubes. These cues remain understandable with sound off and respect player visibility.

UI motion is brief: overlays fade in over 0.2s, notices enter over 0.3s, and card/button motion signals interaction. Reduced motion initializes from the system preference and can be changed in settings; it disables CSS animation/transitions and damage camera shake. It preserves camera following and gameplay animation, including moving entities and pickups.

Atmosphere and action cues are synthesized locally with Web Audio oscillators and noise. Audio unlocks after interaction; the same sound setting is available in the top bar and settings. Keep audio cues secondary to visible state so muted play remains understandable.

## Do's and Don'ts

### Do:

- **Do** preserve the live voxel city as the main content and keep the active movement center legible.
- **Do** use orange for actions and consequential states, with ivory reading text over petrol and sage surfaces.
- **Do** preserve straight panel edges, sparse separators, and condensed/mono/Korean type roles.
- **Do** keep overlays keyboard-contained and retain visible focus, accessible names, and touch input cancellation.
- **Do** honor graphics and reduced-motion settings and serve the bundled fonts locally.
- **Do** keep rescue guidance in the perimeter HUD, use text and health information alongside state colors, and attach treatment effects to the patient.

### Don't:

- **Don't** replace the R3F scene with the concept image or claim pixel equality with its illustrated density.
- **Don't** add competing title eyebrows or decorative labels that weaken the current menu hierarchy.
- **Don't** spread rounded cards, heavy UI shadows, or orange fills across the whole playfield.
- **Don't** bury consequential upgrade choices in motion or allow background controls to take overlay focus.
- **Don't** turn compact mobile controls into a width-only feature; coarse-pointer support is part of the implemented behavior.

## 1.2 legibility and world visibility

`src/ui-scale.css` is loaded after the original stylesheet. Desktop health uses 16px, actor name 18px, timer 60px, ability status 18px, and upgrade descriptions 16px. Narrow portrait uses 14px health, 40px timer, 22px upgrade titles and 16px descriptions. Short landscape uses three upgrade columns and permits overlay scrolling. Utility controls retain at least 40–44px touch bounds; important playfield space stays open.

Fog brightness eases per cell in real time, then samples a 3×3 spatial kernel; simulation visibility remains authoritative. Outline rendering projects a unique ID for each complete actor, extracts screen-space ID boundaries, and compares actor depth to world depth. Only hidden boundary fragments receive color. This avoids both internal voxel seams and visible-part outlines. Render targets resize with viewport and GPU pixel ratio.

Shotgun pellets are muted rose, 0.1m wide and 0.19m long; pistol rounds remain warm gold, 0.34m wide and 0.7m long. Vehicles use shared rotated collision hulls, become charred burning wrecks for 12 seconds, then leave flat ash without collision. The mission lasts 30 minutes before its sixth boss; combat continues until all six bosses are defeated.

## 1.3 passive rarity, perimeter and pickups

Passive offers write the rarity name in Korean as well as coloring their header, name, icon and top rule: common `#f2f2f2`, uncommon `#92e0a0`, rare `#80b8ff`. These colors identify rarity rather than replacing the established orange action and keyboard focus states. Weapon and evolution cards retain their existing treatment. Descriptions state the actual graded gain; penetration also states the resulting total probability. HUD penetration displays the percentage rather than the upgrade level.

The 130m playfield has a continuous concrete quarantine perimeter with hazard markers and metal fence posts. Its inner face is exactly the movement limit, and collision persists throughout the run. Street props remain solid and immune; only buildings and vehicles show damage, collapse or burning states.

Magnet loot uses a coral U shape with pale cyan poles. Picking it up sends existing XP toward the survivor, accelerating from 8m/s to a cap of 60m/s. Small cyan tails communicate direction. Incoming XP can cross cover; the fog still shades it, and this does not reveal hidden enemies. Pause and upgrade overlays freeze the flight along with combat.
