# Critique log

> Last pass: 2026-08-17 at commit bf39b391
> Pass count: 27

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

> **[critique pass 27, 2026-08-17, commit bf39b391] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the cold-enterable
> screen set (title, onboarding/deck-picker, combat-encounter preview,
> live combat board post-ENTER COMBAT, exploration hub — the last of
> which redirects a cold session into the intro OMEN cutscene by
> design, per `critique-drive.mjs`'s own screen comment). All 10
> captures clean: zero console/page errors besides the same benign
> `navigator.vibrate` autoplay warning seen every prior pass. The open
> **[MED] momentum chain empty-state contrast** row (pass 21)
> reconfirmed live and unchanged on both viewports — mobile DOM shows
> `○ no momentum` present but barely legible, desktop shows the same
> text with zero visible pixels against the arena floor art — no
> regression, no new evidence, not re-filed. VITAE-vs-HP and DoT
> round-clock rows both continue to hold their prior resolved/reconfirmed
> state (icon-only `♥ 90/90` readout, no duration-phrased card faces in
> the visible hand). No new findings filed.

> **[critique pass 26, 2026-08-16, commit c4f8d42b] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title (no crop), onboarding (preset picker), and
> the exploration-hub cutscene redirect all hold clean; the same
> Brine Hag encounter reproduces both still-open Pending rows exactly
> as filed at both viewports — the pass-23 "ruined city" arena-backdrop
> mismatch and the pass-21 momentum-chain empty-state contrast row
> (`○ no momentum` barely legible over the arena floor on mobile,
> fully invisible at desktop). Noted but not filed: the "tap" wording
> ("tap a glowing node to begin", "· tap ·") appears verbatim on the
> desktop viewport too — reads as a deliberate touch-agnostic voice
> choice consistent across every prior pass at this viewport, not a
> new defect. Not re-filed. Zero new findings.

> **[critique pass 25, 2026-08-15, commit 7b28b287] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at mobile
> (375×812) only; the cold drive again reached past "ENTER COMBAT"
> into the live combat-board (5/5 captures, 0 with nav trouble). Zero
> console/page errors besides the same benign `navigator.vibrate`
> warning seen every prior pass. Title screen still reads "Carry your
> ancient knowledge and cold iron into the LEAGUES beyond" (unchanged
> since pass 24). Self-assessed all 5 captures against the current
> Pending/Done log: onboarding (preset picker) and the exploration-hub
> cutscene redirect hold clean (same as passes 21/22/24 — deliberate
> paced narration beat, not a bug); the same Brine Hag encounter
> reproduces both still-open Pending rows exactly as filed — the
> pass-23 "ruined city" arena-backdrop mismatch and the pass-21
> momentum-chain empty-state contrast row (`○ no momentum` still bare
> `AXM.ash` text over the busy arena floor). Not re-filed. Zero new
> findings.

> **[critique pass 24, 2026-08-14, commit 127bbc93] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at mobile
> (375×812) only; the cold drive reached past "ENTER COMBAT" into the
> live combat-board (5/5 captures, 0 with nav trouble). Zero
> console/page errors besides the same benign `navigator.vibrate`
> warning seen every prior pass. Title screen confirms the "modern
> steel" → "cold iron" tagline fix (commit 0f408571, issue #204) is
> live: "Carry your ancient knowledge and cold iron into the LEAGUES
> beyond." Self-assessed all 5 captures against the current
> Pending/Done log: onboarding and the exploration-hub cutscene
> redirect hold clean; the same Brine Hag encounter reproduces both
> still-open Pending rows exactly as filed — the pass-23 "ruined city"
> arena-backdrop mismatch (nautical enemy text, cityscape art, no
> water/dock/coastal signifier) and the pass-21 momentum-chain
> empty-state contrast row (`○ no momentum` still bare `AXM.ash` text
> over the busy arena floor). Not re-filed. Checked the Threat
> Sequence's four phases all reading intent label "SURGES" (Brine
> Hag) against `deriveIntentType` (`combat.threat.ts:221`) — every
> phase pairs damage with a debuff by design (Mark / curse / Bleed),
> so `combo` is the correct derived intent, not a placeholder or
> repeat-label bug. Zero new findings.

> **[critique pass 22, 2026-08-10, commit 62cde36e] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. This is the first pass since Phase 44e (enemies +
> threat sequences retheme, commit 865eb90a) — the pre-fight "A FOE
> BARS THE WAY" screen's four-phase Threat Sequence now prints the
> reworded Brine Hag flavor text end to end at both viewports, no
> truncation, no placeholder leftovers. Self-assessed all 10 captures
> against the current Pending/Done log: title, onboarding, and the
> exploration-hub cutscene redirect hold clean (same as pass 21); the
> pass-19/20 node-legend/`regionProgress` rows and the pass-21 momentum
> chain empty-state contrast row all reproduce exactly as filed (not
> re-filed — still open in Pending, unaddressed by `/iterate`). Zero
> new findings.

> **[critique pass 21, 2026-08-09, commit 75ba5a34] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, exploration-hub cutscene
> redirect, and combat pre-fight copy hold clean; the pass-19/20
> node-legend/`regionProgress` rows still reproduce exactly as filed
> (not re-filed). One fresh finding: the momentum chain chip's empty
> state ("○ no momentum", `CombatBoard.tsx:627`) renders as bare
> `AXM.ash` text with no background chip, directly over the busy
> arena floor art — barely legible on mobile and fully invisible on
> desktop at the same combat state (T1, no stance played yet, the most
> common opening state of every fight). Filed below. Zero other
> findings.

> **[critique pass 20, 2026-08-08, commit dc1270ca] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, and combat pre-fight copy hold
> clean; the pass-19 `regionProgress`/legend mismatch row still
> reproduces exactly as filed (not re-filed). One fresh finding: on the
> desktop viewport only, the exploration-hub node-legend's right-hand
> string collapses to a bare "25" (the "nodes · 22 sealed" suffix is
> clipped) — traced to a component-nesting bug, not a copy bug; filed
> below. Zero other findings.

> **[critique pass 19, 2026-08-08, commit 18eb0ddb] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: title, onboarding, and combat pre-fight copy hold
> clean; the hand-card 3-line clip on Festering Argument / Slippery
> Slope is the known [LOW] row, not a new finding. One fresh finding:
> the exploration hub's static `regionProgress` header count doesn't
> reconcile with the dynamic node-legend on the same screen — filed
> below. Zero other findings.

> **[critique pass 18, 2026-08-07, commit a0882f60] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports (10/10 captures, 0 with nav trouble). Zero console/page
> errors besides the same benign `navigator.vibrate` warning seen
> every prior pass. Self-assessed all 10 captures against the current
> Pending/Done log: the title wordmark renders full and uncropped
> (RESOLVED 2026-07-22 holds), the header MORALE reads arabic "5 / 10"
> (RESOLVED 2026-07-18 holds), and the live hand's "Slippery Slope"
> card still prints the event-phrased "Inflict POISON 1 (ticks each
> card you play; 4 turns)." — the pass-16 fix (commit d320ee12) holds,
> no round-clock regression. Zero fresh findings this pass.

> **[critique pass 17, 2026-08-05, commit 2458d51e] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports. Zero console/page errors besides the same benign
> `navigator.vibrate` warning seen every prior pass, zero nav errors.
> Self-assessed all 10 captures (title, onboarding, combat preview,
> live combat-board, exploration hub × 2 viewports) against the
> current Pending/Done log: the fanned mobile hand's obscured card
> body text is the known tap-to-open-detail-modal design (Phase 22,
> taught by the combat tutorial), the wide-margin desktop layout is
> the documented dev/e2e-only surface (not a shipping target per
> `plan/bearings.md` § Surface), and the "Slippery Slope" PAID line
> ("Inflict POISON 1 (ticks each card you play; 4 turns).") is the
> pass-16 finding's own fix (commit d320ee12, now guard-tested by
> `card-face-honesty.guard.test.ts`'s WI-2 extension), not a
> regression. Zero fresh findings this pass.

> **[critique pass 16, 2026-08-05, commit 63574686] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800); the cold drive again
> reached past "ENTER COMBAT" into the live combat-board at both
> viewports. Zero console/page errors besides the same benign
> `navigator.vibrate` warning seen every prior pass. One new finding
> filed (below): the pass-15 note flagged "Inflict POISON 1 for 4
> turns." on the live hand and asked `/iterate` to settle whether that
> row was genuinely fixed by Phase 32 — it was then closed 2026-08-04
> as "RESOLVED — stale, already fixed by WI-2" (commit 0e69be8b, issue
> #168). This pass re-read the WI-2 fix and its guard test against the
> actual render path and found the closure incomplete: WI-2 only
> covers cards whose face text is auto-generated
> (`faceStats`'s `dot` case); a card with an authored `paidSummary`
> (`combat.cards.ts:389`) bypasses that path entirely and prints its
> raw authored string verbatim — which is exactly what the "Slippery
> Slope" card visible on this pass's board does. Filed as a fresh
> Pending row (not a re-open of the closed one, since the closed row's
> narrow claim — the auto-generated path is fixed — still holds) with
> the specific 7-card list and code-level citations so `/iterate` can
> act without re-deriving this.

> **[critique pass 15, 2026-08-04, commit db84dfc0] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800). **Methodology note:** this
> run's cold drive reached past "ENTER COMBAT" into the live
> combat-board (card hand, dice tray, stance state) at both viewports —
> the pass-13/14 note that "a cold drive still can't pass ENTER COMBAT"
> no longer holds; a future pass can use this to settle the
> unverified in-combat rows directly instead of waiting on an
> interactive pass. Using that new reach this pass: the VITAE-vs-HP
> row (RESOLVED 2026-07-22) still holds with no regression — the live
> board's health readouts are icon-only (♥ + number), no "HP" or
> "VITAE" text rendered anywhere to regress. The open **[MED] DoT card
> faces print round-clock math** row (2026-07-12) is reconfirmed
> live: the visible hand showed "Inflict POISON 1 for 4 turns." and
> "PROLONG every DoT on the enemy by 1 turn." — still duration-phrased
> card faces, unchanged since filing. Flagging for `/iterate`: that
> row's suggested fix says "fold into Phase 32's DoT-clock work," and
> Phase 32 is now `[x]` shipped in the build plan — worth checking
> whether the row is actually stale-resolved-by-Phase-32 or genuinely
> still open before it scores again. Zero console/page errors besides
> the same benign `navigator.vibrate` warning seen every prior pass.
> No new findings filed — nothing observed outside the existing rows.

> **[critique pass 14, 2026-07-31, commit 9a445281] Unattended `/march`
> tick.** Used the non-MCP `critique:drive` transport (§3.5) at both
> mobile (375×812) and desktop (1280×800) against the cold-enterable
> screen set (title, onboarding/deck-picker, combat-encounter preview,
> exploration hub). Zero console/page errors besides one benign
> `navigator.vibrate` autoplay-policy warning on the combat preview
> (an artifact of the headless driver never having received a user
> gesture — not reproducible by a real player, not filed). Both
> pass-13-reconfirmed HIGHs still hold fixed: MORALE renders arabic
> "5 / 10" (not "v of x"), and the mobile title wordmark is fully
> visible (no crop). One new finding below (exploration-hub level
> subtitle). Also noticed, but declined to file: at the 1280×800
> desktop viewport the title screen's art image (`aspectRatio: 1`,
> full-width) overlays the CTA directly instead of sitting in its own
> panel above it (as it cleanly does on mobile) — per
> `plan/bearings.md` § Surface the web build is dev/e2e/playtesting-only
> with no shipped desktop surface, so this has no real player impact;
> noting here rather than filing so it isn't silently dropped if that
> assumption ever changes. Still at the pass-13 plateau otherwise: an
> **interactive** `/critique` (playtester + Playwright MCP reaching
> live card-play) remains the next productive step for the unverified
> in-combat rows (VITAE-vs-HP copy, DoT round-clock math, tuning-harness
> starvation, doctrine-curve rebaseline) — a cold drive still can't
> pass "ENTER COMBAT".

