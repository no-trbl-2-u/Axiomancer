# Phase D6b — Momentum/stance chips + stance-check telegraph + gear rail

> Agent-facing brief. Second sub-phase of the D6 mobile split. Render the
> spec-33 momentum/stance LAYER on top of D6a's flag-on render core: the
> momentum-V2 chip, a current-stance chip, the open stance-check telegraph, and
> the die-gear rail with a payload-only inspection panel. **Owner-UI doctrine**
> (payload-only panels, Dawncaster-terse, illegal actions prevented LOUDLY).
> **Flag-aware: flag-OFF byte-identical.** Deps: D6a (shipped).

## Context — what's already built
- **D6a** shipped the flag-on render core: the runtime flag hook
  (`globalThis.__AXM_UPGRADEABLE_DICE__`), `CombatDieVM` face axis + gem
  rendering, Press Fate, SPECIAL gloss. `isUpgradeableDiceEnabled()` is the flag
  gate; `buildCombatViewModel` is the VM root (`state/presenters/combat-encounter.engine.ts`).
- **D6e** authored `stanceCheck: { punishes?, yields? }` on every enemy threat
  phase (via `getThreatSequence` backfill) + emits `stance-check-resolved`
  events (outcome punished/yielded/none) at phase end. D6b renders those.
- **D5** put a 4-slot `dieGear` rail on the character / `CombatEncounterState`
  (`{ body, mind, heart, wild }` → `UpgradeableDieGear { specialFaces, manaFaces,
  specialConviction }`); `activeDieGear(state, color)` resolves it. D6b renders it.

## Scope boundary (respect it)
D6b is the chips + telegraph + gear rail ONLY. Do NOT build: the blacksmith
screen (= **D6c**) or the flag-on browser e2e (= **D6d**). Extend the existing
`STANCE_COLORS` (`combat-encounter.engine.ts:41`, LAW) / `DIE_GLYPHS` / chip
conventions — no new visual system.

## Integration map (from the D6 scout)
- **Momentum:** `state/combat/momentum.ts` (a11y helper) + the `MomentumWheel`
  chip. Its CURRENT VM is the three-node wheel `{ lit: WheelStance[], charged }`.
  Spec-33 momentum is a DIFFERENT shape — `state.momentumV2: { color, length } |
  null` (chain heart→body→mind). RESHAPE the chip's flag-on VM to render the
  chain color + length; a **break to null must be LOUD** (owner-locked strict
  rule — the UI must teach it); a **surge** (momentum-surged event) is evented.
- **Stance chip:** render the player's current stance (`state.playerStance` — set
  from the last paid card, D2) or a clear "no stance" when null.
- **Stance-check telegraph:** the threat readout / intent VM (`intentVM`,
  `combat-encounter.engine.ts:~610`). Render each phase's `punishes X` / `yields
  X` openly (spec-30 telegraph conventions), and the end-of-phase resolution
  feedback (×1.5 punished / ×0.5 yielded +1◆ / none) from the
  `stance-check-resolved` event.
- **Die-gear rail + inspection:** a new 4-slot rail (mirror the dice-tray layout
  idiom) reading `state.dieGear` (fall back to `activeDieGear`). Tapping a die or
  its gear opens a **payload-only** inspection panel (Dawncaster-terse): the face
  table (n special / n mana / n miss), the payload text (+◆), and upgrade state.
  Reuse D6a's inspect-modal pattern.

## Scope (do all, flag-gated)
1. **Momentum-V2 chip** — reshape to render `momentumV2 { color, length }`;
   break-to-null is LOUD; surge evented/animated.
2. **Stance chip** — current stance or "no stance".
3. **Stance-check telegraph** — `punishes X` / `yields X` in the threat readout +
   ×1.5/×0.5/+1◆ end-of-phase feedback.
4. **Die-gear rail + payload-only inspection panel** — 4 slots, face table +
   payload + upgrade state, Dawncaster-terse.

## Decisions made upfront — DO NOT ASK
- Spec 33 rules render as-is; `STANCE_COLORS` is law; extend existing chip/rail
  conventions — no new visual system.

## Surface as `[needs-user-call]`
- Genuine small-screen crowding only (tray + faces + Press Fate from D6a + the
  new chips + rail) — screenshot the options, note it; don't block. (D6a already
  flagged Press-Fate-row crowding — this is where it's settled.)

## Prove (DoD)
- Presenter unit tests for each new VM (momentum-V2 chip mapping incl. break/surge
  states; stance chip; stance-check telegraph incl. the three resolution outcomes;
  gear-rail + inspection VM). Flag-OFF byte-identical (the flag-off VM shape/output
  unchanged — the existing three-node momentum wheel etc. render as before).
- `npm run verify -w axiomancer-mobile` GREEN.
- Flip D6b `[x]` + Phase log + hash.

## Follow-ups
- D6c (blacksmith screen), D6d (flag-on e2e). D6d's harness finally enables the
  full flag-on visual screenshot D6a/D6b deferred.
