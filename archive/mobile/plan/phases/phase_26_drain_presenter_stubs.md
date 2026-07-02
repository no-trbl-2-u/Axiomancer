# Phase 26 — Drain stale presenter stubs (engine 10 + Spec 05 catch-up)

> **Status: [ ] — ready to ship.** No engine release needed.
> Sized **1 tick**. Promoted from `plan/PHASE_CANDIDATES.md`
> via `/oversight` 2026-05-15 (renumbered from candidate
> "Phase 17" because Token Crucible took the Phase 17 slot).
>
> Closes audit gaps **B** (moral meter surfacing), **L**
> (three navigation TODOs + combat STANCE_DERIVED placeholder),
> and partially **M** (stale "until Spec NN ships" /
> "engine 0.3.0" comments).

## Outcome

The three presenter stubs that have lingered since pre-Spec-04
days each get replaced with a real engine read. The combat
stance picker stops rendering hardcoded
`{ attack: 11, skill: 9, defense: 6 }` numbers and starts
reading `state.player.derivedStats` through `deriveStats`.
The navigation tab badges surface a non-null `event` badge
when `selectHasActiveEvent === true` (now possible because
Phase 6 shipped) and a non-null `levelup` badge when
`experience >= experienceToNextLevel`. Stale version-pinned
comments in `state/actions.ts` get rewritten to name the
current state rather than ghosts of pre-0.6 engines.

## Routes / API endpoints / CLI surface — locked

None new. This phase modifies internal presenters and a single
action-layer header comment; no route shape changes.

## Content / data reads — engine surface

Every read is from `axiomancer-mechanics` (top-level barrel).

| Helper / type | From | Use |
|---|---|---|
| `deriveStats(baseStats)` | `Utils/index.d.ts` (top-level re-export) | Combat stance picker — replace `STANCE_DERIVED` constant with a runtime call on `state.player.baseStats` |
| `state.player.derivedStats` | `Character/types` (read off `GameStore.player`) | Direct read in the stance-picker builder; preferred over recomputing from base stats |
| `selectMoralMeter` | top-level selector | Navigation badge follow-on **(out of scope this tick — see Follow-ups)**; no behaviour change yet |
| `EXPERIENCE_PER_LEVEL` | top-level constant | Already accessible via `player.experienceToNextLevel`; this constant is informational only |
| `player.experience` / `player.experienceToNextLevel` | `state.player` | Level-up badge predicate: `experience >= experienceToNextLevel` |
| `selectHasActiveEvent` | mobile `state/presenters/event.engine.ts` (shipped Phase 6) | Event tab badge predicate: render `{ text: '!', kind: 'event' }` when true |

## Components / handlers — modified

**Modified files (no new files):**

