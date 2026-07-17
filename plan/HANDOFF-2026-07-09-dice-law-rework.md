# HANDOFF — dice-law rework + card wording (2026-07-09)

> **SUPERSEDED (2026-07-17, Phase D1):** the dice law recorded here
> (3 dice / draft 1 / shared face-bag / unpicked-die Conviction) is retired
> by spec 33 (`axiomancer-mechanics/specs/33-upgradeable-dice.md` — four
> fixed-color dice with gear-carried progression). Historical document.
> Still in force from this session: **THE COLOR LAW** (ported into spec 33
> §1) and the open card-audit items under "OPEN — case-by-case card audit."

> **PICKED UP 2026-07-10** (branch `claude/pr57-handoff-testing-lkhn6v`, stacked
> on PR #57): Option A card face SHIPPED at both sizes (+ card-editor type-strip
> mirror); cross-combat float persistence + dieBonus color-law lint pinned in
> mechanics e2e; the "drag a floating die onto a card" item was MACHINE-VERIFIED
> live in expo-web (trusted CDP input activates RNGH — synthetic JS events were
> the earlier blocker) and exposed a REAL bug: `draggable` flipped false the
> moment a float/Reserve die's own drag began, unmounting its GestureDetector
> mid-gesture — on web the pan died without onEnd, the drop never resolved and
> the ghost stuck on screen. Fixed (draggability is now presenter-owned on
> `CombatDieVM.draggable`, never a function of live drag state) and pinned.
> Still open below: the DESIGN SIGNAL (owner session), the case-by-case card
> audit, tu-quoque's dead line (lint whitelists it), and the tuning candidates.

Owner-directed session (not a /ship-a-phase). All changes are **uncommitted on
`main`'s working tree** as of this handoff. Root `npm run verify` passes green
(mechanics 2285 · mobile 2473 · card-editor typecheck).

## The three owner directives (locked decisions, via AskUserQuestion)

### 1. Floating dice (spec 32 v3 §5 — rules confirmed, UI was broken)
- Apply to any card **matching their color**; a WILD (gold) float matches everything.
- **Do NOT count against the 1-die-per-round rule** — ALL floats may be spent in one round.
- **Consumed permanently** when applied (leave the persistent pool forever).
- **Never bank tokens.**
- Bug reported: dragging a float showed a card ghost for a frame, then snapped back.

### 2. Dice model rework (reverts "any die powers any card")
- **3 dice rolled per round** (`TURN_DICE_COUNT = 3`), **no stance-die guarantee**
  (an honest roll; a colorless roll is a pure token round).
- Player applies **1 rolled die** per round (the existing stance draft).
- **THE COLOR LAW**: a die only powers a card of ITS color; WILD/gold is the sole
  exception. Off-color plays hard-fizzle.
- Unused rolled dice → **generic tokens** (= the existing Conviction ◆ pool, which
  already funds signatures): colored +1, **gold +2**, dead X +0.
- X→gold conversion is **card-effects only**: new `float_x_die` mechanic
  (TRANSMUTE: dead X in tray → WILD floating die; no X / at cap 3 → +1 ◆),
  carried by `bootstrap-loop`.
- The self-reinforcing chain (new status refreshes the applied die) was KEPT —
  load-bearing status doctrine; "1 rolled die" = the same die refreshed.

### 3. Card wording (no ambiguity)
- Face: name, type (**SPELL / ENCHANTMENT / CURSE** — disenchant prints as CURSE),
  keywords + inline numbers, necessary keyword-related lines only.
- **EXACT same face wording in hand and in the detail overlay** (single shared renderer).
- Overlay: precise keyword definitions at **TOP** → identical face → pills/color-law
  legend → **flavor text at BOTTOM** (face carries no flavor).
- Keyword definitions must state exactly what the keyword does (stats, timing,
  consumption). Bespoke-card wording: **case-by-case, owner decides** (audit below).

## What was changed (by file)

### axiomancer-mechanics (engine)
- `src/Combat/combat.dice.ts` — `TURN_DICE_COUNT` 2→3; stance-guarantee REMOVED
  from `rollTurnDice` (kept in `rerollSpentDice`/Press Fate).
- `src/Combat/combat.engine.ts` —
  - new const `CONVICTION_PER_UNPICKED_WILD = 2`;
  - `draftStanceDie`: per-die token accrual loop (colored +1 / wild +2 / X +0;
    a banked die earns nothing);
  - `endTurn`: unspent drafted wild burns for 2;
  - `playBottomAction` step 1b: **the color law fizzle** (drafted/reserve/floating
    must match `card.stance` or be wild; fate-X acts wild);
  - `chooseDraft`: match-first ordering (match+read-win → match → read-win → first),
    now also excludes floating dice from the draft pick;
  - new mechanic handler `case 'float_x_die'` (modeled on `forge_floating_die`;
    `transmutedXIds` tracked and filtered from the tray in step 5).
