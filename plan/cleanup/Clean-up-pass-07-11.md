# Clean-up pass — combat playtest findings (expo-web break-test)

> Status: **PROPOSED** · Created 2026-07-12 (evidence session: live Playwright
> break-test of the `/combat-encounter` sandbox + pure-engine probes against
> `dist/`) · Scope: fix the player-facing lies, dead mechanics, and input
> hazards found in the 2026-07-12 playtest. **No numeric re-tuning here** —
> balance work stays behind Gate 0 / EA-2's honest baseline.

Repro context for every finding: dev server on :8081, sandbox
`/combat-encounter?seed=N`, decks pinned via `globalThis.__AXM_COMBAT_DECK__`,
driven with Playwright real-mouse drags (the RNGH board ignores synthetic
pointer events — `setPointerCapture` throws on fake pointer ids). Engine
probes: `require('axiomancer-mechanics/dist')` + the `combat.mock.ts` Brine
Hag (elite, 90 HP).

Cross-references: EA-3..EA-8 queue (`plan/PHASE_CANDIDATES.md`), keyword
registry (`plan/tuning/2026-07-10-keyword-registry.md`), turn-texture / FREE
line law (`plan/tuning/2026-07-10-turn-texture.md`), dice-law handoff
(`plan/HANDOFF-2026-07-09-dice-law-rework.md`).

---

## P0 — mechanics that are lying or dead

### WI-1 · `suppurating-curse` can never fire on POISON/BLEED (inert in its own deck)

**Symptom.** Face: "Doubles the total POISON and BLEED damage the enemy takes
each round." In play (EROSION, its home deck) it never dealt a point.

**Root cause.** Its only hook is the round-clock path:
`combat.engine.ts:3015` gates on `enemyDotTicks.length > 0`, where
`enemyDotTicks` comes from `dotTickBreakdown` (`combat.engine.ts:3347`), which
**filters to round-clock DoTs only** (`dotRoundClockPhase(dot) !== null`,
`effect-modifiers.ts:63`). `debuff_poison` (`trigger: 'card-played'`),
`debuff_bleed` (`'damage-instance'`), and `debuff_strong_poison` are all
event-triggered → excluded → the drip is structurally zero for the exact
families the card names.

**Fix.** Make the curse ride the event ticks instead of the (empty)
round-clock pool:

1. Add a per-round accumulator to `CombatEncounterState`:
   `enemyDotDamageThisRound: number` (reset in `processBetweenPhases`).
2. At every enemy-target `dot-tick` emission site in `combat.engine.ts`
   (card-played tick, damage-instance tick, fate-tap tick, TICK free-line —
   grep `kind: 'dot-tick'` with `target: 'enemy'`), add the tick amount to the
   accumulator *after* `applyDamage`.