- `state/presenters/navigation.engine.ts`
  - `selectTabBadges(state)` — currently returns `EMPTY_BADGES`. Replace with a function that:
    - returns `EMPTY_BADGES` (the stable frozen sentinel) when no badges are active — preserves zustand reference-equality contract per the existing comment
    - returns a fresh-but-memo-keyed object when any badge is active. Badges:
      - `event`: `{ text: '!', kind: 'event' }` when `selectHasActiveEvent(state)` is `true` (state-side combat short-circuit already baked in)
      - `levelup`: `{ text: '↑', kind: 'levelup' }` when `state.player.experience >= state.player.experienceToNextLevel`
    - **Both badges sit on the `character` tab** for now — the level-up badge logically belongs there (stat upgrade UI is the character screen's territory) and the event badge sits there too as a placeholder until the navigation pass dedicates a "quest" tab. **Decision documented in §Decisions.**
  - Drop the stale `"see app/event.tsx"` reference in the file-level JSDoc — file moved to `app/event/index.tsx` in Phase 6.
- `state/presenters/combat.engine.ts`
  - Delete the `STANCE_DERIVED` constant (lines 287-295).
  - Add `buildStanceOptionsFor(state.player, enemyLastStance)` helper that reads `state.player.derivedStats` and maps the three engine stat triples to the stance-picker shape:
    - `heart` → `{ attack: emotionalAttack, skill: emotionalSkill, defense: emotionalDefense }`
    - `body` → `{ attack: physicalAttack, skill: physicalSkill, defense: physicalDefense }`
    - `mind` → `{ attack: mentalAttack, skill: mentalSkill, defense: mentalDefense }`
  - Update `selectCombatViewModel`'s two call sites (lines 711, 800 today) to pass the player.
  - Keep numbers as integers via `Math.round` in the mapper — engine stats are real-valued (e.g. `body * STAT_MULTIPLIERS.ATTACK`) but the existing screen treats them as whole-number HUD readouts.
- `state/actions.ts`
  - Rewrite the file-level JSDoc header (lines 1-14) to name the current state: drop the "axiomancer-mechanics@0.3.0" reference, drop the "engine Spec ~04" hedge. Replace with a tight summary of the current resource scaffold and the open Phase 16 follow-up.
  - Rewrite the `skillLookup` comment at line ~420 to reference Phase 16 (the [skipped] row that owns the real skill-library wiring) instead of "engine Spec 04".
  - Sweep any other `Spec 03`/`Spec 04`/`Spec 09 will…` hedges that name shipped specs as future work.

**Tests modified:**

- `state/e2e/navigation.engine.test.ts`
  - Replace the existing "selectTabBadges returns all-null" test with cases:
    1. fresh store → all badges null (steady-state, identity-stable result)
    2. pending event → `character.kind === 'event'` non-null
    3. level-up ready → `character.kind === 'levelup'` non-null
    4. combat active + pending event → event badge still null (engine short-circuit short-circuits the badge too, since `selectHasActiveEvent` returns `false` during combat)
    5. identity stability: two consecutive calls on the same steady state return the **same** `EMPTY_BADGES` reference
- `state/e2e/combat.engine.test.ts`
  - Add a case asserting `stancePicker.options[*].derived` values come from `player.derivedStats` and not the deleted constant. Use a custom-stat fixture (e.g. `body: 12, heart: 8, mind: 4`) so the expected numbers diverge from any plausible STANCE_DERIVED holdover.

**Tests untouched:** every other e2e in the suite.

## Cross-links

**In (verify before starting):**

- `pnpm verify` green at baseline (`HEAD` = `87d0b4c`, 321 tests).
- `state/presenters/event.engine.ts` exports `selectHasActiveEvent` with engine-truth semantics (shipped Phase 6 Tick A `2c4d2b0`).
- `axiomancer-mechanics@0.6.0` exports `deriveStats` from top-level (verified in `dist/index.d.ts:28`).

**Out (ships in this phase):**

- `state/presenters/navigation.engine.ts` — `selectTabBadges` rewrite + JSDoc cleanup.
- `state/presenters/combat.engine.ts` — `STANCE_DERIVED` removal + `buildStanceOptionsFor` helper + two call-site updates.
- `state/actions.ts` — file-level JSDoc rewrite + line-420 comment + sweep.
- `state/e2e/navigation.engine.test.ts` — badge cases (+4 / -1).
- `state/e2e/combat.engine.test.ts` — custom-derivedStats case (+1).

**Retro-fit (out of scope, follow-up):**

- The character screen (`app/(tabs)/character/index.tsx`) is unaffected; `selectCharacterViewModel` already reads `player.derivedStats` directly (Phase 5).
- Moral meter surfacing on the character or home badge is **deferred** to a future iterate row — Phase 26 only adds the engine-read plumbing, not a new UI surface.

## Decisions made upfront — DO NOT ASK

Authority order per `skills/plan-a-phase.md` §3: `design/decisions.<ext>` > `plan/bearings.md` > phase-specific. No `design/decisions.<ext>` exists for this surface; bearings doesn't constrain badge placement. All calls below are phase-specific.

1. **Badge placement — both badges on `character` tab.** Two
   levels of reasoning. (a) The level-up badge belongs there
   because the character screen owns stat upgrades. (b) The
   event badge has no dedicated tab today (Phase 6 modal lives
   outside the tab tree); parking it on `character` matches
   the screen that surfaces narrative consequences. A future
   navigation-pass phase can move it.

2. **Identity-stable empty result.** Preserve the existing
   `EMPTY_BADGES` frozen sentinel; return it whenever
   **both** badges are null. The existing comment in the file
   explicitly calls this out as a zustand re-render guard.
   New non-null results allocate fresh objects per call; this
   is acceptable because the consumer
   (`app/(tabs)/_layout.tsx:83 — useGameState(selectTabBadges)`)
   only re-renders when state changes, not on every snapshot
   read, and badge transitions are rare. **No `useMemo`
   needed at the call site.**

3. **`STANCE_DERIVED` deletion (not deprecation).** The
   constant has no legitimate non-test caller after this phase
   — delete it entirely. No back-compat shim. The mapper is
   the new source of truth.

4. **`Math.round` on derived stats.** Engine derived stats are
   real-valued (`body * STAT_MULTIPLIERS.ATTACK` where
   `STAT_MULTIPLIERS.ATTACK` is likely `1.0` or similar but
   not guaranteed integer). The HUD already treats them as
   integers. Round once at the mapper boundary; never expose
   raw floats to the screen.

5. **Comment sweep is targeted, not exhaustive.** The phase
   rewrites the file header in `state/actions.ts` and the
   line-420 `skillLookup` comment. It does NOT chase every
   stale `Spec NN` reference across the repo — only the ones
   inside `state/actions.ts`. Other surfaces (`combat.engine.ts`
   `// Spec 04 will…` hedges, etc.) ship as iterate rows if
   they linger; not part of this phase.

6. **No new test file.** The +5 tests slot into existing files.
   New file would add scaffolding for no clarity gain.

7. **Combat-active short-circuit is engine-truth, not a
   badge-side override.** `selectHasActiveEvent` already
   returns `false` during combat (Phase 6 Q4 = Future spec).
   The badge function just calls it; no re-implementation of
   the short-circuit.

## SEO / metadata / output schema

N/A. Output schemas:

- `Record<TabRoute, TabBadge | null>` (existing, unchanged).
- `StancePickerSlice.options[*].derived` (existing shape `{ attack, skill, defense }`, unchanged).
- `EXPERIENCE_PER_LEVEL` and `experienceToNextLevel` (engine, unchanged).

## Hero / body / sub-section composition

No screen layout changes. The combat stance picker now shows
numbers that move with the player's stats; the tab strip
shows badge marks on the character tab when the engine signals
a pending event or a level-up ready state.

## Empty / loading / error states — copy locked

| State | Trigger | Behaviour |
|---|---|---|
| All badges null | Steady state — no pending event, no level-up ready | `selectTabBadges` returns `EMPTY_BADGES` (stable reference) |
| Event badge only | `selectHasActiveEvent === true` | `character.kind === 'event'`, text `'!'` |
| Levelup badge only | `experience >= experienceToNextLevel` | `character.kind === 'levelup'`, text `'↑'` |
| Both | Both conditions true simultaneously | `character.kind === 'levelup'` (level-up wins — it's the higher-agency action; the event badge is a hint, the level-up badge is a stat-allocation prompt). Documented in code comment. |
| Combat active | `selectIsInCombat === true` | event badge null (engine short-circuit); levelup badge unaffected |

No new copy. Badge text characters chosen from the existing
glyph vocabulary in `theme/axm.ts` siblings.

## Mobile reflow / responsive / paginate / output limits

N/A — no layout shift.

## Pages x tests matrix

| Surface | Test file | Cases (delta) |
|---|---|---|
| `selectTabBadges` | `state/e2e/navigation.engine.test.ts` | +4 (event-only, levelup-only, both-collide, identity-stable empty); -1 (replaces the existing "all-null" trivial test which is now subsumed by the identity-stable case) |
| `selectNavigationViewModel` | same file | existing case retained; no delta |
| `selectCombatViewModel.stancePicker` | `state/e2e/combat.engine.test.ts` | +1 (custom baseStats fixture → derived stats from engine, not constant) |
| `STANCE_DERIVED` constant | n/a | **gone** — no tests need to assert its absence; the new test pins the new shape |

All tests hermetic per `docs/testing.md`.

## Verify gate

```bash
pnpm verify        # lint + tsc --noEmit + jest
```

Target: full suite green. Current baseline is 321 / 321 at
commit `87d0b4c`. Expected delta:

- `+4 / -1` in `navigation.engine.test.ts` = +3
- `+1` in `combat.engine.test.ts`

Approx **+4 net → ~325 hermetic** after ship.

## Deploy gate

```bash
pnpm deploy:check
```

Stub exits 0 (deploy is opt-in via EAS Build; Phase 11 wired
the contract). No deploy-side change.

## Commit body template

```
refactor: drain stale presenter stubs — phase 26

- navigation.engine.ts: selectTabBadges now reads
  selectHasActiveEvent + player.experience to surface event
  and levelup badges on the character tab; EMPTY_BADGES
  remains the stable steady-state result.
- combat.engine.ts: STANCE_DERIVED constant deleted; stance
  picker reads player.derivedStats and maps to the
  {attack,skill,defense}-per-stance shape via the engine's
  three stat triples (physical/mental/emotional). Math.round
  applied at the mapper boundary.
- state/actions.ts: file-level JSDoc rewritten to name the
  current 0.6 engine surface (drops 0.3.0 reference); the
  skillLookup comment at line ~420 names Phase 16 (the
  [skipped] row) instead of "engine Spec 04 will replace".
- e2e: +4 navigation badge cases, +1 combat stance derived
  case; identity-stable empty case proves the zustand
  reference-equality contract.

verify: N tests passing.

Closes #<phase-mirror-issue>
```

## Definition of Done

1. `STANCE_DERIVED` constant no longer exists in
   `state/presenters/combat.engine.ts`. `grep -n STANCE_DERIVED state/` returns empty.
2. `selectTabBadges` returns non-null badges on the character
   tab for both pending-event and level-up-ready states; the
   all-null steady state still returns the same `EMPTY_BADGES`
   reference between calls.
3. `state/actions.ts` file-level JSDoc no longer names
   "axiomancer-mechanics@0.3.0" or "engine Spec ~04".
   `grep -n "0\.3\.0\|engine Spec ~04\|engine Spec 04 will" state/actions.ts` returns empty.
4. `pnpm verify` green; new tests cover the badge transitions
   and the engine-derived stance numbers.
5. Phase 26 row in `plan/steps/01_build_plan.md` flipped
   `[ ]` → `[x]` with the commit hash.
6. Phase log entry appended.

## Follow-ups (out of scope this phase)

- **Moral meter UI surface.** Phase 26 makes `selectMoralMeter`
  available to navigation but doesn't add a badge or a stat
  row for it. A future iterate row or a "character vitals"
  phase can land that.
- **Dedicated quest / event tab.** The event badge piggybacks
  on the `character` tab today. A navigation-pass phase could
  add a fifth tab or reorganise the four; not in scope here.
- **Combat-presenter comment sweep.** Phase 26 only touches
  `state/actions.ts`; stale "until Spec NN" hedges in
  `combat.engine.ts` itself ship as iterate rows.
- **Per-skill mana cost coupling.** `state/actions.ts:447`
  burns mana via a fixture-lookup; replacing this with the
  engine's per-resource spend is candidate Phase 21
  (engine-release-gated).