- `src/Cards/types.ts` — `float_x_die` union member.
- `src/Cards/cards.pricing.ts` — `float_x_die` = full wild FORGE × `CONDITION_DISCOUNTS.fate`
  + conviction floor (≈6.6 pts).
- `src/Cards/cards.library.ts` — `bootstrap-loop`: KINDLE wild → `float_x_die`;
  description + pts comment updated; still in the 4.5–13 uncommon band.
- `src/Combat/combat.cards.ts` — `mechanicText` case for `float_x_die`.
- `src/Combat/combat.encounter.sim.ts` — `selectCard` gained a `matchColor` filter;
  play-selection + reserve-die plays are color-legal.
- `src/Combat/combat.autoplay.ts` — same `matchColor` filter in `bestAutoCard`.
- Barrels: `CONVICTION_PER_UNPICKED_WILD` exported from `Combat/index.ts` + `src/index.ts`.
- Tests updated (rules legitimately changed): `themed-decks` (5 fixes),
  `hazard-pattern-combat` (3-die pool test, per-die/wild-token tests, adv/dis
  comparison rework, off-color-fizzle test added, Press Fate seed removal,
  wild variety-chain), `fate-engine` (body reserve die), `status-depth` (RUP=mind),
  `preview-truth` (off-color test → color-law fizzle test),
  `combat-sim-policies` (pins re-measured), `card-effectiveness` (float_x_die case),
  `combat-playtest.balance-bands` — **KNOWN_CURVE_VIOLATORS re-derived:
  now `['refrain','standstill']`** (grace + oratory now PASS the starter curve).
- `src/CLI/e2e/cli.process-smoke.engine.test.ts` — Windows spawn fix
  (`npx.cmd` + `shell:true` on win32); was failing `spawnSync npx ENOENT`
  locally before this session (pre-existing).
- Docs: `docs/combat.md` (draft/Conviction section + constants table rewritten for
  the dice law), `specs/31-fate-engine-card-effect-revamp.md` (§1 amendment block).

### axiomancer-mobile (UI)
- `components/combat/encounter/CombatEncounterPanel.tsx` —
  - drag ghost: `dragShown` no longer set synchronously in `begin`; a `useEffect`
    on `dragActive` reveals it (kills the previous-payload card-face flash);
  - `onApply` now uses `resolveApplyRouting` (floating/reserve/fate-X = explicit
    dieId, never drafted → the snap-back fizzle is dead);
  - detail overlay: flavor text block at the bottom (`detailFlavor` style,
    testID `combat-card-detail-flavor`); `keywordTypeTag` gained `forge→DICE`.
- `state/presenters/combat-encounter.engine.ts` —
  - `CombatDieVM.floating` flag, populated in `diceVM`;
  - **new exported `resolveApplyRouting(state, dieId)`** (the tested drag-commit routing);
  - `CombatCardVM.flavor` (from `Card.description`) — overlay bottom only;
  - metaChip type label: disenchant → **CURSE**;
  - `colorMatchHint` → "Only a {STANCE} or WILD die can power this card.";
  - new card kind **`'forge'`** (die-verb cards: forge/float_x/kindle/pip/spend-pips/
    reroll) + `forgeClause()` — kills the "DEBUFF · buff yourself" ambiguity on
    bootstrap-loop / ex-nihilo / half-step-class cards;
  - regen powerLine "Any die" → "Needs a {STANCE} or WILD die".
- `components/combat/encounter/CombatBoard.tsx` —
  - `DiceRow`: floating dice draggable like Reserve (post-draft too), never dimmed
    while unspent, "✦ FLOATING" tag (testID `combat-floating-{id}`);
  - **`CombatCardFace`: the large/small fork was UNIFIED** — both sizes render the
    same keyword line + die lines + type tab (identical-wording law). ⚠ SEE
    "OPEN — CARD FACE LAYOUT" below: this squeezed the 108×158 small face and
    the owner reports the hand cards are now illegible. New styles:
    `kwTextLarge/kwValueLarge/kwSubLarge/faceDieLineSmall/typeTabSmall/typeTabTextSmall`.
- `components/combat/encounter/combat-tutorial-steps.ts` + `CombatTutorialPrimer.tsx`
  — tutorial copy teaches 3 dice / color law / token values.