3. In `processBetweenPhases`, replace the `enemyDotTicks` gate at
   `combat.engine.ts:3015` with
   `if (zoneHas(state,'suppurating-curse') && state.enemyDotDamageThisRound > 0 && !isDefeated(enemy))`
   and drip `state.enemyDotDamageThisRound` (this preserves the "doubles"
   semantics: the drip equals the round's real DoT total).
4. Keep the old round-clock sum **added into** the accumulator too, so
   round-clock DoTs (burn/frostbite/doom-family) still count if they ever
   reach the enemy.

**Verify.** New engine e2e: EROSION opener (poison + 2 more card plays same
turn) with `suppurating-curse` attached → end phase → assert enemy HP dropped
by 2× the ticked amount and a `Suppuration` event fired. Existing suite green.

### WI-2 · Every DoT card face prints round-clock fiction

**Symptom.** Faces say `◆ BLEED 12 over 2t` / `◆ POISON 10 over 4t`, a11y/verb
line says "foe loses HP each turn", and the engine-side text builder prints
"(12 HP over its run)". Reality (post trigger-migration): poison ticks **per
card played**, bleed **per damage instance** — passive play deals literally 0
(engine-verified: poison sat 5 rounds, expired, zero damage). The keyword
glosses in `keywords.ts` are already honest, so the face and the gloss on the
same card contradict each other.

**Fix.** Derive the face math from the effect's trigger family instead of
assuming a round clock:

1. `state/presenters/combat-encounter.engine.ts:1205` (`case 'dot'` in
   `faceStats`) and `:1264` (detail overlay): branch on
   `lookupEffect(effectId).payload.damageOverTime.trigger`:
   - `card-played` → heroText `2/play` (dpr × intensity), heroSub
     `per card you play · Nt`, verbLine `foe loses VITAE each card you play`.
   - `damage-instance` → heroText `3/hit`, heroSub
     `per hit taken · N stacks`, verbLine
     `foe loses VITAE each time it is struck`.
   - round-clock (no trigger / `round-start` / `round-end`) → keep the
     existing `total over Nt` face.
   Kill the flat `'foe loses HP each turn'` string (it is also the stray-"HP"
   copy CRITIQUE already flags — use VITAE).
2. Same branch in the detail overlay's `outcomeStats`/`mathLine` (`:1264`) —
   the "PER TURN / TURNS / TOTAL" table is wrong for event DoTs; replace with
   "PER TICK / TRIGGER / DURATION".
3. `axiomancer-mechanics/src/Combat/combat.cards.ts:325` — the
   `(N HP over its run)` suffix in `bottomActionText`: gate it to round-clock
   DoTs; for event DoTs print `(2/play)` / `(3/hit)`.
4. **Guard test** (extend the card-face-honesty sweep): for every library card
   whose `primaryEffectId` is an event-triggered DoT, assert the rendered face
   does NOT contain `over \d+t` and DOES name the trigger. This is what let
   the migration ship half-done — the guard checked keywords, not math lines.

**Verify.** Presenter sweep test + eyeball EROSION/TITHE faces in the sandbox.

### WI-3 · END-phase button has no in-flight guard (double-tap eats enemy phases)

**Symptom.** Three rapid clicks on END from R1·T1 resolved three consecutive
threat phases (player 160→107) with zero player turns between them. A touch
double-tap loses a whole turn and eats an escalated hit.

**Fix.** Debounce at the panel layer (the engine is correctly permissive —
`endTurn` any time is lawful; the UI must not machine-gun it):

1. `CombatEncounterPanel.tsx`: add `const resolvingRef = useRef(false)` around
   the end-phase dispatch — set on entry, clear when the between-phases
   transition (and its fx timeline) completes.
2. Thread `resolving` into `CombatBoard`'s end-phase button
   (`CombatBoard.tsx:547` `testID="combat-end-phase"`, handler at `:931`):
   `disabled={resolving}` + dimmed style, same disabled treatment every other
   control uses.
3. While resolving, also suppress card staging/apply (the same race lets a
   drag land mid-resolution — handoff already flags "dragging during phase
   resolution" as un-verified).

**Verify.** Playwright: click END 3× with 50ms gaps → assert exactly one phase
advanced. Jest: button renders disabled while `resolving`.

### WI-4 · Momentum wheel payoff die is unusable (burns as a spare)

**Symptom.** Completing ♥→⚡→★ forges `combat-die-momentum-1` (wild) into the
tray — which then (a) cannot be dragged onto a second card (drop routing keeps
resolving the drafted die; the momentum die never socketed in repeated
attempts), (b) renders with the spare hint `→ +1 ◆`, and (c) vanishes at end
of turn. Net payoff of the marquee mechanic: ~1 Conviction.

**Root cause.** `CombatEncounterPanel.tsx:431-434` grants it as a **plain tray
die** (`{ id, color:'wild', state:'available', temporary:true }`). Only
`reserve`/`floating` dice stay draggable once a draft exists
(`CombatBoard.tsx:205-213`, presenter-computed `die.draggable`), and plain
tray dice are burned/cleared with the tray.

**Fix.** Grant it as a **floating** die: add `floating: true` at
`CombatEncounterPanel.tsx:432`. Spec 32 v3 §5 already gives floating dice
exactly the intended semantics: second power source, bypasses the 1-die draft,
never banks, consumed on apply. Keep `temporary: true` so it stays
combat-local (momentum should not carry across combats the way Forge floats
do — owner ratified the wheel as a hazard-carry system, engine port is EA-6;
this WI is the minimal host-side correction, not the port).

Also fix the counter/hint mismatch: `advanceWheel` (`momentum.ts:50`) accepted
a play of the requested stance yet reported the SAME lit count with a new
"next stance" (observed: ♥ lit → "next MIND" → played MIND → still "1 of 3,
next BODY"; a different run hinted "next BODY" from the identical state).
Unit-test `advanceWheel` for: lit set growth on every accepted stance,
deterministic next-hint, reset semantics on a wrong stance — then make the
aria string derive from the same return value the wheel state uses.

**Verify.** Playwright: complete the wheel, drag the momentum die onto a
second staged card the same turn → powered play resolves; die absent from
tray afterwards; wheel resets. Jest on `advanceWheel` truth table.

### WI-5 · SWAY has no meter — an invisible win condition

**Symptom.** `state.sway` accumulates, decays (`SWAY_DECAY_PER_TURN`), and
ends the fight at `capitulateThreshold(enemy)` — and no combat surface renders
it. GRACE (a whole preset whose only plan is SWAY) played its core line every
turn and died at R7 with the player having zero feedback on progress.

**Fix.**

1. Presenter: extend the enemy `CombatantVM`
   (`combat-encounter.engine.ts:~516`) with
   `sway: number` and `swayTarget: number` (from `state.sway` and
   `capitulateThreshold(state.enemy)` — both engine-exported).
2. `CombatBoard` combatant pane: render a slim labeled meter (🕊 SWAY n/target)
   under the VITAE bar, visible when `sway > 0` **or** the player's deck/hand
   contains a sway-verb card (so GRACE sees it from turn 1). Reuse the intent
   chip styling; add `testID="combat-sway-meter"`.
3. While at it, surface the PREMISE tally the same way for ORATORY
   (`state.premises` — same invisible-win-currency problem, one meter
   component covers both).

**Verify.** Playwright GRACE run: meter present from first sway gain, value
matches engine events; capitulation now legible as "n/target" climbing.

---

## P1 — trust and robustness

### WI-6 · `the-closing-word` face: "CONCEDE at 8" is wrong vs elites and bosses

Engine floors: base 8 / elite 10 / boss 12
(`CONCEDE_PREMISES_{BASE,ELITE,BOSS}`, applied at `combat.engine.ts`
concede resolution — `effectiveConcedeAt = max(decl.concedeAt, tierFloor)`).
The face prints the base number unconditionally; vs the sandbox elite it's
simply false.

**Fix.** In the presenter (which holds live enemy difficulty), render the
effective threshold on the face/detail ("CONCEDE at 10 vs this foe"); in the
static catalog/card-editor context print the ladder ("CONCEDE at 8 / 10 elite
/ 12 boss"). Same treatment for the Premise gloss's ladder (already correct)
→ single source: export a `concedeFloorFor(difficulty)` helper from the
engine and use it in both texts.

### WI-7 · Drag lifecycle: interrupted pointer streams leave permanent ghosts and can wedge staging

Observed (real input included): duplicate die nodes with the same `testID`
after a socket drag (`combat-die-t1-d2` ×2), a stale turn-1 die still in the
DOM in turn 2 reading "available to draft" to a11y, a stuck
"DENIED / release to stage" hint, and one session where every subsequent
stage-drag was silently ignored until reload. The engine refused every
exploit attempt (good), but the board's drag state machine doesn't always get
an end event. `CombatBoard.tsx:212`'s comment shows this class was fixed once
for the unmount path; the cancel path is still open.

**Fix.**

1. In the drag controller, subscribe to `pointercancel`, window `blur`, and
   `visibilitychange` → call the existing `endJS(-1, -1)` finalizer (snap
   home, clear ghost, clear `DENIED`).
2. Watchdog: if a live drag receives no move/update for ~4s, finalize it the
   same way (covers the killed-stream case outright).
3. Give the drag ghost its own `testID` (`combat-drag-ghost`) and
   `accessibilityElementsHidden` — the ghost currently clones the source
   node's testid and aria, which is what produced duplicate dice and
   phantom "available to draft" entries for screen readers.

**Verify.** Playwright: start a drag, dispatch `pointercancel` → board fully
interactive, no ghost node, staging works. A11y snapshot: one node per die.

### WI-8 · `sig-overwhelming-argument` — align the effect with the text (owner decision)

Known from the audit that the description is wrong (it applies BACKFIRE, not
petrify). New behavioral proof: 4 casts (32◆) in one fight, enemy attacked
through every one, enemy HP never moved — BACKFIRE only pays on rung loss,
which pure signature play never causes. As shipped, the 8◆ flagship does
nothing observable.

**Options (pick one, then this WI is mechanical):**
- **A (match the text):** implement real hard control — apply a `skipTurn`
  control effect for 1 phase (bosses: weaken instead, or resist once), which
  `canAct` at `resolveThreatPhase` already honors. Cost 8◆ supports it.
- **B (match the effect):** keep BACKFIRE but bundle `STAGGER 2` so the
  backfire actually pays, and rewrite the description ("brace the argument —
  the next telegraph loses rungs and bleeds for each").

Either way: description, `SIGNATURE_SKILLS` entry, and a funded-path e2e
(the Phase-1 witness exists — extend it to assert *observable enemy state
change*, not just resolution).

### WI-9 · Attribution ledger vs the VITAE bar disagree

Defeat screen credited "Straw Man's Jab — 27 dmg (Total DoT damage: 27)"
while the enemy bar read 90/90 in the same frame (bar verified live in other
runs — it moved to 76/90 when poison really ticked). The audit already
recorded ledger phase-count nonsense ("38 phases in a 3-phase fight"); this
adds a damage-total mismatch. `buildCombatSummary` is counting ticks that
never reached `applyDamage` (probably projecting per-phase DoT rather than
summing emitted `dot-tick` events).

**Fix.** Make the summary aggregate **emitted events** (`dot-tick`,
`damage-instance`, reflect/backfire drips), not projections; add a
reconciliation assert in dev builds: sum(attributed) ==
enemy.maxHealth - enemy.health at combat end (± heals). Unit test on a
scripted fight.

### WI-10 · Scrap income is ungated (design decision, pre-emptive)

`discardCombatCard` (`combat.engine.ts:765`) pays +1◆ per card, no per-turn
gate; the hand refills to 6, so scrap-the-hand is +6◆/turn against a 12 cap.
Today it isn't exploitable *only because signatures are broken* (WI-8); the
audit's charm evidence (~50 farmed casts) shows the sims already live in this
loop. Recommend: scrap pays ◆ only for the **first N (=2?) scraps per turn**
(further scraps still cycle the card, no ◆), enforced engine-side next to the
existing `phase !== 'phase-play'` guard, with a `conviction-gained` event
carrying `reason: 'scrap'` so the cap is testable. Tune N under EA-2's
baseline, not here.

---

## P2 — wordage & legibility batch (one sweep PR)

- **APPLY strip labels** (`StagedCard`, `CombatBoard.tsx`): `APPLY · FREE` /
  `APPLY —` / `APPLY ◆` — the suffix is the read pip / die state rendered as
  a bare glyph. Spell it out: `APPLY · FREE`, `APPLY · EVEN READ`,
  `APPLY · BODY DIE`, etc.
- **Tray hints lie in the future tense** (`DiceRow`, `CombatBoard.tsx:254`):
  after drafting, spares show `→ +1 ◆` and read "available to draft" to a11y,
  but conversion already happened at draft (`draftStanceDie`,
  `combat.engine.ts:599-615`). Post-draft: label `burned +1 ◆` (or `BANKED`),
  aria "spent — burned for Conviction", and drop the stale "available to
  draft".
- **`⬡ HEART ×3 spent: SWAY 2` notation** (common-ground, ex-nihilo,
  heart-of-the-matter, undistributed-middle…): nothing defines it. Add a
  gloss row to `KEYWORD_GLOSS` (threshold rider: "fires once you have spent
  N dice of that color this combat" — confirm exact semantics from
  `synergy-predicates.ts` first) and a `⬡` legend line in the card detail
  overlay.
- **HP → VITAE sweep** (CRITIQUE already tracks stray copy): a11y card labels
  ("foe loses HP each turn" — dies with WI-2), `Heal` gloss "VITAE (HP)",
  detail-overlay math lines, befriend text "enemy HP". Grep-driven:
  `grep -rn "\bHP\b" axiomancer-mobile/state axiomancer-mobile/components/combat`.
- **Enemy status chips show a bare number** (🩸 3): pick one meaning
  (stacks/intensity), render duration as a ring or `·2t` suffix, and put the
  full breakdown in the chip inspect (`onChip` already exists).
- **Pre-fight telegraph understates damage**: preview prints base (`+7
  damage`) while the live phase shows the escalated/modified hit (♥7 →12).
  The reveal screen should run the same
  `projectIncomingThreat`/escalation math the in-combat intent chip uses.
- **Hand fan wrong-card grabs**: with the overlap layout, the pan target of a
  covered card sits under its neighbor — real drags from a card's visible
  center grab the top card (my scripted runs repeatedly staged the neighbor;
  thumbs will too). Until the Option-A face redesign lands, clamp each hand
  card's hit target to its **visible strip** (left edge for covered cards) or
  raise-on-touch before pan activation.
- **Enemy art swaps mid-fight** (blue hag → fur-mask figure by phase 4/4 in
  the sandbox): confirm this is an intentional phase-form reveal; if not, the
  portrait picker is re-rolling per phase.
- **TICK / FREE-draw rework (Phase 30, listed here for the sweep's
  checklist):** FREE-tick cards (10): delphic-ambiguity, festering-argument,
  peroratio-interrupta, resonance-detonation, self-flagellant, slippery-slope,
  straw-mans-jab, sweet-poison, the-reaping, winnowing. FREE "draw 1" alone
  (11, violates the ratified generic-draw ban): cassandras-burden,
  circular-reasoning, common-ground, currys-conversion, fallen-grace,
  ouroboros, paralysis-of-analysis, red-herring, refrain, second-thoughts,
  sketch-of-a-thought. Do not fix ad-hoc here — this list feeds the Phase 30
  rework so nothing is missed.

---

## Verify (whole pass)

- `npm run verify` green in all three packages.
- Engine e2e additions: WI-1 suppuration drip, WI-8 signature witness,
  WI-9 ledger reconciliation, WI-10 scrap gate.
- Presenter guard test extended per WI-2 (trigger-aware face math).
- Playwright sandbox passes (patterns in the 2026-07-12 session scratchpad,
  trivially re-creatable): END-race (WI-3), momentum second-play (WI-4),
  sway meter (WI-5), pointercancel recovery (WI-7).
- Manual: one EROSION and one GRACE sandbox fight reading every face touched.

## Non-goals

- No numeric re-tuning (blocked behind Gate 0 / EA-2 doctrine curve).
- No engine port of the momentum wheel (EA-6 owns it; WI-4 is the minimal
  host-side correction).
- No DoT trigger-family redesign — triggers are owner-ratified; this pass
  makes the UI/text and dependent mechanics (suppurating-curse) honest about
  them.
- Known items already queued elsewhere and deliberately not duplicated:
  repricing tranche (EA-3), theme identity (EA-7), `buff_grace_momentum`
  rename, hand-face Option-A layout redesign.
