# Phase 57 — Enemy rotation content sweep (Phase 49 follow-up)

> Promoted via `/oversight` 2026-05-20 (fifth oversight of the session,
> commit `0b8dc81`) from expand-pass-8 candidate `aff5a57`. Brief
> authored 2026-05-20 at commit `da964aa`.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 57 — Enemy rotation content sweep".
- Phase 49 (`27064d9`) shipped the enemy-skill caster path + authored 2 rotations (Argumentative Crow → false-dilemma, Coastal Tyrant → achilles-gambit).
- Phase 45 (`b185fe2`) pinned a `philosophicalAlignment` cell on every authored enemy.

## Goal — one-line outcome

Wire the Phase 49 enemy-skill caster path into the 14 remaining authored enemies — author 7 thematic skill rotations (5 elite/boss/unique + 2 normals) so the combat depth lever Phase 49 unlocked actually reaches the library.

## Decisions (made upfront)

### D1 — Skill picks driven by enemy alignment cell + stat profile

Each pick matches the enemy's Phase 45 alignment cell or its dominant stat aspect. No new skills authored — every pick is from the existing 16-entry `skillLibrary` (12 base + 4 Phase 44 fallacies). Engine + tests stay green; this is pure content authoring.

### D2 — Leave the 3 simplest normal enemies skill-less

Tidepool Crab, Sea-Mist Wisp, Lullaby Moth stay without skills. Early-game pacing benefits from straight basic-action enemies; layering skill rotations on every Day-1 encounter would burn the player's reactive complexity budget before it matters.

### D3 — Single-skill rotations only

Per Phase 49: `pickEnemySkill` picks `enemy.skills?.[0]`. Multi-skill rotations would require a richer pick mechanism (random-among / round-robin / state-aware), out of scope here. One thematic skill per enemy is the minimum-viable content shape.

### D4 — Skill-cost realism deferred

Enemy skill use bypasses the player's `combatResources` pool per Phase 49 D2 (sentinel resource path). Picks like `pascals-wager` (cost `{ heart: 2, paradox: 1 }`) are mechanically valid for normal-tier enemies even though those enemies wouldn't have paradox tokens. Resource-realism for enemy skill cost is a separate engine design question.

## The picks

| Enemy | Tier | Skill | Aspect | Cell-fit / theme |
|---|---|---|---|---|
| Tidefluke Reaver | elite | `straw-giant` | body | logic-pessimistic-mid (cell rationale: built-up exaggerated threat then strike — the reaver's "salt-bound" aggressive shore-curse) |
| Hush-Wraith | elite | `sorites-cascade` | mind | mid-pessimistic-transcendent — gradual-undoing matches "listens until you doubt the answer" |
| Hollow Saint | elite | `pascals-wager` | heart | faith-mid-transcendent — heart self-heal for the martyr-without-cause looking for a wound to claim |
| The Disagreement | boss | `liars-echo` | mind | logic-mid-individual — mind-mark for the rehearsed-argument boss whose phases are deliberate |
| Echo of Pyrrhonia | unique | `eternal-regress` | heart | mid-mid-individual — the Pyrrhonian regress IS the classical skeptic move (every claim demands a deeper claim ad infinitum); the Echo's recurrence theme fits |
| Mournful Gull | normal | `appeal-to-pity` | heart | mid-pessimistic-individual — heart self-heal matches "every slight it remembers" |
| Hollow-Eyed Beggar | normal | `pascals-wager` | heart | faith-pessimistic-mid — heart self-heal at a different tier than Hollow Saint; "what you carry, not what you are" — survival-wager flavour |

## Commit units

### Unit 1 — 5 elite/boss/unique rotations

Files:
- `src/Enemy/enemy.library.ts` — add `skills: [skill('<id>')]` lines on TideflukeReaver, HushWraith, HollowSaint, TheDisagreement, EchoOfPyrrhonia rows. Inline comments name the Phase 49 attribution + the alignment-cell or aspect rationale.

Verify: `npm run verify`.

Commit: `feat(enemy): Phase 57 unit 1 — 5 elite/boss/unique skill rotations`.

### Unit 2 — 2 normal rotations + tests + docs

Files:
- `src/Enemy/enemy.library.ts` — add `skills: [skill('<id>')]` lines on MournfulGull, HollowEyedBeggar rows.
- `src/Enemy/e2e/enemy.engine.test.ts` — extend the "ArgumentativeCrow + CoastalTyrant — Phase 49 rotations" describe block (rename to "Phase 49 + Phase 57 rotations") with 7 new it-blocks asserting each newly-paired enemy's `skills?.[0].id` matches the authored ID.
- `docs/enemy.md` — extend the Phase 49 "Skill use" subsection table to cover the 7 new rotations.

Verify: `npm run verify` + `npm run deploy:check`. No public-surface fixture refresh — this phase adds no new exports.

Commit: `feat(enemy): Phase 57 unit 2 — 2 normal rotations + test + docs`.

## Verify gate

`npm run verify` + `npm run deploy:check` — both green.

## DoD

- Phase 57 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]`.
- 7 new `skills:` lines on the corresponding enemies in `src/Enemy/enemy.library.ts`.
- 7 new hermetic assertions in `src/Enemy/e2e/enemy.engine.test.ts`.
- `docs/enemy.md` Phase 49 table covers the new rotations.

## Out of scope

- Multi-skill rotations (D3 — needs engine work).
- Resource-realism for enemy skill use (D4 — engine design question).
- Rotations for the 3 simplest normal enemies (D2 — pacing).
- New skill content in `skillLibrary` — picks are from the existing 16-entry library.