- `state/combat/keywords.ts` — **KEYWORD_GLOSS fully rewritten** (card-expert agent),
  every gloss engine-verified & exact (Poison ramp math, Bleed decay, Sway's real
  capitulate threshold min(max(10,0.35×maxHP),currentHP), Peroration 8/10/12
  floors, Forge covers float_x_die + all floating laws, Rupture burst formula
  + cap max(80, 25% maxHP), Stagger/Backfire rungs, Riposte/Guard/Barrier/Thorns
  timing, Echo's exact doubling surface, Enchant FREE-timed/PAID-permanent).
- `state/presenters/__tests__/floating-die-apply.engine.test.ts` — **NEW**, 6 cases
  pinning the drag-commit path against the real engine (explicit routing, no-draft,
  commit+consume-forever, multi-float one turn, color law on floats, VM flag).

### axiomancer-card-editor
- `float_x_die` in `data/mechanics.ts` kinds, `CardForm.tsx` default factory,
  `CardFace.tsx` keyword projection (→ forge). NOTE: the editor's CardFace is a
  DUPLICATE renderer — it has NOT been updated to the unified face layout and
  will drift until mirrored.

### repo root
- `.claude/launch.json` — NEW: `expo-web` config (expo start --web, port 8081).

## Balance state (measured, seed-1 greedy matrix)

- Win-rate curve after the rework: most presets decay properly; `grace` and
  `oratory` newly PASS the starter doctrine curve; **`standstill` (flat 1.00) and
  `refrain` (1.00/1.00/0.92) FAIL** → `/deck-tuning` findings, listed in
  `KNOWN_CURVE_VIOLATORS`.
- ⚠ `COLOR_MATCH_DAMAGE_BONUS` (+3) and the R7 +1-duration match bonus are now
  **near-unconditional** (every legal play matches; only fate-X doesn't) —
  fold-into-authored-numbers candidates for a manual tuning pass.
- Conviction income roughly doubled (2 unused dice/turn vs 1); signature cadence
  is correspondingly faster. Watch `convictionThreshold` policies + signature
  costs in the next tuning pass.

## NEXT UP — CARD FACE LAYOUT (owner picked: OPTION A, 2026-07-09)

Context: the owner reports hand cards are now **illegible** — this session's
"identical wording" change packed name band + keyword line + die lines + type
tab into the 108×158 small face and adjustsFontSizeToFit shrank everything.
Three mock-ups were shown; **the owner chose Option A** (their spec verbatim).

### The layout to implement (Option A)

Top to bottom, at BOTH sizes (hand + inspect overlay — one shared renderer):
1. **Purpose orb top-left** (category glyph, stance color) — exists today, keep.
2. **Art window** — the top region behind the stance tint.
3. **Name band in the middle** (between art and the effect rail).
4. **Bottom rail split 50/50 down the middle**:
   - LEFT  = ◇ FREE — its keyword + value (e.g. "◇ TICK · 1", "◇ DRAW · 1").
   - RIGHT = ◆ PAID — its keyword + value (e.g. "◆ POISON · 10 over 4t"),
     rendered in the category color.
   - A visible vertical divider between the halves.
5. **Type strip at the very foot** (e.g. "BODY · SPELL" — CURSE for disenchant).

Implementation notes:
- `HAND_CARD_W/H` (CombatBoard.tsx, ~L1074) 108×158 → **~132×194**, and raise the
  hand row **~20px** off the screen bottom. The fan-overlap math keys off these
  constants — keep them in sync. Check the play-area/battlefield doesn't collapse.
- The FREE column comes from `face.freeHeroText` (+ derive a keyword label —
  today free lines are riderText prose like "draw 1"; they need a keyword+value
  projection, likely a small `freeKeyword/freeValue` pair on `CombatCardFaceVM`).
- **Die-lines** ("⬢ BODY die: +1 intensity") have no slot in Option A — put them
  as a single small line UNDER the split (above the type strip) when present,
  or fold into the paid column; owner did not specify. Keep them legible; do
  NOT shrink the keyword+value pairs to fit them.
- The inspect overlay keeps its current frame: definitions TOP → this same face
  (large) → pills → color-law legend → flavor BOTTOM. The NO-DIE/+DIE pill table
  becomes partially redundant with the split face — consider dropping the pills
  once the face carries both halves (owner-check first).
- Mirror the layout in `axiomancer-card-editor/src/components/CardFace.tsx`
  (duplicate renderer) or accept drift consciously.
- Tests to update: `combat-card-vm.test.ts` (face/detail string pins), any
  snapshot that captures the board.

## DESIGN SIGNAL (owner, 2026-07-09 — parked, do not act without a session)

> "I really want Axiomancer to FUNDAMENTALLY do away with these 'do low basic
> damage OR a status effect' [forks]. I think it's bogging the game down."

The trigger: slippery-slope's authored FREE line is `tickOne` (one weak DoT
tick) — the layout made the weak-chip-vs-real-effect fork visible. This
questions the FREE/PAID fork itself (spec 32's die-optional design), not the
layout. Candidate directions when the owner opens the conversation: make FREE line shouldn't carry "raw" damage but rather lay a foundation for bigger, PAID effects, all within the theme] Filed in
plan/CRITIQUE.md; a /brainstorm-mechanics or /oversight session should own it.

## OPEN — case-by-case card audit (owner decides each)

From the card-expert audit (full table in the session log / reproducible via the
audit prompt):
1. **`tu-quoque` — DEAD LINE**: `dieBonus onColor:'body'` on a HEART card; under
   the color law it can never fire (wild ≠ body in the engine check). Change to
   `'heart'`/`'match'` or redesign.
2. Keyword candidates (recurring bespoke verbs): `consume_affliction`
   (winnowing, delphic-ambiguity), `siphon` (resonance-detonation, the-reaping),
   `replay_last` (ouroboros).
3. One-concise-line cards (B-class): the-overtake, ex-nihilo (bank_spent_die),
   festering-argument, currys-conversion, arrow-paradox, circular-reasoning,
   second-thoughts, the-closing-word, prophecy-fulfilled, ad-nauseam.
4. **8 enchant/curse `persistentEffect` strings under-state the engine hook**:
   venom-and-vein (+1 duration omitted), crown-of-thorns (scales +1..+4),
   crumbling-resolve (unconditional drip max(4,20% Guard+Barrier)),
   stuck-in-their-head (2..16 by Mark stacks), irresistible-grace (+12%/stack,
   cap 9), the-oracles-eye (omen riders ×1.5), mirror-of-guilt (recoil→mirror 3:1),
   fated-course (FORCES the telegraph to the predicted stance).
5. Six unmapped effect ids (no keyword → "◆ DIE" faces, no definition panel):
   `debuff_argument_wound`, `debuff_kindling_ember`, `debuff_foretold_wound`
   (DoT+Mark hybrid — fits no keyword), `debuff_nettle_sting`,
   `debuff_echo_sting`, `debuff_backfire_acute` (→ Backfire).

## TESTING CHECKLIST

### Mechanical (engine — mostly covered, spot-check on change)
- [x] 3 dice rolled per turn, no guarantee (hazard-pattern tests)
- [x] Per-die tokens: colored +1 / wild +2 / X +0; banked die earns 0 (tests)
- [x] Color law fizzles off-color plays for drafted/reserve/floating sources (tests)
- [x] fate-X powering still allowed for `fate` cards only, acts wild
- [x] float_x_die: X→wild float, cap→+1◆, no-X→+1◆ (card-effectiveness + handler)
- [x] Floating: bypass draft, multi-per-turn, consumed forever, no tokens, color law
      (mobile floating-die-apply test + mechanics themed-decks suite)
- [x] Sim policies only pick color-legal cards (re-pinned decision sequences)
- [ ] **Cross-combat float persistence through a REAL map run** (forge in fight 1,
      spend in fight 2 — only the save-back seam is unit-covered; suggested:
      seeded Foundry-preset run via `runHazardCombatAutoEncounter` ×2 or a
      playtester agent map run)
- [ ] Reserve×color-law interaction depth: banked die that matches nothing in a
      drawn hand (sim handles by free-topping; feel-check in play)
- [ ] Signature cadence under doubled token income (deck-tuning pass)
- [ ] `dieBonus onColor:'off'` class is dead engine-wide — only tu-quoque authors
      it today; assert or lint against future authoring

### Visual / interaction (needs a HUMAN or trusted-input browser; synthetic JS
pointer events do NOT activate RNGH pan — this session could not drag)
- [ ] **Drag a floating die onto a matching card → APPLY commits** (the original
      bug; engine path is test-pinned, the gesture itself is not)
- [ ] Drag ghost shows a DIE (not the previous card face) from frame 1
- [ ] Floating die stays draggable + undimmed AFTER the stance draft; ✦ FLOATING tag
- [ ] Drop a mismatched-color die → clean fizzle message, die returns, no state damage
- [ ] 3 dice render each turn; X face shows TAP; unused-dice → ◆ toast/counter reads right
- [ ] Card detail overlay: definitions TOP → identical face → pills → color-law
      legend → flavor BOTTOM (verified once in expo-web; re-verify after face redo)
- [ ] Hand face legibility ⚠ FAILING — awaiting layout decision (above)
- [ ] Tutorial (`?tutorial=1`) copy matches the new rules on-screen
- [ ] Card-editor preview parity after the face redo (duplicate renderer)

### How to drive it
- `expo-web` launch config exists; dev sandbox: `http://localhost:8081/combat-encounter?seed=N`
  (needs EMBARK first to create the player). Pin decks via
  `globalThis.__AXM_COMBAT_DECK__ = [...ids]` set BEFORE the route mounts
  (SPA-navigate via pushState+popstate to keep globals).
- Floating dice appear by playing `ex-nihilo` (forge) or `bootstrap-loop` with an
  X in the tray, or by injecting `player.floatingDice` (see the new jest test).