## Pending

### [MED] combat — every encounter renders the same fixed "ruined city" arena backdrop, regardless of the encounter's own narrative setting
- pass: 23 (commit c063ac48)
- viewport: mobile (375×812)
- category: visual
- observation: the live combat board's full-bleed arena backdrop is a
  single static image used for literally every fight
  (`axiomancer-mobile/components/combat/encounter/CombatCombatantPane.tsx:49`
  — `const ARENA_BG = require('@/assets/images/combat/arena-ruined-city.jpg')`,
  documented in the file's own header comment as "a storm-lit ruined
  city over a cracked stone floor"). The Brine Hag encounter captured
  this pass is entirely nautical/liturgical in its own text — "the
  drowned congregation", "They have heard kinder sermons than yours,
  and drowned anyway", "The sea breaks over the whole argument at
  once" — yet the player fights it in front of a generic cityscape
  with no water, dock, or coastal-village signifier anywhere in frame.
  Phase 44g just rethemed the coastal-village NPC dialogue prose to
  lean harder into this nautical flavor, which widens the gap between
  the (now more vivid) text and the fixed generic art rather than
  narrowing it.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  (arena backdrop behind Brine Hag) + `03-combat.txt` (the encounter's
  own nautical/liturgical threat-sequence copy).
- suggested fix: out of scope for a one-line fix — this is a candidate
  for a dedicated art-asset or backdrop-selection phase (e.g. a small
  set of backdrops keyed to map/region, coastal-village first) rather
  than something `/iterate` should attempt piecemeal. Route via
  `/expand` if picked up.
- source: critique pass 23 (unattended, critique:drive artifacts)

### [MED] combat — the momentum chain chip's empty state ("no momentum") has no contrast against the arena floor art
- pass: 21 (commit 75ba5a34)
- viewport: mobile (375×812) barely legible; desktop (1280×800) fully invisible — same underlying bug, worse at the wider viewport
- category: visual
- observation: at the start of every fight (T1, no stance played yet
  — the most common opening state a player sees), the momentum chain
  chip renders its empty state as bare `○ no momentum` text directly
  over the busy arena floor artwork, just above the "NO STANCE" chip.
  On mobile it's a faint grey smear, barely readable against the
  floor texture. On desktop, at the same combat state, it does not
  render visibly at all — the text is in the DOM (confirmed via
  `critique-drive`'s extracted innerText) but produces zero visible
  pixels against the lighter floor art there. Every other momentum
  state (charged/surged/broke/chain-in-progress) has a colored
  border + alpha-fill background box behind its text, so only the
  empty state lacks a contrast-guaranteeing container.
- evidence: `axiomancer-mobile/.critique-artifacts/mobile/04-combat-board.png`
  vs `.../desktop/04-combat-board.png` (both T1, no stance played;
  compare the strip directly above "NO STANCE"). DOM text for both
  confirms `○ no momentum` is present in `04-combat-board.txt` for
  both viewports despite the desktop screenshot showing nothing there.
  Root cause: `axiomancer-mobile/components/combat/encounter/CombatBoard.tsx:627`
  — `<Text style={[styles.chainEmpty, { color: AXM.ash }]}>○ no momentum</Text>`
  — `chainEmpty` (line 1818) sets only font/size/spacing, no
  background or border, unlike `chainNode` (the filled-link style,
  which sets `backgroundColor` + `borderColor`) and `wheelCharged`/
  `chainBroke` (which set `textShadowColor`).
- suggested fix: give the empty-state text the same kind of
  contrast-guaranteeing container the other momentum states get —
  e.g. wrap it in a `chainNode`-style box (dark alpha background +
  ash border) instead of bare text, or at minimum add a
  `textShadowColor` matching the other chip states.
- source: critique pass 21 (unattended, critique:drive artifacts)

### [MED] exploration hub — node-legend's "N nodes · M sealed" count is clipped to a bare number on the desktop viewport
- pass: 20 (commit dc1270ca)
- viewport: desktop (1280×800) only — mobile (375×812) unaffected
- category: visual
- observation: on the exploration-hub map, the legend's right-hand
  string reads "25 nodes · 22 sealed" on mobile but renders as a bare
  "25" in the map's bottom-right corner on desktop — "nodes · 22
  sealed" is clipped off. This is the same node-legend the sibling
  Pending row below already flags as disagreeing with the header
  count; on desktop the legend loses its own meaning too, since a
  lone "25" with no unit reads as noise.
- evidence: `axiomancer-mobile/.critique-artifacts/desktop/05-exploration-hub.png`
  (bottom-right of the map box) vs `.../mobile/05-exploration-hub.png`
  (same string renders in full). Root cause traced in
  `axiomancer-mobile/components/exploration/MapCanvas.tsx:218`: `{children}`
  (which includes `<MapOverlays>`, the component that renders the
  legend — `axiomancer-mobile/components/exploration/MapOverlays.tsx:22-25`)
  is rendered *inside* the pannable/zoomable `<Animated.View
  style={[styles.canvas, mapTransform]}>`, so the legend's
  `position: 'absolute', bottom: 8, left: 12, right: 12` resolves
  against the 936×1040 canvas, not the viewport. The genuinely
  viewport-fixed furniture (vignette + compass rose SVGs, explicitly
  commented "Viewport-fixed chart furniture — never pans with the
  map" at line 222) lives *outside* that `Animated.View`, siblings of
  it — `MapOverlays` should live there too. The initial centering
  translate (`MapCanvas.tsx`'s `cx = viewport.w / 2 - ax * SPREAD`)
  depends on viewport width, so the legend's on-screen position shifts
  per viewport; at 1280px wide, `graphWrap`'s `overflow: 'hidden'`
  (line 263) clips most of the right-hand text.
- suggested fix: move `<MapOverlays legend={vm.legend} />` (and the
  compass/node-graph-label text it renders) out of `MapCanvas`'s
  `children` slot and render it as a sibling of the vignette/compass
  SVGs (after the `</GestureDetector>` closing tag, still inside
  `graphWrap`), so it's positioned against the viewport like the rest
  of the "chart furniture" instead of the pannable canvas.
- source: critique pass 20 (unattended, critique:drive artifacts)

### [MED] exploration hub — static `regionProgress` header count doesn't reconcile with the dynamic node-legend on the same screen
- pass: 19 (commit 18eb0ddb)
- viewport: mobile + desktop (both)
- category: comprehension
- observation: the Fishing Village exploration screen shows "Map i of
  ii · 24 paths open" as a header directly above a node graph whose
  own legend reads "25 nodes · 22 sealed". A first-time player reads
  two node/progress counts on one screen that don't agree (24 vs 25;
  "open" vs only ~3 unsealed by the legend's math) and has no way to
  tell which is current. The header string is authored-static and
  never changes as the player unlocks/seals nodes; the legend is
  computed live from `MapDefinition`.
- evidence: `axiomancer-mobile/state/exploration-maps/fishing-village.layout.ts:7`
  (`regionProgress: 'Map i of ii · 24 paths open'`, hardcoded) vs
  `axiomancer-mobile/state/presenters/exploration.engine.ts:418`
  (`` `${def.nodes.length} nodes · ${locked.length} sealed` ``,
  computed). Same pattern on the second map:
  `northern-forest.layout.ts:7` (`'Map ii of ii · 9 paths remain'`).
- suggested fix: derive the header count from the same live node
  state the legend already reads (or drop the number from
  `regionProgress` and keep just "Map i of ii"), so the two counts on
  screen can't disagree.
- source: critique pass 19 (unattended, critique:drive artifacts)

### [x] [MED] combat — authored `paidSummary` card text still prints round-clock "for N turns" for event-triggered poison/bleed, reopening the WI-2 "RESOLVED — stale" closure — RESOLVED 2026-08-05 (commit d320ee12, issue #170)
- pass: 16 (commit 63574686)
- issue: #170
- resolution: reworded all 12 offending authored `paidSummary` strings (the
  sweep found 5 more than this row's cited 7) to name the real trigger while
  keeping the honest duration number; extended the WI-2 guard test to read
  every card's `combatEffects` directly instead of `faceStats`'s
  primary-effect classification, which is what let a multi-effect authored
  card (e.g. this row's own Opening Statement citation) slip through
  undetected. See `plan/AUDIT.md`'s mirrored row for the full account.
- viewport: mobile + desktop (375×812, 1280×800)
- auth_state: anonymous
- category: comprehension
- observation: this pass's cold drive reached the live combat-board
  and captured the "Slippery Slope" hand card printing "Inflict
  POISON 1 for 4 turns." — round-clock duration language — at both
  viewports. `debuff_poison`'s trigger is `"card-played"` (an event,
  not a per-round tick — confirmed in
  `axiomancer-mechanics/src/Effects/debuffs.library.json`), so this is
  exactly the lie the WI-2 fix (issue #168) was supposed to have
  killed. The 2026-08-04 "RESOLVED — stale" closure of the prior DoT
  round-clock row (below, in Done) only verified the auto-generated
  path: `faceStats`'s `dot` case
  (`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1643-1660`)
  and its guard test
  (`card-face-honesty.guard.test.ts:110-153`, "WI-2 — every
  event-triggered DoT face names its trigger"). Neither touches a card
  with an authored `paidSummary` override: `combat.cards.ts:389`
  (`const authored = !persistent ? card.paidSummary : undefined`) and
  `:415` (`dotSuffix = authored ? '' : ...`) show the authored string
  fully replaces the auto-generated event-aware text, and the guard
  test only walks `faceStats`'s classification — never the raw
  `bottomActionText`/`paidSummary` sentence that
  `CombatBoard.tsx`'s `cleanPaidSentence()` (line 1518) actually prints
  on the hand card. The fix landed; it just doesn't cover authored
  cards, and the regression guard can't catch what it never reads.
- evidence: `axiomancer-mobile/.critique-artifacts/{mobile,desktop}/04-combat-board.png`
  + `.txt` (this pass); `axiomancer-mechanics/src/Cards/cards.library.ts`
  — at least 7 cards share the pattern (lines 45, 203, 226, 519, 578,
  830, 1765), e.g. `slippery-slope`: `paidSummary: 'Inflict POISON 1
  for 4 turns.'`.
- suggested fix: either reword the 7 authored `paidSummary` strings to
  event-based phrasing (matching the auto-generated `evt.verb` text,
  e.g. "each card you play" / "each hit taken"), or drop the
  `paidSummary` override for pure-DoT cards so the already-correct
  auto-generated `dotFace`/`dotSuffix` renders instead — then extend
  the WI-2 guard test to sweep `bottomActionText`/`paidSummary`
  strings too, not just `faceStats`'s `dot` classification, so this
  can't regress silently again.
- source: critique (unattended `/march` tick, non-MCP transport)

### [x] [MED] exploration hub — player subtitle reads "LEVEL · LVL 1 PILGRIM", doubling the level label — RESOLVED 2026-07-31 (commit 16c89f25, issue #157)
- pass: 14 (commit 9a445281)
- viewport: mobile + desktop (375×812, 1280×800)
- auth_state: anonymous
- category: visual
- observation: the exploration-hub `StatusCard` (name + level badge,
  visible any time the player is on the map) renders a subtitle line
  "LEVEL · LVL 1 PILGRIM" — the static section label "LEVEL" and the
  value string's own "LVL {n}" both say the same thing back to back,
  reading as a template/copy-paste leftover rather than intentional
  flavor. Same shape as the earlier header MORALE "v of x" placeholder
  bug (RESOLVED 2026-07-18, different component) — a label colliding
  with its own value.
- evidence: `StatusCard.tsx:61` — `` LEVEL · LVL {level} PILGRIM ``
  inside a `SectionLabel`; confirmed live in the exploration-hub
  cold-drive capture (mobile + desktop): "LEVEL · LVL 1 PILGRIM".
- resolution: dropped the redundant leading "LEVEL · " section label —
  subtitle now reads "LVL {n} · PILGRIM" once. Updated the pinned test
  string in `StatusCard.test.tsx` to match + added a regression guard.

### [LOW] mobile — combat corner medallions occlude the fan-end hand cards' touch centers
- pass: combat declutter residue (PR #135, 2026-07-19)
- viewport: 375×812
- auth_state: n/a
- category: ux
- observation: the player medallion (bottom-left) and END medallion (bottom-right) deliberately float ABOVE the fan ends (reference chrome) — but the LEFTMOST hand card's bounding-box center sits under the player medallion, so a drag started from its middle hits the medallion, not the card. Found while the upgradeable-dice e2e's SWAY guard failed staging the leftmost Soft Word; the harness now picks the rightmost copy, but a real player dragging the leftmost card from its lower half hits the same occlusion. Playable (the card's upper half drags fine) — just a friction spot on small screens.
- evidence: PR #135 (elementFromPoint probe: combat-hand-c1 center → combat-player-medallion); scripts/upgradeable-dice-e2e.mjs SWAY-guard comment.
- suggested fix: next combat-UX pass, either inset the fan band from the medallions or shrink the medallion hit-slop so the card wins the touch; verify with the same probe.
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)

### [x] [MED] general — used dice have no spent-state visual indicator (grey them out) — ROUTED to Phase 38 via /oversight 2026-07-20
- pass: user-jot (commit 42ec22b0526a3922a6cfccab16663984eb249a2f)
- viewport: unspecified
- auth_state: anonymous
- category: visual
- observation: The dice, after they're used don't have a visual indicator that they're used. I would like for any used dice to become greyed out after usage
- evidence: user-spotted at 2026-07-20T14:03:53Z
- resolution: folded into Phase 38 (central juice/animation layer) as an in-scope combat-first legibility primitive (spent-die greying). Do NOT drain via /iterate — it ships with Phase 38. See plan/phases/phase_38_juice_layer.md.
- source: user

### [LOW] mobile — legacy flag-off combat render paths linger post-FLIP
- pass: combat declutter residue (PR #135, 2026-07-19)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: THE FLIP (2026-07-18) made Upgradeable Dice the shipped default, but the flag-off render stack survives whole under the legacy kill-switch: the three-node MomentumWheel component + `vm.momentum`, the faceless 2-die draft tray, and the reroll rune's printed legacy cost/description (kept byte-identical flag-off by design). Dead weight the moment the kill-switch retires.
- evidence: CombatBoard.tsx MomentumWheel / `vm.momentumV2 ? chip : wheel` fork; presenter signaturesVM flag fork (PR #135).
- suggested fix: when the owner retires `EXPO_PUBLIC_UPGRADEABLE_DICE=0`, delete the wheel component, the `momentum` VM surface, and the flag forks in one sweep (the flag-off byte-identical test suites go with it).
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)

### [LOW] mobile — combat die/card-face components accrete hex literals against the AXM-token doctrine
- pass: combat declutter residue (PR #135, 2026-07-19)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: the package doctrine says "no hex literals (use AXM tokens)", but CombatDie's cube greys, the card face's scrim/rarity/glyph-pop colors, and HazardDie's palette all carry raw hex — the cube recut + glyph-pop pass (PR #135) extended an already-widespread pattern rather than fixing it.
- evidence: CombatDie.tsx (cube greys, rim colors), CombatBoard.tsx (READ_ACCENT, rarity colors, lighten/darken helpers), components/hazard/palette.ts.
- suggested fix: a token-hygiene pass folds the recurring combat/hazard colors into the AXM runtime palette; new code then has a token to reach for.
- source: owner session 2026-07-19 (press-fate/momentum/dice PR)

### [LOW] mechanics — akrasia swap-pool cleanse-while-Fallen tension knob needs matrix eyes
- pass: swap-pool fan-out residue (PR #130, 2026-07-18)
- viewport: n/a
- auth_state: n/a
- category: content
- observation: `absolution-on-account` and `the-wound-that-teaches` (swap-akrasia) deliberately CLEANSE while Fallen — the state is checked at play time, then walked back. A real tension knob per the designer, but it can read as anti-synergy confusion in play.
- evidence: swap-pool fan-out report §needs-user-call; designer note in the akrasia pool file.
- suggested fix: when the swap-pool measurement pass runs, watch these two cards' usage + FALLEN uptime; if the matrix shows confusion (played then immediately un-Fallen with no payoff), redesign toward pay-then-cash ordering.
- source: /deck-tuning fan-out session

### [x] [LOW] mechanics — THEME_KEYWORDS.harvest still advertises TICK (owner-ratified dead 2026-07-10) — RESOLVED 2026-08-01 (issue #160)
- pass: swap-pool fan-out residue (PR #130, 2026-07-18)
- viewport: n/a
- auth_state: n/a
- category: content
- issue: #160
- observation: `card-themes.ts` lists TICK in harvest's keyword family, but the atlas records TICK's owner-ratified death and no live card uses it — the catalog's family search advertises an empty set (the exact "family lie" class KW-2/KW-6 fixed in phase 29).
- evidence: harvest swap-pool designer note; docs/keyword-atlas.md TICK row.
- resolution: dropped TICK from `THEME_KEYWORDS.affliction` and `THEME_KEYWORDS.harvest` (both families listed it) in `axiomancer-mechanics/src/Cards/card-themes.ts`. Confirmed no live card uses TICK (`roles-themes.engine.test.ts` "no TICK vocabulary anywhere in the sets" witness) and no test pins family length/contents beyond the KW-6 glossary-resolution check. Mechanics + mobile verify green.
- source: /deck-tuning fan-out session

### [LOW] mechanics — fated-course engine hook survives its retired card as a test harness
- pass: D8 ship residue (commit 10ec4fe8)
- viewport: n/a
- auth_state: n/a
- category: engineering
- observation: `combat.engine.ts` (~lines 4011/4059) still keys the telegraph-forcing hook on `fated-course`, retired from the library in D8's ten-in/ten-out ledger. Unreachable in live play (no preset/reward fields the card), but `oracle-omen-v2.engine.test.ts` depends on it as its deterministic telegraph harness — swapping the id would destroy the guaranteed-hit assertions.
- evidence: fixture-sweep report, 2026-07-18; plan/tuning/2026-07-18-d8-preset-dice-valves.md §Residue
- suggested fix: next oracle pass ports the harness onto a live card or a test-only hook id, then deletes the dead engine branch.
- source: ship-a-phase D8

### [LOW] data — Card Ledger dashboard + preset-metrics exports measure the PRE-D8 decks
- pass: D8 ship residue (commit 10ec4fe8)
- viewport: n/a
- auth_state: n/a
- category: data
- observation: `docs/reports/preset-metrics/2026-07-18-*.json` and the Card Ledger dashboard were measured on the pre-valve flag-on decks (and a 70-card library that no longer exists — the dead ten are retired, ten valves are live). Their triage verdicts remain historically valid but the preset rollups no longer describe the shipped decks.
- evidence: D8 gate rerun already shows different curves (standstill 50→59 blind-early).
- suggested fix: re-run the accumulation (both arms, two seeds) + republish the dashboard after the post-D8 curve-repair phase lands, so the next triage reads the real game.
- source: ship-a-phase D8

### [LOW] general — AccessoryKind union must open when accessory flavors grow
- pass: user-jot (commit 4e045d05)
- viewport: unspecified
- auth_state: anonymous
- category: content
- observation: Equipment model confirmed with owner (2026-07-18): 5 worn slots (1 weapon / 1 armor / 3 accessories), accessories are flavor-free mechanically — but AccessoryKind in axiomancer-mechanics/src/Items/types.ts is a CLOSED union (`head|hands|feet|amulet|ring|charm`) that pure flavor must register in. Owner intent: accessories can be literally anything (a cape, etc.). When new accessory content lands, extending the union is a one-word additive change, no migration, nothing reads the kind. Not blocking anything today.
- evidence: user-spotted at 2026-07-18T19:40:08Z
- suggested fix: [user has not specified — iterate to determine]
- source: user

> **[owner session, 2026-07-18 — THE FLIP residue] Upgradeable Dice is now ON
> for every app build** (owner call, overriding D7's stays-OFF default): the
> app root (`axiomancer-mobile/state/combat/flags.ts`) forces the spec-33
> model on all surfaces; only the explicit `EXPO_PUBLIC_UPGRADEABLE_DICE=0` /
> `__AXM_UPGRADEABLE_DICE__='0'` kill-switch keeps the legacy model. THE
> STAKE's wager UI is retired on every surface (completing spec 33 §5).
> Follow-ups this creates:
> - **F3 DRAINED same day (owner call)**: the Gambler's Knot is now
>   default-worn (Venom Sigil benched), so every starter loadout — main game
>   included — carries Press Fate beside Disarming Plea (Befriend) and
>   Overwhelming Argument. Re-measured at seeds 1-8: 0.060 casts/round,
>   income 1.533◆ (in band), stake-gap narrowed +13.6%→+11.5%. The economy
>   canaries now pin the sink STAYING live. Remaining: the combat-sandbox
>   e2e route still equips no relics, so the Press Fate control is only
>   witnessable in the main game (e2e NOTE stands).
> - **D7's not-ready verdict now describes the shipped game**: early win
>   61-66 vs the ~80 band, statusEngagement −9pts. The tuning debt (D3/D4
>   sinks, signature repricing) is no longer flag-gated homework.
> - **Engine stake plumbing** (`placeStake`/`settleStake`, `stake-won/lost`
>   events, `CombatEncounterState.stake`) is now UI-orphaned on every surface —
>   remove mechanics-side per spec 33 §5 "removed, not rewired".
> - **Mechanics default stays OFF** (tests/sims toggle per-suite) — the
>   app/engine defaults now disagree by design; revisit at the true D-series
>   close-out.

> **[iterate residue, 2026-07-18, after the D-series march loop] Open-HIGH
> triage — no cheap autonomous win remains; next productive critique is
> INTERACTIVE, not another cold drive.** The hourly `/march` loop that shipped
> the whole spec-33 D-series drained four HIGHs as already-fixed-by-shipped-work
> (D7-blocker→fix, MORALE→#117, END-phase→WI-3, momentum-wild-die→Phase 31); the
> queue was pass-12/13 and predates the D-series + phases 31/32, so carried-forward
> rows kept resolving stale on inspection. The **6 remaining open HIGHs** split
> into three buckets, none a clean loop win:
> - **owner/design-judgment** — title wordmark crop (baked-art reflow, visual-design
>   call; pass-13 reconfirmed it's still live) · combat tutorial drag-to-play gesture (UX).
> - **phase-coupled / expensive** — suppurating-curse-on-poison/bleed (Phase-32
>   substrate) · late-stage global collapse (expensive balance, D7-confirmed pre-existing).
> - **unverified — need an IN-COMBAT capture** — tuning-harness policy-pick starves
>   sandbox cards · phase-31/32 doctrine-curve rebaseline. The cold-enterable
>   `critique:drive` stops at the pre-fight preview, so these can't be settled by
>   another cold pass.
> Next productive critique action = an **interactive `/critique`** (playtester +
> Playwright MCP reaching card-hand + staged play), not a cold drive; the loop
> reached its plateau on this queue.

> **[critique pass 13, 2026-07-17, commit b4870384] Re-baseline ran.**
> Used the unattended `critique:drive` transport (§3.5) against the
> cold-enterable screen set (title, onboarding/deck-picker,
> combat-encounter preview, exploration hub) at mobile viewport.
> Directly reconfirmed two of the STALE-flagged rows are still live
> post-SIDE-RAIL: the header **MORALE "v of x"** placeholder (still
> renders literally on the exploration-hub capture) and the **title
> wordmark crop** (still bleeds off the top edge — "xiomance..." only).
> Both stand as-is below, no longer unverified.
>
> The remaining STALE-flagged rows — VITAE-vs-HP copy and DoT
> round-clock card-face math — need a **live in-combat** capture (card
> hand + staged play) to confirm or drop; the cold-enterable screen set
> stops at the pre-fight preview ("ENTER COMBAT" not yet pressed), so
> this pass could not reach them. They stand as unverified-but-not-
> disproven; a future interactive `/critique` (playtester + Playwright
> MCP) or a deep-playtest pass should settle them. The card-editor
> mechanic-fields gap is a desktop-tool row, out of reach of the mobile
> web-viewport drive — also stands as unverified.
>
> "the-closing-word" threshold is already `[x]` RESOLVED below (PR
> #91) — drop from the stale set.
>
> Zero new findings filed this pass (nothing observed outside the
> existing rows).

### [x] [HIGH] D7-BLOCKER — flag-on paid plays don't commit through the mobile UI (RESOLVED 2026-07-18)

**RESOLVED 2026-07-18.** Root cause (deeper than first classified but same
lane): `handleApply` resolved correctly, but `onApply → resolveApplyRouting`
(`state/presenters/combat-encounter.engine.ts`) was draft-model-shaped — a fresh
tray die (not reserve/floating/fate-X) returned `{draftFirst:true,
explicitDieId:undefined}`; then `draftStanceDie` is a flag-on no-op, so
`playCombatCard` got NO die and the flag-on engine fizzled ("choose a die"),
bouncing the card (the "die spent" was only the drop's UI dim). Fix: a flag-on
early return in `resolveApplyRouting` forwards every dropped die as the explicit
`dieId` (`draftFirst:false`). Regression guards: a deterministic unit test
(`floating-die-apply.engine.test.ts` — flag-on tray-die routes explicit + Soft
Word commits SWAY>0, both fail pre-fix) + the D6d e2e `assertSwayCommit` (SWAY
0→4, card leaves hand). Stale flag-on STAKE affordance hidden in the same fix.
Mobile verify green (2624). `fix(mobile): flag-on paid-play UI commit + STAKE
hide`.

Surfaced by the D6d flag-on e2e (2026-07-18). Powering a card with a legal
die and pressing APPLY under the spec-33 flag **spends the die but the play
never commits** — the effect doesn't apply and the card bounces back to hand
(observed on Soft Word / SWAY: die consumed, SWAY meter stays 0/31).

**Classified (do NOT re-litigate the engine):** the ENGINE is correct flag-on.
A hermetic probe (`playCombatCard(state, {uid}, true, heartDieId)`, flag-on)
plays Soft Word paid via a heart mana die → `card-played:1, fizzled:0,
sway 0→4, die spent, left hand`. So the bug is **mobile-side**, in
`axiomancer-mobile/components/combat/encounter/CombatBoard.tsx` — the
`handleApply` / `assignedDieFor` / `comboTargetUid` commit path is built around
the retired DRAFT model (`draftedDie = vm.dice.find(d => d.drafted)`, the combo
refresh) which does not exist flag-on (no draft; four independent fixed dice).
D6a extended the drop-based `pendingDieByUid` path for display/arming, but the
COMMIT still routes through draft-model logic that mishandles the flag-on
no-draft multi-die case (likely calling `onApply` with a wrong/absent `dieId`
or `power`, so the engine fizzles-then-drains-free while the die still reads
spent).

**Why HIGH but not live:** the flag is OFF in production, so no user hits this
— but it is a hard **D7 blocker**: D7 recommends the flag-flip, and a broken
flag-on paid-play UI cannot ship. Fix before D7. Repro is cheap: the D6d e2e
harness + a "successful paid SWAY commit" assertion (which the e2e currently
lacks — add it as the regression guard). Also seen in the same screenshot: a
stale STAKE affordance renders flag-on though STAKE was retired in D2 §5 —
fold that cleanup into the same fix.

**Root-cause pinpoint (independent confirmation, D6d parallel run, 2026-07-18):**
narrowed past "likely calling `onApply` with a wrong/absent `dieId` or
`power`" above to the exact mechanism. `resolveApplyRouting`
(`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1938-1949`)
computes `draftFirst: !!dieId && !explicit && state.draftedDieId === null`
with NO `isUpgradeableDiceEnabled()` gate (every sibling VM function in the
same file gates on the flag; this one doesn't). For an ordinary tray die (not
Reserve/floating/fate-X — every rolled die under the flag-on four-fixed-dice
model) this evaluates `draftFirst = true`, so `CombatEncounterPanel.onApply`
(`components/combat/encounter/CombatEncounterPanel.tsx:464-474`) calls
`draftStanceDie(ns, dieId, ...)` before `playCombatCard`. But `draftStanceDie`
(`axiomancer-mechanics/src/Combat/combat.engine.ts:715-717`) is an explicit
no-op under the flag ("the draft is retired under the flag ... if
(isUpgradeableDiceEnabled()) return { state, events: [] }"), so
`state.draftedDieId` stays `null` forever and `routing.explicitDieId`
resolves to `undefined` — `playCombatCard` is called with NO die id at all.
Since the one function that would set `draftedDieId` always no-ops under the
flag, this is permanent for the life of the combat, not an edge case. Suggested
fix: gate `resolveApplyRouting`'s `draftFirst` on `!isUpgradeableDiceEnabled()`
(flag-on: every non-Reserve/floating/fate-X tray die should also resolve
`explicit = true` and pass straight through as `explicitDieId`, mirroring how
Reserve/floating dice already route) — this one function is the fix, not
`CombatBoard.tsx`'s `handleApply` (which already computes the right
`dieId`/`power` and hands them to `onApply` correctly; the miscount happens
one level down, in the routing helper `onApply` calls next).

### [MED] ratified-exception HP arms bypass the damage-instance clock funnel
- pass: review-closeout 2026-07-12 (commit 4680e5e2, branch
  claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: design
- observation: the three spec 32 §12 ratified direct-HP exceptions — the
  `conclude` signature arm (Conclusion, per-stack), the `mercy` signature
  arm (Disarming Plea, flat magnitude; both `combat.signature.ts`, plain
  `applyDamage`), and the mercy-exploit strike
  (`selectEncounterMercyChoice` exploit branch, `combat.engine.ts`) —
  apply damage OUTSIDE the `applyEnemyDamage` funnel. Every status-gated
  payoff burst advances BLEED's WS3.2 damage-instance clock; these three
  hits do not, so a Conclusion cast or a mercy-exploit strike lands on a
  bleeding enemy without the bleed paying out. Ratified exceptions ARE
  allowed to differ from the funnel — whether they SHOULD feed the clock
  is a design call, not a bug fix, hence filed instead of changed.
- evidence: `combat.engine.ts` `applyEnemyDamage` doc comment ("the
  shared enemy-damage funnel"); `combat.signature.ts` conclude/mercy arms
  call `applyDamage` directly; the mercy-exploit branch likewise. The
  doctrine witness (`doctrine-strike-dead.engine.test.ts`) ratifies the
  three arms' RIGHT to chip HP (spec 32 §12) but nothing rules on their
  clock semantics.
- suggested fix: owner call under the spec 32 §12 framing — either (a)
  ratify "exception damage is clock-silent" as spec text (one sentence in
  §12, plus a witness pinning it), or (b) route the three arms through
  `applyEnemyDamage` so BLEED treats every enemy-HP hit uniformly. Do NOT
  change behavior without the ratification; (b) also changes Conclusion's
  effective damage against bleeds and needs a balance glance.
- source: adversarial code review (2026-07-12)

### [MED] WS9 reactive cleanse strips a whole merged instance — tension with the enemy-cleanse mitigation
- pass: review-closeout 2026-07-12 (commit 4680e5e2, branch
  claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: design
- observation: the WS9 reactive cleanse (`enemyCleanse` threat-branch
  payload, `combat.engine.ts`; prototype carrier Tri-Eyes,
  `combat.threat-sequences.ts`) removes one whole merged `ActiveEffect`
  instance in application order. Because same-id afflictions
  intensity-stack into ONE instance, a single cleanse can erase an
  arbitrarily tall stack — e.g. a poison the player spent three cards
  deepening — which sits in tension with the standing "enemy cleanse <
  cheapest DoT output" mitigation (the cleanse should never out-tempo the
  cheapest re-application). The guardrails are real (never the last
  affliction, telegraphed branch, at most once per sequence pass) but
  none of them bound the VALUE removed, only the count.
- evidence: `combat.encounter.types.ts` `enemyCleanse` doc; the
  `applyCleanse`-based shed in `combat.engine.ts` (WS9 reactive cleanse
  block); witness `threat-branches.engine.test.ts` ("cleanses exactly one
  affliction... never the last") asserts instance count, not intensity.
- suggested fix: propose intensity-SHAVING as the follow-up — the cleanse
  removes N intensity from the chosen affliction (washing it out only at
  0) instead of the whole instance, so the shed price stays comparable to
  one cheap DoT application regardless of stack height. Needs a design
  pass on N (flat 1? per-branch payload?) and a re-run of the WS9 branch
  witnesses; until ratified, the current whole-instance shed stands.
- source: adversarial code review (2026-07-12)

### [x] [HIGH] tuning harness — policy-pick draft scorer starves new/sandbox cards (RESOLVED 2026-08-02, commit fbace426, issue #163)
- pass: session-closeout 2026-07-12 (commit ffadca96, branch claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: tuning-harness
- issue: #163
- observation: the policy-pick draft scorer never surfaces new or
  sandbox cards — five sets (doom-species, chooseX-vein, roles-charm,
  roles-harvest, roles-forge's ingot) had ZERO drafts at one or more
  seeds, and three independent A/Bs (conjure-exercise, roles-bulwark,
  roles-harvest) show the IDENTICAL +10.8pp seed-2 mid-stage delta —
  a pool-shuffle artifact, not a card signal. Matrix-level stage
  deltas in sandbox A/Bs are not attributable to the cards under test.
- evidence: `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`
  §2 cross-cutting findings 1-2; direct-draft probe
  (`probe-ingot-draftability.ts`) shows ingot-of-ruin IS structurally
  draftable — the scorer and the lottery disagree.
- suggested fix: one scorer fix (draft-weight/offer-rate handling of
  pool newcomers) unblocks SIX pending gate verdicts; do it before the
  next sandbox A/B cycle so evidence stops being lottery-shaped.
- source: session closeout (evidence pass, 2026-07-11)
- resolution: reproduced live on `main` (`694edb59`) before fixing —
  `ingot-of-ruin` 0/24 draws across the 3 canonical late-stage seeds;
  `conjure-exercise`/`roles-bulwark` produced byte-identical decks
  across all 40 mid-stage seed=2 cells. `draftCombatDeck`
  (`combat.deck-draft.ts`) now extends the existing defend/status
  floor pattern with a per-id guarantee: every distinct `extraCards`
  newcomer id is forced into the draft when the stage/tier pool
  allows it (per-id, not per-class, so a set with multiple newcomers
  can't have one hide another). `FOCUS_WEIGHT`/`OFF_FOCUS_WEIGHT` and
  library-card odds untouched; no-ops whenever `extraCards` is empty,
  so real starter presets are unaffected. Regression coverage in
  `combat-deck-draft.engine.test.ts`. Post-fix: `ingot-of-ruin` hits
  48/48 eligible cells; all named sets now surface in 71-100% of
  stage-eligible cells. Mechanics `npm run verify`: 190 files / 4085
  tests green.

### [HIGH] late-stage global collapse — all 10 presets 0.00 late
- **PARKED behind the card redesign (/oversight 2026-08-08).** T, ruling
  on this row's Phase 39 successors: *"This is fine. We're working on a
  new card redesign anyway."* Do not pick this row, do not promote a
  phase off it, and do not author cards to move its numbers — the
  library it measures is transitional. It re-opens for assessment once
  the redesign lands and Phase 43 defines a live objective function.
- **SUPERSEDED AS A TARGET by the unshackling (/oversight 2026-08-08).**
  "All 10 presets 0.00 late" was a failure *against the status-dominance
  doctrine*, which T voided this day. Whether a 0.00 late win rate is
  still a defect is now an open question that **Phase 43** (objective
  function v2) answers — and normal damage, newly legal, is the most
  obvious lever if it is. Keep this row open as evidence; do not treat
  its 80/50/25-35/0 target band as live. The post-Phase-39 reading below
  is a faithful record of the measurement, but it measures the old law.
- **Phase 39 landed 2026-08-08 (commit `8d50591e`) but did NOT drain
  this row — the matrix is the witness, and it still reads a
  violation.** The digest's first post-Phase-39 baseline (reduced
  nightly, regenerated at `8eb33fb8` — see `plan/AUDIT.md`'s new
  "Doctrine-curve confirmation post-Phase-39" row for full numbers)
  reads blind policy-pick early 61.1% (unchanged) / mid 2.0% (up from
  0.0%, still a
  deep violation against ~50) / late 0.0% (unchanged) / impossible 0%
  (unchanged, correct) against the 80/50/25-35/0 doctrine. This
  corroborates Phase 39's own shipped `needs-user-call`: the mid/late
  cliff reads as engine/enemy-scaling shaped, not card-composition
  shaped (10/13 staple-duplication candidates were already fully
  deployed pre-Phase-39 and those presets still sat at 0% mid). Do NOT
  let `/iterate` pick this row for a partial card-level fix — per the
  original assignment, per Phase 39's own finding, and per this
  project's standing rail that engine constants are tuned manually
  (not via `/deck-tuning`), the next move is an owner-scoped call via
  `/oversight` on whether to open a dedicated mid/late enemy-scaling
  phase.
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: design
- observation: every one of the 10 starter presets reads 0.00 win rate
  at the late stage, and the mid-stage ratchet clears only via erosion.
  The WS3/WS4 late gates FAILED on this global condition, not on their
  own cards — late-stage failure is currently unattributable to any
  individual card or theme.
- evidence: `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`
  (honest re-baseline matrix). Doctrine curve target is late ~25-35%
  for starter presets (`axiomancer-mechanics/CLAUDE.md`).
- suggested fix: a dedicated late-stage tuning phase (global
  condition: enemy HP/threat scaling vs win-path throughput), not
  per-card forging; candidates via /expand.
- source: session closeout (evidence pass, 2026-07-11)

### [x] [MED] control-lock sim policy is threat-blind — WS8 surface variety unexploited — RESOLVED 2026-08-01 (commit d0d83e06, issue #159)
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: tuning-harness
- issue: #159
- observation: `rankCard` in the sim policies never reads
  `threatPhases`, so no sim policy can exploit WS8's control-surface
  variety (the data exists; no decision layer uses it). Pinned as a
  known gap via `it.fails` in
  `axiomancer-mechanics/src/Combat/e2e/control-surfaces.sim.test.ts`.
- evidence: the `it.fails` pin; WS8 payload data in
  `combat.threat-sequences.ts`.
- suggested fix: teach the control policy to read the CURRENT threat
  phase (rungs, intent type) when ranking STAGGER/BACKFIRE plays; flip
  the `it.fails` pin to a passing assertion in the same change.
- source: session closeout
- resolution: added `controlSurfaceBonus` to the `control-lock` policy's
  `rankCard` (`combat.sim-policies.ts`) — a threat carrying a rider ranks
  BACKFIRE punish highest (no roster candidate erases a rider outright);
  a clean or compounding threat ranks STAGGER rung-denial highest, with
  `lock_stance` as a certainty tiebreak. Flipped the WS8.4 `it.fails` pin
  to a passing `it` per its own documented instructions. Verified: all 4
  fixture threats now produce >1 distinct preferred control card.

### [MED] engine hooks missing for two ratified-adjacent bridge shapes
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: engine-gap
- observation: two ratified-adjacent bridge shapes have no engine hook:
  (1) player-side affliction-expiry → Soul (the Soul economy counts
  ENEMY afflictions only), and (2) a rungs-denied ledger for
  STAGGER → REPRISE causality. Both bridge cards were shipped
  nearest-buildable instead; the killed bridges barbed-compliment and
  interest-on-the-flesh point at the re-homes.
- evidence: session A/B report + card notes in
  `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md`.
- suggested fix: add the two hooks as small engine substrate items in
  the next engine phase, then revisit the killed bridge designs.
- source: session closeout

### [MED] UI-communication testing gap — sim evidence is text-blind
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: mobile
- category: process
- observation: the sim/evidence loop cannot see player-facing WORDING.
  The user caught a three-surface contradiction (keyword gloss vs
  detail modal vs card face) that no agent test covered — fixed in
  8c25374e, and this closeout fixed another (stale RUPTURE cap gloss
  in `axiomancer-mobile/state/combat/keywords.ts`), but the class is
  ungated.
- evidence: fix commit 8c25374e; the card-face-honesty guard test
  covers face formatting, not cross-surface numeric consistency.
- suggested fix: run a /deep-playtest pass post-merge focused on
  copy consistency, and add the WS9.3 "why did the enemy change
  plan?" question to the next /combat-playtest brief. Consider a
  guard test that derives every printed cap/constant gloss from the
  engine constants.
- source: user + session closeout

### [LOW] card-editor cannot edit the three new mechanic fields
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: desktop
- category: tooling
- observation: the card-editor UI has no inputs for the three mechanic
  fields added this session: `grant_pip.overflow`,
  `spend_all_pips.markPer`, and `synergy.statePredicate`. Cards using
  them can only be authored by hand-editing JSON/TS.
- evidence: `axiomancer-card-editor` form components lack the fields;
  the mechanics exist in `axiomancer-mechanics/src/Cards/types.ts`.
- suggested fix: add the three fields to the editor's mechanic form
  (enum/number/checkbox as appropriate).
- source: session closeout

### [x] [HIGH] persistent header — MORALE meter renders literal "v of x" placeholder (RESOLVED 2026-07-18)
- RESOLVED 2026-07-18 (issue #117, `fix(mobile): MORALE header renders arabic value` 270e5f93). Not a literal placeholder — the value was roman ("v of x" = 5 of 10), which read as unresolved template vars and clashed with VITAE (same card) + the POOLS panel (both arabic). Switched the header to arabic "N / 10" using the moraleDisplay/moraleMax already computed; regression test added.
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: visual
- observation: the always-visible top header's MORALE meter shows the
  unresolved template placeholder text "v of x" instead of real numbers,
  on every screen in the app (title, exploration, combat, SELF, SATCHEL,
  MEMOIR). The correct value renders fine in the SELF tab's POOLS panel
  just below ("MORALE · resolve to walk 5 / 10"), so the data exists —
  it just isn't reaching the header component.
- evidence: accessibility snapshot on every screen: "MORALE / · RESOLVE
  TO WALK / v of x"; SELF tab POOLS panel correctly shows "5 / 10" for
  the same stat.
- suggested fix: wire the header MORALE display to the same
  morale value/formatter already used in the SELF tab's POOLS panel.
- source: playtester (critique pass 12)

### [x] [HIGH] title screen — wordmark cropped above the mobile fold (RESOLVED 2026-07-22, commit 0725b9cc)
- issue: #148
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: visual
- observation: on the title screen at 414x896, the game's wordmark
  bleeds off the top of the screen — only "xiomance..." is visible, the
  leading "A" and trailing letters cut off above the fold. No full
  title text is visible on load.
- evidence: title-screen screenshot shows the stained-glass artwork
  with "xiomance" cropped at the top edge; no scroll reveals the rest.
- suggested fix: reflow or rescale the title art/wordmark so the full
  name fits inside the mobile viewport without requiring scroll.
- source: playtester (critique pass 12)
- resolution: root cause was the 1024x1024 square key art rendered
  with `contentFit="cover"` on a narrow/tall viewport — covering the
  full screen height scales the square up and crops ~27% off each
  side, taking the wordmark's leading "A" and trailing "R" with it.
  `TitleScreen.tsx`'s art image now uses `contentFit="contain"` pinned
  to the top edge at full width (`aspectRatio: 1`), so the whole
  square — wordmark included — is always fully visible; verified at
  414x896 via the expo-web dev server.

### [x] [HIGH] combat tutorial never teaches the drag-to-play gesture (RESOLVED 2026-07-22, commit 6f138c27)
- issue: #147
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: comprehension
- observation: the only way to play a card in combat is a drag from
  hand to a staging zone; a plain tap only opens a read-only
  card-detail modal. The 3-page "FIRST FIGHT" tutorial never mentions
  the drag gesture — it only says tapping a card shows its keywords.
  A first-time player tapping cards (the only affordance taught) would
  plausibly never discover how to actually play one.
- evidence: tutorial page 3/3 verbatim: "...Tap any card to read its
  keywords and full effect." No drag instruction anywhere; the
  "APPLY · FREE" staged state required a synthetic drag sequence to
  find.
- suggested fix: add an explicit tutorial step demonstrating the
  drag-to-stage/APPLY gesture, and/or a visible "drag to play"
  affordance on card faces.
- source: playtester (critique pass 12)
- resolution: `CombatTutorialPrimer.tsx`'s DICE & CARDS page (page
  3/3) now says "Drag a card up into the PLAY AREA to play it; tap
  one first to read its keywords and full effect." — matching the
  wording already used by the in-combat coach's 'spend' step
  (`combat-tutorial-steps.ts`), which taught the gesture but only
  after the primer had already sent the player off with tap-only
  instructions. The larger suggested "visible drag affordance on
  card faces" remains open as a follow-up, not required to close
  this finding.

### [x] [MED] persistent header VITAE bar doesn't update during combat (RESOLVED 2026-07-23, commit 20af943f, issue #152)
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
- observation: the always-visible header's player VITAE bar stays
  frozen at "80/80" through an entire combat, while the in-combat HUD
  correctly shows VITAE dropping (71 -> 59 -> 35 -> 7 -> 0) as the
  fight progresses.
- evidence: accessibility snapshots at multiple combat states show
  header progressbar "VITAE: 80 out of 80, 100 percent" alongside the
  in-combat element reading "Player, VITAE 0 of 80."
- suggested fix: bind the persistent header VITAE bar to the same live
  combat state store the in-combat HUD reads from.
- resolution: no shared store exists to bind to (`CombatEncounterPanel`
  keeps engine state in local React state) — instead the exploration
  screen stops rendering the out-of-combat header while the encounter
  modal is showing, since that modal already renders full-screen over
  the map by design. `axiomancer-mobile/app/(tabs)/exploration/index.tsx`.
- source: playtester (critique pass 12)
- issue: #152

### [x] [MED] pre-fight enemy preview disagrees with live combat VITAE — RESOLVED 2026-08-01 (commit 15d45699, issue #162)
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
- issue: #162
- observation: the pre-fight encounter card for "Little Belle"
  previews the enemy as "level 2 · 50 hp.", but immediately on
  entering combat the same enemy's VITAE bar reads 100/100 — double
  the previewed value.
- evidence: encounter card text "level 2 · 50 hp." / "Lv 2 foe · 50 HP
  · advantage not yet scouted"; combat screen progressbar "Enemy VITAE
  100 of 100" for the same enemy in the same encounter.
- suggested fix: source the pre-fight preview and the live combat
  VITAE bar from the same computed enemy stat.
- source: playtester (critique pass 12)
- resolution: root cause was systemic, not Little-Belle-specific —
  `beginHazardEncounter` (`axiomancer-mobile/state/actions.ts`) applies
  the `ENCOUNTER_ENEMY_HP_MULTIPLIER` (2x) testing knob to every live
  foe's HP, but `composeCombatPrelude`'s preview text
  (`axiomancer-mobile/state/presenters/event.engine.ts`) read the
  enemy's unscaled `health`. Preview now derives its displayed health
  from the same `withScaledEnemyHp` helper used at the live chokepoint.
  Also widened `event.engine.test.ts`'s roman-numeral subtitle regex to
  the full lowercase-roman alphabet — the doubled value exposed a
  stale test regex that only ever accepted i/v/x. Full three-workspace
  `npm run verify` green.

### [x] [MED] card/tooltip copy still says "HP" instead of canon VITAE (RESOLVED 2026-07-22, commit 21c55b94)
- issue: #146
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: voice
- observation: canon term VITAE is used inconsistently against "HP"
  within the same screens — the pre-fight card mixes "hp.", "HP", and
  "vitae" for one stat; in live combat, card copy and the BLEED
  keyword tooltip both say "HP" instead of VITAE, contradicting the
  tutorial text ("The enemy has ONE bar: VITAE") shown moments before.
- evidence: quoted "level 2 · 50 hp."; "Lv 2 foe · 50 HP"; combat card
  aria-label "Slippery Slope, body card. foe loses HP each turn.";
  BLEED tooltip "Deals 3 HP per stack at the END of each round...".
- suggested fix: replace remaining "HP"/"hp" occurrences in encounter
  and card copy with VITAE per bearings' copy canon.
- source: playtester (critique pass 12)
- resolution: the two evidence quotes for the combat-card aria-label
  and BLEED tooltip were already fixed by unrelated prior work
  (verified live 2026-07-22 — no longer reproducible). The remaining
  two live occurrences (`event.engine.ts` pre-fight prelude `decode`
  and `body` strings) were the actual fix — both now read VITAE/vitae,
  matching the same function's own `fightSubtitle`.

### [MED] general — rethink early-game as canned preset-deck tutorial, defer deckbuilding to labyrinth choice
- pass: user-jot (commit 63cfb3ba)
- viewport: unspecified
- auth_state: anonymous
- category: design
- observation: for the early game / "child" levels, potentially remove the deck-building aspect entirely. Instead each battle is a canned tutorial introducing a new preset deck, teaching each mechanic in a controlled vacuum. Pre-maze gameplay is really just the tutorial: "build a boat" -> "sail to friend" -> "go to labyrinth". The labyrinth is when the player commits to which deck they want to start the game with, which dictates their reward offering for the labyrinth. When the player completes the labyrinth and lands in the new city, they gain the ability to switch base decks post-labyrinth and trade their current deck for a new mid-game deck (since during the labyrinth they earn card rewards focused on their current deck's theme).
- evidence: user-spotted at 2026-07-08T18:36:36Z
- suggested fix: [user has not specified — iterate to determine]. Related: build-plan Phase 17 (quest-board tutorial) was dropped via `/oversight` 2026-07-10 because its narrow scope overlaps this rethink — the correct next step is to route this design idea through `/iterate` or a design skill and re-derive any per-minigame tutorial phases from whatever it lands on.
- source: user

### [LOW] `web:container` dev-server script is broken
- pass: 1 (commit 6e23724a)
- viewport: n/a
- category: infra
- observation: `axiomancer-mobile/scripts/dev-server-container.sh`
  (`npm run web:container`) pulls Expo via `npx --yes expo start`
  inside a throwaway `node:20-alpine` container, which resolves a
  different/incompatible Expo CLI version than the repo's pinned
  one and fails immediately with `SyntaxError: Error reading Expo
  config at /app/app.config.ts: Unexpected token '{'`, exiting
  before it ever binds the port (`web:container:wait` then fails
  with "container is not running"). Worked around this pass by
  running `npx expo start --web --port 8081` directly on the host
  from `axiomancer-mobile/`, which uses the repo's already-installed
  Expo 54.0.35 and bundles cleanly.
- evidence: container log —
  `SyntaxError: Error reading Expo config at /app/app.config.ts`.
- suggested fix: pin the container's Expo CLI to the repo's
  installed version (e.g. run `node_modules/.bin/expo` from the
  mounted repo instead of `npx --yes expo`), or drop the container
  path in favor of the host-run command until fixed.
- source: critique pass 1

> Seeded 2026-07-03 from the retired `/archive` critique history —
> only the recurring *patterns* were carried; stale one-off rows
> were dropped. Each maps to category `external-critique`.

### [x] [MED] Engine doc-drift is chronic — RESOLVED 2026-08-02 (commit 6690c5d0, issue #164)
- New engine surfaces (status-depth constants, new spec exports)
  chronically lag `spec.md` / `docs/combat.md`. Keep a doc-sync
  check in the loop rather than trusting the docs. (Build-plan
  Phase 12 addresses the current backlog; this is the recurring
  guard.)
- resolution: this pass's manifestation — `axiomancer-mobile/docs/
  combat.md` still described the fully-retired legacy combat screen
  (deleted `app/(tabs)/combat.tsx`, the removed `resolveCombatRound`
  four-phase loop, a deleted `SkillConfirmOverlay` component, three
  dead e2e test paths) — rewritten to describe the current
  `<CombatEncounterPanel>`/`<CombatBoard>` architecture, every link
  verified to resolve. **Standing guard, not closed for good:** this
  is a recurring pattern seeded from archived critique history: a
  future pass finding NEW doc/engine drift should re-file a fresh row
  rather than treat this resolution as blanket coverage.

### [x] [MED] Wrong-engine mental model in docs — RESOLVED 2026-08-02 (commit 6690c5d0, issue #164)
- Any surviving copy in `docs/combat.md` that frames
  Hazard-Pattern Combat as "additive/secondary" or teaches
  `resolveCombatRound`-first is the wrong mental model for mobile
  integrators. Hazard-Pattern Combat is primary.
- resolution: `axiomancer-mobile/docs/combat.md` opens with an
  explicit "Hazard-Pattern Combat is the ONLY combat engine" doctrine
  banner and no longer references `resolveCombatRound` as current;
  `specs/04-combat-screen-wiring.md` (the doc it was pinned to) is now
  marked superseded. Same standing-guard caveat as the row above —
  re-file fresh if a new instance surfaces.

### [x] [LOW] Combat kill-path legibility — RESOLVED 2026-08-07 (commit 615ff26b, issue #174)
- The status kill-path (DoT / execute) is the intended win path
  but is not obviously legible on the combat board. A
  projected-lethality readout would close the gap (build-plan
  Phase 2).
- issue: #174
- resolution: build-plan Phase 2 had shipped the mechanics selector
  `projectCombatOutcome` (pending DoT / rounds-to-kill /
  lethal-in-flight), but nothing in `axiomancer-mobile` ever consumed
  it — the API existed, the board stayed illegible. Forwarded the
  projection onto `CombatEnemyPaneVM` in the enemy-pane presenter
  (`combat-encounter.engine.ts`) and rendered it on the combat board
  (`CombatCombatantPane.tsx`) as a "DOT PENDING" / "LETHAL IN N"
  readout, reusing the existing `AltWinMeter` component (same HUD slot
  as the SWAY/PREMISE alt-win meters). Added presenter coverage
  (`legibility-sweep.engine.test.ts`) pinning the hidden/pending/lethal
  states against the same fixture as mechanics' own
  `projected-lethality.engine.test.ts` e2e. Mobile lint + typecheck +
  268 files/2719 tests green.

### [x] [MED] DoT card faces print round-clock math that contradicts their own keyword glosses (RESOLVED — stale, already fixed by WI-2, issue #168)
- RESOLVED 2026-08-04 (verified stale; no new code). The trigger-clock
  source of truth this row's suggested fix asked for already exists:
  `debuffs.library.json`'s `damageOverTime.trigger` field
  (`debuff_poison` tagged `"card-played"`, `debuff_bleed` tagged
  `"damage-instance"`). It is read once in `cardCalc()`
  (`axiomancer-mobile/state/presenters/combat-encounter.engine.ts:1187-1188`,
  `out.dotTrigger`) and consumed by both the card-face generator
  (`faceStats`) and the detail-overlay generator (`detailCore`).
  Event-triggered DoT faces now read e.g. "foe loses VITAE each card
  you play" (poison) / "foe loses VITAE each time it is struck"
  (bleed) — round-clock "X over Nt turns" phrasing is emitted ONLY for
  the `dotTrigger === null` branch (genuinely round-clock/legacy
  effects), never for poison or bleed. Fix landed in commit
  `b097efec` ("Fixes from cleanup", WI-2, 2026-07-12 11:45:52) — ten
  minutes BEFORE this CRITIQUE row was even filed (11:55:20 the same
  day), so the finding was already stale at filing time. Regression
  coverage: `axiomancer-mobile/state/presenters/__tests__/card-face-honesty.guard.test.ts`
  sweeps the entire card library asserting no event-triggered DoT face
  prints round-clock phrasing; passes clean on current `main`.
- issue: #168
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: content/copy
- observation: all DoT card faces still print round-clock phrasing
  ("12 over 2t" / "foe loses HP each turn"), but the underlying
  keyword glosses (and the actual trigger, per the finding above) are
  event-triggered — per-card-played for poison, per-damage-instance
  for bleed. The face text describes a mechanic the card doesn't run.
  Same root cause as Phase 29's keyword-honesty doctrine (`plan/steps/
  01_build_plan.md` Phase 29, KW-2/5/6/7 still open) and squarely in
  Phase 32's DoT-clock scope.
- evidence: card-face aria-labels captured during the same Playwright
  session read round-clock phrasing on cards whose keyword definition
  is event-triggered.
- suggested fix: fold into Phase 32's DoT-clock work — regenerate DoT
  card-face text from the same trigger-clock source of truth once it
  exists, rather than patching copy ad hoc.
- source: playtester (owner-directed break-test session)

### [x] [HIGH] combat END-phase button has no in-flight guard — rapid clicks skip player turns (RESOLVED — already fixed by WI-3)
- RESOLVED 2026-07-18 (verified stale; no new code). The WI-3 in-flight guard shipped AFTER this 2026-07-12 critique closes it: `CombatEncounterPanel.onEndPhase` holds a SYNCHRONOUS lock (`resolvingRef.current` — a same-frame second tap finds it held on line 516 and is dropped; released only after `RESOLVE_LOCK_MS`), and `CombatBoard` renders the END medallion `disabled={resolving}` with `handleEndPhase` no-opping while resolving. Regression-tested: `CombatBoard.multistage.test.tsx` "END PHASE is disabled + press-inert while a phase is resolving" (lines 91-117) reproduces the exact 2026-07-12 double-tap-machine-guns scenario and asserts neither `onEndPhase` nor the staged-card auto-apply fires again. The queue was overstating open HIGH bugs; corrected.
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: functional
- observation: the END phase button has no in-flight/disabled guard
  while its action is resolving. Rapid clicks resolve multiple enemy
  phases in a row, letting the player's own turn get skipped entirely.
  This is a plain functional bug, not gated on any of the pending
  design phases — worth fixing standalone rather than waiting for
  Phase 31/33 to touch the turn loop.
- evidence: reproduced via Playwright rapid-click on `combat-apply-*`
  / END phase control against the running expo-web dev server; event
  log shows multiple enemy-phase resolutions per click burst.
- suggested fix: disable the END phase control (or debounce/queue its
  handler) for the duration of phase resolution.
- source: playtester (owner-directed break-test session)

### [x] [HIGH] momentum wheel's forged wild die cannot be spent — silently burns as a spare (RESOLVED — Phase 31 + dice-law rework)
- RESOLVED 2026-07-18 (verified stale; no new code). Phase 31 ("The Roll and the Read — momentum wheel engine-native", shipped `[x]`) is exactly what this 2026-07-12 critique said should absorb the die-routing bug, and the dice-law/drag rework closed it: the UI drop-eligibility `dieCanPowerCardVM` (`combat-encounter.engine.ts:383`) returns true for `die.color === 'wild'` on ANY card stance, so a floating/forged wild die is droppable everywhere; `state/presenters/__tests__/floating-die-apply.engine.test.ts` guards floating dice (incl. wild floats — "wild floats power any") applying end-to-end through the real engine and leaving `floatingDice` when spent. The auto-convert to +1◆ now only fires for a genuinely UNSPENT die at turn end (correct), not a can-never-be-spent one. Queue was overstating open HIGH bugs; corrected.
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: functional
- observation: the momentum-wheel's forged wild die is rejected by
  drop routing wherever it's dragged, so it can never actually be
  spent; instead it silently burns as a spare (+1◆) at end of turn.
  Directly relevant to Phase 31 ("The Roll and the Read" — momentum
  wheel going engine-native, `plan/tuning/2026-07-10-momentum-scoping.md`):
  the phase should absorb this concrete die-routing bug as part of
  making the wheel engine-native, not build the global wheel on top of
  a broken die-routing path.
- evidence: reproduced via Playwright drag of the forged wild die onto
  every valid-looking staged card; drop routing rejects it in every
  case; end-of-turn event log shows it converted to +1◆ Reserve
  instead of consumed.
- suggested fix: fix drop-routing acceptance for the wild die kind (or
  explicitly document+telegraph the auto-convert as intended, if it
  is) before Phase 31 builds momentum's engine-native version on top
  of it.
- source: playtester (owner-directed break-test session)

### [x] [MED] SWAY has no meter anywhere in the combat UI (RESOLVED — stale, already fixed by WI-5, issue #167)
- RESOLVED 2026-08-03 (verified stale; no new code). WI-5 (2026-07-12,
  commit `88406af8`) already shipped an `AltWinMeter` (SWAY →
  CAPITULATE, PREMISE → ORATORY) under the VITAE bar in
  `CombatCombatantPane.tsx` — `testID="combat-sway-meter"`, full
  `accessibilityRole="progressbar"` semantics, gated on
  `enemy.swayVisible` (visible once sway accrues or the preset's deck
  feeds the mechanic). Presenter-level regression coverage already
  exists: `legibility-sweep.engine.test.ts` "surfaces the SWAY meter
  with the engine capitulate target when sway accrues" pins
  `swayVisible`/`sway`/`swayTarget`. The row predates or narrowly
  missed WI-5's same-day landing; the queue was overstating an open
  MED. Corrected.
- issue: #167
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: visual/legibility
- observation: SWAY (decays 1/turn, capitulate at ≥ enemy VITAE — per
  the card-editor's own mechanic hint) has no visible meter anywhere
  in the combat UI, despite `axiomancer-card-editor` already modeling
  it as a real mechanic (see PR #68's `CardForm.tsx` SWAY field). A
  player has no way to see SWAY progress toward capitulation.
  Sequencing risk for Phase 33 (Enemy Answers, SWAY-cleanse enemies,
  `plan/tuning/2026-07-10-theme-identity.md` §1): that phase plans
  enemy counterplay against a mechanic the player currently cannot
  observe.
- evidence: full-screen accessibility snapshot of an in-progress
  combat with an active SWAY effect shows no SWAY meter/readout
  anywhere in the tree.
- suggested fix: land a SWAY meter (mirroring the Premise-track /
  disrupt-meter legibility work from Phase 28) before or alongside
  Phase 33's SWAY-cleanse enemy work.
- source: playtester (owner-directed break-test session)

### [x] [HIGH] phase 31-32's effect on the doctrine curve is unmeasured (RESOLVED 2026-07-23 — framing stale, issue #150)
- pass: session 2026-07-17 (card-text + measurement-freshness work,
  branch claude/card-text-paid-effects-3cd590, PRs #91/#92)
- viewport: n/a
- category: measurement
- resolution: RESOLVED-BY-CLARIFICATION, not by code change. The
  "unmeasured" premise no longer holds: `/digest`'s reduced-nightly
  baseline regens have re-measured the doctrine curve repeatedly since
  this row was filed — 2026-07-18 at `31f62c1e` (mid 7.3%, late 0%),
  2026-07-20 at `345cb0a6` (mid 35.3%, late 0%), 2026-07-21 at
  `c0562bb3` (mid 22.9% — the 07-18→07-20 climb reversed, late still
  0%) — all logged in `plan/AUDIT.md` "Doctrine-curve confirmation"
  rows. The pass-13 annotation above bucketed this as needing an
  in-combat capture critique's cold `critique:drive` can't reach, but
  the digest's sim-harness measurement path is independent of that
  limitation and has been supplying the read all along. The doctrine
  violation itself STANDS (late-stage flat 0% across four
  measurements now; mid-stage newly regressing) — its owner is the
  separate `[HIGH] late-stage global collapse` row below and the
  standing "Post-D8 flag-on curve repair" candidate in
  `plan/PHASE_CANDIDATES.md`, not this row. Queue was overstating open
  HIGH bugs by double-counting the same doctrine failure under two
  rows; corrected.
- observation (as filed): the checked-in deck-matrix baseline is
  stamped 2026-07-12 and `npm run baseline:check` reports it stale by
  33 mechanics-source commits — including keep-hand,
  REAP-attacks-max-HP, charm resolve milestones, Oratory milestone
  drip, TURNABOUT, OMEN v2, and OVERHEAT, the changes aimed at the
  very findings the baseline records (mid badly under ~50%, late 0.00
  for all ten presets). The fixes shipped; the validation did not.
- evidence: `npm run baseline:check` output at a99d0f64;
  `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §1.

### [x] [MED] four reward-pool spells still print generated telegraphese (RESOLVED 2026-07-23 — stale, all four ids retired)
- RESOLVED 2026-07-23 (iterate tick). All four named cards —
  straw-mans-jab, memento-mori, heart-of-the-matter, ad-nauseam — were
  retired from the live library in Phase D8 (`plan/tuning/2026-07-18-d8-preset-dice-valves.md`
  "Out (retired)" ledger), one day after this row was filed. None exist
  in `axiomancer-mechanics/src/Cards/cards.library.ts` (the current
  card-definition file) or anywhere else as live card objects — only in
  comments/tests documenting the retirement. There is nothing left to
  author `paidSummary` prose for. The underlying pattern this row
  pointed at (draft/reward cards missing authored paid text) may still
  be real for other live cards — of the library's 79 current ids, ~33
  still lack `paidSummary` — but that's a fresh finding against
  different cards, not this one. Queue was tracking dead card ids;
  corrected.
- pass: session 2026-07-17 (card-text work, PRs #91/#92)
- viewport: n/a
- category: content/copy
- observation: all 46 preset-seated spells now carry authored
  `paidSummary` prose, but the four reward/draft-only spells —
  straw-mans-jab, memento-mori, heart-of-the-matter, ad-nauseam —
  still render the generated "i2 d3"-style paid text, so a drafted
  reward card reads worse than every starter card next to it.
- evidence: `cards.library.ts` spells lacking `paidSummary`
  (grep); the paid-summary honesty guard covers them the moment
  text is added.
- suggested fix: author the four summaries through the same
  pipeline (payload dump via
  `axiomancer-mechanics/scripts/dump-paid-context.ts`, honesty guard,
  adversarial check). NOTE: heart-of-the-matter's wording is pinned
  by `grace-card-wording.engine.test.ts` — update its pins in the
  same commit.

### [x] [LOW] catalog keyword bolder still speaks dead vocabulary — RESOLVED 2026-08-06 (commit 489819a6, issue #171)
- pass: session 2026-07-17 (card-text work)
- viewport: devlog/catalog.html
- category: content/copy
- issue: #171
- resolution: pruned `KEYWORD_WORDS` in `scripts/build-catalog.mjs` to drop
  the 12 dead words. Confirmed against the mechanics guard allowlist
  (`paid-summary-honesty.engine.test.ts`) and the live mobile
  `KEYWORD_GLOSS` registry (`axiomancer-mobile/state/combat/keywords.ts`)
  that none of the 12 are real keywords. "damage" was the only one
  actually live in card text (18 bolded occurrences pre-fix, 0 after);
  regenerated `devlog/catalog.html`. Root verify green.
- observation: `scripts/build-catalog.mjs` KEYWORD_WORDS bolds words
  the spec 32 v3 registry retired or never had — DAMAGE, STUN, SLOW,
  BURN, CONFUSION, SILENCE, REGEN, EXECUTE, COMPOUND, VULNERABLE,
  BARRIER, REPRISE — so prose like "3 damage each" renders "damage"
  as a bold keyword-styled token, implying a keyword the overlay
  cannot define. Mobile bolding is honest (chip-driven); only the
  catalog over-bolds.
- evidence: The Closing Word's catalog face renders "3 DAMAGE each"
  bold; the mechanics guard allowlist
  (`paid-summary-honesty.engine.test.ts`) is the current vocabulary.
- suggested fix: prune KEYWORD_WORDS to the guard's registry +
  structural allowlist.

### [LOW] small hand-card face clips authored paid text at 3 lines
- pass: session 2026-07-17 (card-text work)
- viewport: mobile hand card (132×194)
- category: ui
- observation: authored paid sentences render up to 5 lines on the
  large/inspect face (`numberOfLines large ? 5 : 3`) but ellipsize at
  3 lines on the small hand card; longer rares (e.g. The Closing
  Word) are unreadable until inspected. May be acceptable (the owner
  doctrine says the overlay is the reading surface) — filed as an
  owner call, not a defect.
- evidence: `CombatBoard.tsx` OutcomeText numberOfLines.
- suggested fix: owner call — bump small-face lines to 4-5 (layout
  risk: name/glyph crowding) or keep 3 and accept the ellipsis.

### [x] [MED] general — color-match die riders are a fake condition; remove — RESOLVED 2026-08-07 (commit d793d607, issue #173)
- pass: user-jot (commit 486dbded)
- viewport: unspecified
- auth_state: anonymous
- category: mechanics
- issue: #173
- observation: Owner directive (2026-07-18, combat UI polish session): color-match die riders must go. Under the color law (only same-stance or WILD powers a card), the 7 library cards with an on-color dieBonus (e.g. soft-word "HEART die: SWAY 1") have a fake condition — it fires on every paid play except WILD, and the printed line reads as a replacement not a bonus. Owner: "There should be no color match riders... ignoring gold since that's a big win anyway." Open sub-call: fold the rider into the paid effect (soft-word → SWAY 4; preserves colored-die behavior, tiny WILD buff — recommended) vs drop outright (small nerf). Related residue: the global colorMatch flag (combat.engine.ts:1915) counts WILD as a match so it is ALWAYS true — the +3 Guard/Barrier COLOR_MATCH_DAMAGE_BONUS and the status-duration bonus are flat bonuses wearing conditional copy; bake the constants into base math and delete the misleading "+3 on colour match" wording (zero gameplay change). Affected: 7 cards' dieBonus fields + pricing comments (dieBonus x0.6 weight), combat.engine.ts rider path, mobile presenter colorMatchHint/armedReadValue copy.
- evidence: user-spotted at 2026-07-18T15:17:02Z
- suggested fix: [user has not specified — iterate to determine]
- source: user
- resolution: re-verified the "7 cards" count was stale — Phase 30's
  FREE-lines rewrite had already stripped `dieBonus` from 6 of them;
  only `the-burden-of-repetition` still carried the fake
  `onColor: 'match'` condition. Folded its `conviction: 1` rider
  directly into `specialMechanics` as a plain unconditional rider and
  re-priced it at full weight (was the conditional dieBonus ×0.6
  discount) — 11.40 → 12.60, still inside the printed uncommon band
  4.5-13. Reworded the momentum-wheel tooltip that misattributed the
  color-match bonus to the wild die specifically. Did NOT bake the
  flat `COLOR_MATCH_DAMAGE_BONUS`/duration bonus into unconditional
  math: the FATE Engine's X-die mechanism is a genuine, tested
  exception (`colorMatch` is correctly `false` for an X-die-powered
  play — no live card uses `fate` today, but baking the bonus in would
  silently grant it to any future fate-flagged card). That portion of
  the finding was a false premise, not a bug — closing as
  verified-not-a-bug rather than shipped. `axiomancer-mechanics` 190
  files/4085 tests green; `axiomancer-mobile` 268 files/2716 tests
  green.

## Done

### [x] [HIGH] title screen — tagline said "modern steel", contradicting the shipped anti-modern-word doctrine — RESOLVED 2026-08-14 (commit 0f408571, issue #204)
- pass: 23 (commit c063ac48)
- viewport: mobile (375×812)
- category: voice
- resolution: swapped "modern steel" for "cold iron" in the title
  screen tagline (`axiomancer-mobile/components/TitleScreen.tsx:57-58`)
  — archaic register, and doubles as folkloric ward-against-curses
  flavor for "the cursed lands await." One-line copy change, no
  code/data plumbing.
- source: critique pass 23 (unattended, critique:drive artifacts)

### [x] [LOW] [green-lit 2026-07-18] session doc-residue: three AGENTS/CLAUDE additions approved — RESOLVED 2026-07-30 (commit 7c20b4fd, issue #156)
- pass: session 2026-07-17 (measurement-freshness work)
- category: docs
- resolution: (2), promoting the PR auto-merge convention to root
  AGENTS.md, was already done in an earlier tick (root AGENTS.md
  "Pull requests" section; axiomancer-mobile/CLAUDE.md now points at
  it). This tick landed the two still-missing pieces as one docs
  commit: (1) a worktree-bootstrap note in root AGENTS.md's Verify
  section (fresh `.claude/worktrees/*` checkouts lack per-workspace
  node_modules, so `tsc` can resolve the hoisted root TypeScript and
  fail with e.g. TS5095 — `npm install` at the worktree root first
  avoids the detour) and (3) a wording-pin discipline note in
  axiomancer-mechanics/AGENTS.md's Caveats section (grace-card-wording
  + the paid-summary honesty guard pin authored prose; reword a card
  and its pin in the same commit). Root `npm run verify` green across
  all three workspaces.

### [x] [HIGH] suppurating-curse can never fire on poison or bleed (RESOLVED 2026-07-12, commit b097efec — row was stale, closed via issue #145)
- pass: owner-playtest 2026-07-12
- viewport: n/a (engine truth-probe + expo-web via Playwright)
- category: mechanics
- observation: suppurating-curse's only hook reads the round-clock
  tick pool (`dotTickBreakdown`), but poison fires on card-played and
  bleed fires on damage-instance — both event-triggered, not
  round-clock. The keyword can never observe either DoT ticking, so it
  is permanently inert against the two DoTs a player is most likely to
  pair it with.
- evidence: engine truth-probe against
  `require('axiomancer-mechanics/dist/index.js')` with a mocked
  poison/bleed-afflicted enemy — `dotTickBreakdown` never contains a
  poison or bleed entry; live expo-web combat confirms the same via
  Playwright drag-to-stage + `combat-apply-*`.
- source: playtester (owner-directed break-test session)
- RESOLVED: same-day commit `b097efec` ("Fixes from \"cleanup\"") already
  landed the fix under the WI-1 label — `combat.engine.ts` now accumulates
  real per-event DoT damage into `enemyDotDamageThisRound` (folded in
  `withLog`), and `processBetweenPhases` drips suppurating-curse off that
  accumulator plus any round-clock ticks. Verified 2026-07-21 (triage
  #145): `themed-decks.engine.test.ts` `describe('WI-1 — suppurating-curse
  doubles the round's REAL DoT total')` — 3/3 tests pass, including a live
  scenario that plays a poison card and confirms the curse exacts the same
  amount the card-played clock ticked. Pending row was stale; no code
  change needed.

### [x] [LOW] "the-closing-word" card face states a threshold that doesn't match the live floor (RESOLVED 2026-07-17, PR #91)
- pass: owner-playtest 2026-07-12
- viewport: mobile (expo-web via Playwright)
- category: content/copy
- observation: the-closing-word's card face says "CONCEDE at 8", but
  the live elite floor is 10 and the boss floor is 12 — the printed
  number is only correct against a non-elite, non-boss enemy.
- evidence: card-face aria-label captured during the Playwright
  session vs. the CONCEDE-gate constants for elite/boss floors.
- suggested fix: either make the face text stage-relative (e.g.
  "CONCEDE at the current floor") or print the correct per-stage
  numbers if the card's threshold is meant to scale with stage.
- source: playtester (owner-directed break-test session)
- RESOLVED: the authored paidSummary (PR #91) prints the per-stage
  truth — "At 8 PREMISES, CONCEDE — you win (elite 10, boss 12)" —
  the entry's option (b), enforced by the paid-summary honesty guard
  (the engine's elite/boss floor numbers must appear verbatim).

### [x] [HIGH] combat design — kill the "weak basic chip OR real status effect" fork (RESOLVED 2026-07-10, owner session)
- The parked 2026-07-09 design signal got its session: the 2026-07-10
  engagement-audit sitting ratified **Option A — constrain the fork**:
  every FREE line deposits theme currency; a weak-enough deposit may also
  carry a `DRAW 1`-class kicker; generic draw alone and all FREE damage
  banned (TICK killed registry-wide). Decisions of record:
  `plan/tuning/2026-07-10-engagement-overhaul-roadmap.md` §4; doctrine
  refined in `VISION.md`; spec 32 amendment block added; execution queued
  as EA-5 (70-card pass + FREE-currency lint) in `plan/PHASE_CANDIDATES.md`.
- source: user (ratified via owner Q&A, 2026-07-10)

### [x] [needs-user-call] Playwright MCP tools unavailable to sub-agents — RESOLVED via /oversight 2026-07-10 (switch transport)
- 8 consecutive occurrences (of 11 total passes, pass 5 through pass
  11) of the identical failure: `playtester`'s first
  `mcp__playwright__browser_*` tool call is rejected with "you
  haven't granted it yet", even when the calling session's own
  `.claude/settings.json` carries the full `mcp__playwright__browser_*`
  allowlist and the calling session itself can use those tools
  directly. Ruled out across passes: settings-file content, settings
  file git-tracked-vs-untracked status, dev-server reachability (all
  confirmed up via `curl -> 200` before every spawn). Standing
  diagnosis (unchanged since pass 6): the grant is session-scoped and
  does not propagate into Agent-tool sub-agent contexts — a
  structural gap, not a config problem. Zero product findings across
  all 8 occurrences.
- decision (via `/oversight` 2026-07-10): stop retrying the grant
  mechanism. Give `/critique` a headless, non-Agent-tool transport
  for unattended ticks instead — a standalone script driving the
  expo-web build directly as a subprocess, not an MCP-gated
  sub-agent. Interactive `playtester` usage elsewhere is unaffected;
  this only covers the unattended-loop path. Tracked as build-plan
  **Phase 34**; `skills/critique.md` gets a matching note once
  Phase 34 lands.
- source: `/oversight` 2026-07-10, synthesizing critique passes 5-11

### [x] [needs-user-call] Playwright MCP tools unavailable to sub-agents (pass 1-4; addressed at 525cd25 follow-up)
- Root cause: two allowlist gaps, not a Playwright bug. (1)
  `.github/workflows/_claude-skill.yml`'s `--allowedTools` CLI flag
  was a fixed list that never included any `mcp__playwright__*` tool,
  even when `install_playwright: true` installed the browser. (2)
  `.claude/settings.json.example` (activated as `.claude/settings.json`
  for every unattended CI run) had no `mcp__playwright__*` entries in
  `permissions.allow` either. Unattended runs auto-reject tools outside
  both allowlists instead of prompting, so every `playtester`
  `browser_*` call failed instantly.
- Fix: `--allowedTools` in `_claude-skill.yml` now appends the 14
  `mcp__playwright__browser_*` tools whenever `install_playwright` is
  true; `.claude/settings.json.example` grants the same 14 tools in
  `permissions.allow`. Also unblocks `deep-playtest`, `combat-ux-tuning`,
  `critic-loop`, and `hermes-playtest`, which share the same runner and
  had the identical gap.
- User-owned decision, applied on explicit user request (not a
  self-grant by `/critique` or `/march`).
