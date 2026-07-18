# Phase D6a — Flag-on combat render core

> Agent-facing brief. First sub-phase of the D6 mobile split. Render the
> spec-33 flag-on combat CORE in the mobile app: a runtime flag hook, the
> dice-tray/face rework (the app's most delicate interaction — the Reanimated
> drag), the Press Fate affordance, and the SPECIAL/HONE/TEMPER keyword glosses.
> **Presenter-first, owner-UI doctrine** (payload-only panels, Dawncaster-terse
> glosses, illegal actions prevented LOUDLY). **Flag-aware: flag-OFF renders the
> current combat byte-identical.** Deps: D2 (engine) + D5 (gear) — shipped.

## Scope boundary (respect it)
D6a is the flag-on render CORE only. **Deferred to sibling sub-phases:**
momentum/stance chips + stance-check telegraph + gear rail = **D6b**; blacksmith
screen = **D6c**; the seeded flag-on browser e2e = **D6d**. Do NOT build those.
Render spec-33 rules AS-IS by EXTENDING the existing conventions
(`STANCE_COLORS`, `DIE_GLYPHS`, the #5 SIDE RAIL, the `CombatDie` gem) — never
fork them; `STANCE_COLORS` is law.

## Integration map (from a codebase scout — trust these exact locations)
- **Flag:** `axiomancer-mobile/state/combat/flags.ts` — `applyCombatFlagsFromEnv`
  reads `EXPO_PUBLIC_UPGRADEABLE_DICE` at BUNDLE time only. Add a runtime escape
  hatch `globalThis.__AXM_UPGRADEABLE_DICE__` honored by the same applier (mirror
  the `__AXM_COMBAT_SEED__` / `__AXM_COMBAT_DECK__` test-global pattern in
  `app/combat-encounter/index.tsx`). This is the e2e enabler D6d needs; set the
  flag via `setUpgradeableDice` from `@mechanics`.
- **Combat panel/state:** `components/combat/encounter/CombatEncounterPanel.tsx`
  holds `CombatEncounterState` in local `useState`, applies pure `@mechanics`
  engine fns via `apply(fn)`, recomputes `vm = buildCombatViewModel(live)`. New
  flag-on state fields (dice `.face`, `crackedDice`, `pressFateRound`) already
  populate on the state when the flag is on — nothing reads them until you add
  reads to the VM.
- **Presenter:** `state/presenters/combat-encounter.engine.ts` —
  `buildCombatViewModel` (root), `diceVM` (~line 702) → `CombatDieVM`.
  `STANCE_COLORS` (:41, heart=purple/body=red/mind=blue/wild=gold), `DIE_GLYPHS`,
  `STANCE_LABELS` (:45-46). **`CombatDieVM` has NO `.face` axis today** — a die
  is color-only. Add the axis.
- **Dice tray / gem:** the `DiceTray` sub-component in `CombatBoard.tsx` (testID
  `combat-dice-tray`) renders `<CombatDie>` (`components/combat/encounter/CombatDie.tsx`,
  color+glyph). Drag-to-power lives in `CombatBoard.tsx` (Reanimated,
  `assignedDieIds`/`ineligibleRects`, UI-thread pointer-in-rect). This is the
  most intricate interaction — extend, don't rebuild; keep flag-off untouched.
- **Keyword glosses:** `state/combat/keywords.ts` has SPECIAL/HONE/TEMPER glosses
  (landed D4). The combat inspect modal in `CombatEncounterPanel.tsx` (~725-736)
  builds keyword rows from `detailCard.detail.keywords` via `keywordGloss`. Route
  these three into the modal's keyword source.

## Scope (do all four, flag-gated)
1. **Runtime flag hook** — `globalThis.__AXM_UPGRADEABLE_DICE__` honored by
   `applyCombatFlagsFromEnv` (calls `setUpgradeableDice(true)` when set). No
   visual change; the e2e/dev enabler.
2. **Dice-tray/face rework** — `CombatDieVM` gains a `face: 'special'|'mana'|
   'miss'` axis (+ a cracked flag from `crackedDice`). The gem renders faces
   legibly by EXTENDING the existing color+glyph language: mana = the normal
   powered look, **special = a marked/highlighted face (the +◆ die)**, **miss =
   visually DEAD** (dimmed/greyed, unpowerable), **cracked = a distinct
   struck-out state**. Drag-to-power obeys the color law (a die powers only its
   color's card; wild = any); an off-color drop is refused **LOUDLY** (the
   existing ineligible-drop feedback, made explicit). Under flag-off the tray is
   byte-identical.
3. **Press Fate affordance** — a 1◆ "reroll all miss faces, once/round" control
   (the flag-on `sig-press-the-point` reroll, `PRESS_FATE_COST`). Disabled at 0◆
   or when already used this round (`pressFateRound`), with the reason shown
   (owner-UI: illegal actions prevented loudly, not hidden).
4. **Keyword glosses** — SPECIAL/HONE/TEMPER rendered in the combat inspect
   modal, Dawncaster-terse, from `state/combat/keywords.ts`.

## Decisions made upfront — DO NOT ASK
- Spec 33 rules render as-is; `STANCE_COLORS` is law; the PROVISIONAL
  special-on-use rule renders its current engine state (no UI fork).
- Extend the existing die/glyph/rail visual language — no new visual system.

## Surface as `[needs-user-call]`
- Only genuine layout crowding a human eye must rank (tray + faces + Press Fate
  on small screens) — screenshot the options, note it; do not block.

## Prove (DoD)
- Presenter unit tests for the new VMs (the die-face VM: face/cracked mapping;
  the Press-Fate VM: enabled/disabled + reason). Flag-off renders byte-identical
  (a flag-off snapshot/shape assertion).
- `npm run verify -w axiomancer-mobile` GREEN (lint + typecheck + jest).
- Browser-preview screenshot proof of the flag-on tray (special/mana/miss/cracked
  legible) — the orchestrator drives this.
- Flip D6a `[x]` + Phase log + hash.

## Follow-ups
- D6b (chips + telegraph + gear rail), D6c (blacksmith screen), D6d (flag-on
  e2e using this phase's flag hook) build on this.
