# Critique log

> Last pass: 2026-07-17 at commit b4870384
> Pass count: 13

> External-observer feedback for Axiomancer. Populated by
> `/critique` (which drives the local expo-web build with the
> `playtester` agent — there is no hosted URL), drained by
> `/iterate`. See `skills/critique.md` for the contract and
> `plan/bearings.md` § Surface for the local-build adaptation.

## Pending

> **[owner session, 2026-07-18 — THE FLIP residue] Upgradeable Dice is now ON
> for every app build** (owner call, overriding D7's stays-OFF default): the
> app root (`axiomancer-mobile/state/combat/flags.ts`) forces the spec-33
> model on all surfaces; only the explicit `EXPO_PUBLIC_UPGRADEABLE_DICE=0` /
> `__AXM_UPGRADEABLE_DICE__='0'` kill-switch keeps the legacy model. THE
> STAKE's wager UI is retired on every surface (completing spec 33 §5).
> Follow-ups this creates:
> - **F3 is now LIVE-player-facing**: Press Fate never renders because no
>   starter loadout equips a `reroll`-kind signature (`sig-press-the-point`) —
>   the flag-on economy's only ◆ sink is dead and misses can't be rerolled.
>   Was a D7 canary; now it's the owner's daily experience. Highest-priority
>   fix (equip the signature on starter loadouts + D7 re-run).
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

### [HIGH] tuning harness — policy-pick draft scorer starves new/sandbox cards
- pass: session-closeout 2026-07-12 (commit ffadca96, branch claude/axiomancer-dawncaster-comparison-cz6008)
- viewport: n/a
- category: tuning-harness
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

### [HIGH] late-stage global collapse — all 10 presets 0.00 late
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

### [MED] control-lock sim policy is threat-blind — WS8 surface variety unexploited
- pass: session-closeout 2026-07-12 (commit ffadca96)
- viewport: n/a
- category: tuning-harness
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

### [HIGH] title screen — wordmark cropped above the mobile fold
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

### [HIGH] combat tutorial never teaches the drag-to-play gesture
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

### [MED] persistent header VITAE bar doesn't update during combat
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
- source: playtester (critique pass 12)

### [MED] pre-fight enemy preview disagrees with live combat VITAE
- pass: 12 (commit 3dc27d24)
- viewport: mobile
- category: inconsistency
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

### [MED] card/tooltip copy still says "HP" instead of canon VITAE
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

### [MED] Engine doc-drift is chronic
- New engine surfaces (status-depth constants, new spec exports)
  chronically lag `spec.md` / `docs/combat.md`. Keep a doc-sync
  check in the loop rather than trusting the docs. (Build-plan
  Phase 12 addresses the current backlog; this is the recurring
  guard.)

### [MED] Wrong-engine mental model in docs
- Any surviving copy in `docs/combat.md` that frames
  Hazard-Pattern Combat as "additive/secondary" or teaches
  `resolveCombatRound`-first is the wrong mental model for mobile
  integrators. Hazard-Pattern Combat is primary.

### [LOW] Combat kill-path legibility
- The status kill-path (DoT / execute) is the intended win path
  but is not obviously legible on the combat board. A
  projected-lethality readout would close the gap (build-plan
  Phase 2).

### [HIGH] suppurating-curse can never fire on poison or bleed
- pass: owner-playtest 2026-07-12
- viewport: n/a (engine truth-probe + expo-web via Playwright)
- category: mechanics
- observation: suppurating-curse's only hook reads the round-clock
  tick pool (`dotTickBreakdown`), but poison fires on card-played and
  bleed fires on damage-instance — both event-triggered, not
  round-clock. The keyword can never observe either DoT ticking, so it
  is permanently inert against the two DoTs a player is most likely to
  pair it with. Directly relevant to Phase 32 / EA-7 (trigger-clock DoT
  substrate, `plan/tuning/2026-07-10-theme-identity.md` §2): this is
  the exact class of bug that phase is supposed to formalize away, and
  should be treated as its starting state rather than rediscovered
  mid-phase.
- evidence: engine truth-probe against
  `require('axiomancer-mechanics/dist/index.js')` with a mocked
  poison/bleed-afflicted enemy — `dotTickBreakdown` never contains a
  poison or bleed entry; live expo-web combat confirms the same via
  Playwright drag-to-stage + `combat-apply-*`.
- suggested fix: either re-hook suppurating-curse off the
  event-triggered clocks directly (per-card-played / per-damage-instance)
  or fold it into whatever unified trigger-clock substrate Phase 32
  builds — do not ship Phase 32 without closing this specific keyword.
- source: playtester (owner-directed break-test session)

### [MED] DoT card faces print round-clock math that contradicts their own keyword glosses
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

### [MED] SWAY has no meter anywhere in the combat UI
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

### [HIGH] phase 31-32's effect on the doctrine curve is unmeasured — full confirmation rebaseline needed
- pass: session 2026-07-17 (card-text + measurement-freshness work,
  branch claude/card-text-paid-effects-3cd590, PRs #91/#92)
- viewport: n/a
- category: measurement
- observation: the checked-in deck-matrix baseline is stamped
  2026-07-12 and `npm run baseline:check` reports it stale by 33
  mechanics-source commits — including keep-hand, REAP-attacks-max-HP,
  charm resolve milestones, Oratory milestone drip, TURNABOUT, OMEN
  v2, and OVERHEAT, the changes aimed at the very findings the
  baseline records (mid badly under ~50%, late 0.00 for all ten
  presets). The fixes shipped; the validation did not.
- evidence: `npm run baseline:check` output at a99d0f64;
  `plan/tuning/2026-07-11-honest-rebaseline-and-evidence.md` §1.
- suggested fix: run the FULL confirmation pass —
  `npm run baseline:regen` at seeds 1/2/3 (or the manual harness per
  the rebaseline doc) — and judge the new curve against the locked
  80/50/25-35/0 doctrine. The nightly digest's reduced pass
  (`--runs=30 --confidence=reduced-nightly`, live since #92) gives a
  directional read automatically, but close calls need the full
  multi-seed measurement before `/deck-tuning` acts.

### [MED] four reward-pool spells still print generated telegraphese
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

### [LOW] catalog keyword bolder still speaks dead vocabulary
- pass: session 2026-07-17 (card-text work)
- viewport: devlog/catalog.html
- category: content/copy
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

### [LOW] [green-lit 2026-07-18] session doc-residue: three AGENTS/CLAUDE additions approved — land via /iterate
- pass: session 2026-07-17 (measurement-freshness work)
- viewport: n/a
- category: docs
- observation: three small doc additions were proposed to the owner
  and awaited their call when this was filed: (1) AGENTS.md worktree
  bootstrap note — fresh worktrees lack per-workspace node_modules,
  so tsc resolves the hoisted TypeScript (5.9.3 vs the workspace's
  6.0.3) and fails on tsconfig; "npm install at the worktree root
  first" saves the detour. (2) Promote the PR auto-merge convention
  from axiomancer-mobile/CLAUDE.md to root AGENTS.md (it applies
  repo-wide). (3) Mechanics-side note on wording-pin discipline:
  grace-card-wording + the paid-summary honesty guard pin AUTHORED
  prose — reword a card and its pins in the same commit, never
  silence a guard.
- suggested fix: on green-light, land all three as one docs commit.
- RESOLVED (owner call via /oversight 2026-07-18): **green-light all
  three.** Decision recorded here; the docs edit itself is a shipped-path
  change, so oversight does not land it — routed to `/iterate` to commit
  all three as one docs commit (AGENTS.md worktree-bootstrap note; promote
  the PR auto-merge convention mobile CLAUDE.md → root AGENTS.md; mechanics
  wording-pin discipline note).
- next: /iterate (land the three approved doc additions as one docs commit)

### [MED] general — color-match die riders are a fake condition; remove
- pass: user-jot (commit 486dbded)
- viewport: unspecified
- auth_state: anonymous
- category: mechanics
- observation: Owner directive (2026-07-18, combat UI polish session): color-match die riders must go. Under the color law (only same-stance or WILD powers a card), the 7 library cards with an on-color dieBonus (e.g. soft-word "HEART die: SWAY 1") have a fake condition — it fires on every paid play except WILD, and the printed line reads as a replacement not a bonus. Owner: "There should be no color match riders... ignoring gold since that's a big win anyway." Open sub-call: fold the rider into the paid effect (soft-word → SWAY 4; preserves colored-die behavior, tiny WILD buff — recommended) vs drop outright (small nerf). Related residue: the global colorMatch flag (combat.engine.ts:1915) counts WILD as a match so it is ALWAYS true — the +3 Guard/Barrier COLOR_MATCH_DAMAGE_BONUS and the status-duration bonus are flat bonuses wearing conditional copy; bake the constants into base math and delete the misleading "+3 on colour match" wording (zero gameplay change). Affected: 7 cards' dieBonus fields + pricing comments (dieBonus x0.6 weight), combat.engine.ts rider path, mobile presenter colorMatchHint/armedReadValue copy.
- evidence: user-spotted at 2026-07-18T15:17:02Z
- suggested fix: [user has not specified — iterate to determine]
- source: user

## Done

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
