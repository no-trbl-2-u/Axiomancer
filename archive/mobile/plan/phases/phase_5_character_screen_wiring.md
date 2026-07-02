# Phase 5 — Spec 05: Character screen wiring

> Retroactive brief. Phase 5 was discharged in commit `4afb4ed`
> ("feat(spec05): wire character screen to engine via
> selectCharacterViewModel") on 2026-05-13 — before the loop was
> adopted. This file exists so future ticks can see the contract
> that was shipped. No code work remains; this is bookkeeping
> substrate.

## Scope

Replace `app/(tabs)/character.tsx`'s literal `BASE` / `DERIVED`
/ `SAVES` / `EFFECTS` / `SLOTS` fixtures with engine-driven
data via `selectCharacterViewModel`. First consumer of the
Spec 03 presenter contract beyond the canonical combat sibling.

See `specs/05-character-screen-wiring.md` for the locked
contract.

## Files shipped (as of `4afb4ed`)

```
app/(tabs)/character/index.tsx               # screen renders VM, no literals
state/presenters/character.engine.ts         # selectCharacterViewModel + types
state/e2e/character.engine.test.ts           # hermetic e2e — VM shape, freeze, lifecycle
specs/05-character-screen-wiring.md          # the spec doc (open Qs answered)
```

The screen reads `vm = useGameState(selectCharacterViewModel)`
and renders. No `axiomancer-mechanics` import in the screen;
no literal stat fixtures; no math.

## Verify gate

```bash
npm run verify        # lint + tsc --noEmit + jest
```

Confirmed green at HEAD: 185 / 185 hermetic e2e tests pass.

## Deploy gate

```bash
npm run deploy:check
```

Stub (exit 0) until phase 11. Unchanged by phase 5.

## Tests

`state/e2e/character.engine.test.ts` covers:

- VM shape contract — `BaseStatRow`, `DerivedStatRow`,
  `SaveOrTestRow`, `CharacterEffectRow`, `EquipmentSlotRow`,
  `CharacterSkillRow`, and the top-level `CharacterViewModel`.
- Deep-freeze invariant in dev (inherited from Spec 03's
  `freeze.ts`).
- Happy path — full `createCharacter` fixture → VM has correct
  base / derived / saves.
- Boundaries — 0 XP, max-level character, character with 0 HP.
- Effects — VM passes through active effects with stable
  ordering.
- Lifecycle — mutating the engine `player` via the store
  reflects in the next presenter call; selection does not
  call `adapter.save`.

## Decisions made upfront — DO NOT ASK

Mirrored from `specs/05-character-screen-wiring.md`'s "Open
questions" block. All five answered (Q4 was implied by
implementation; filled in retroactively as part of this
phase's bookkeeping commit):

1. **XP rendering:** A — `xp` from engine if exposed, else
   `0 / nextLevel(level)` until Spec 06 ships progression.
2. **Saves vs. tests:** "Tests" map to map events; "Saves"
   mapping deferred (user uncertain at ship time). The VM
   exposes both shapes generically; downstream specs refine.
3. **Equipment slot mapping:** 1:1 — Head / Body / Hands / Feet
   / Weapon / Armor / Accessory match the engine `Item` slot
   names.
4. **Stat upgrade buttons:** A — deferred. Character screen
   ships read-only; no `+ stat` buttons in
   `app/(tabs)/character/index.tsx`. Spec 06 is the natural
   home once the engine exposes `pendingPoints`. (Originally
   blank in the spec; the implementation made the call
   implicitly. Recorded explicitly in this tick.)
5. **Visual treatment for below-threshold stats:** No tint —
   tests will also have a roll, so a single colour-code from
   the VM would over-fit. Tints stay component-side and only
   for visual feedback during interaction.

## `[needs-user-call]` rows logged in `plan/AUDIT.md`

None opened by this phase.

## Mobile reflow / responsive considerations

Character tab is a vertical scroll surface with read-only stat
sections — no special reflow logic. The screen relies on the
shared `<ScreenBg>` / `<StatBar>` / `<SectionLabel>` primitives
that already handle small-screen layout.

## Git

Single atomic commit `4afb4ed` ("feat(spec05): wire character
screen to engine via selectCharacterViewModel"). Phase 5's row
flip + Phase log entry land in a follow-up `plan: phase 5
shipped — character screen wiring` commit.

## DoD

After commit + push of the implementation (already done at
`4afb4ed`):

1. Add `[DONE on 2026-05-13 — see commit 4afb4ed]` status
   header to `specs/05-character-screen-wiring.md` H1.
2. Fill in Q4's missing answer (A — deferred) to match what
   shipped.
3. Tick Spec 05's acceptance checklist.
4. Move Spec 05 from "Next up" to "Already shipped" in
   `plan/steps/01_build_plan.md`.
5. Flip Phase 5's `[ ]` → `[x]`, append commit hash.
6. Add Phase log entry: `phase 5 — 4afb4ed — character screen
   wiring (Spec 05; selectCharacterViewModel, character/
   route folder, hermetic e2e)`.

## Confirm deploy

```bash
npm run deploy:check
```

Exit 0 (stub).

## Follow-ups (out of scope this phase)

- **Spec 06 — Inventory screen wiring.** Already shipped under
  Phase 6 territory in the build plan (post-spec sequencing).
- **Stat upgrade UI.** Engine needs `pendingPoints` (Spec 06
  territory) before the `+ stat` buttons can be wired.
- **Saves vs. tests semantic clarification.** Recorded as an
  open question on Spec 05; defer to a future engine
  iteration when the user has a stronger opinion.
