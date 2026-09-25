# Phase 44e — Enemies + threat sequences retheme

> Agent-facing brief. Spec 34 §5.7 already resolved this row's entire scope:
> "44e is a narrow pass, not a sweep." The 56-name roster was already dark
> fantasy before the Profane Canon rewrite, and enemy *cards* were already
> re-voiced. Exactly **one** rename is required: **The Incompleteness → The
> Unfinished**. Behavior, calibration weights, ids and archetypes are
> untouched — display text and in-file flavor only.

## Inputs (read in this order)

1. `axiomancer-mechanics/specs/34-dark-fantasy-campaign.md` §5.7 (the ruling
   — the only source of truth for this phase's scope; wins over the build
   plan row's broader-sounding language).
2. `docs/retheme-map.json` — the `"applies": "44e"` entry
   (`{"kind":"enemy","old":"The Incompleteness","new":"The Unfinished", ...}`),
   already staged by Phase 44a.
3. `axiomancer-mechanics/src/Enemy/enemy.library.ts` — `TheIncompleteness`
   enemy definition (`id: 'enemy-the-incompleteness'`, registered under
   `'the-incompleteness'` in `ENEMY_REGISTRY`).
4. `axiomancer-mechanics/src/Combat/combat.enemy-cards.ts` — the
   `'the-sentence-outside'` card's `actionText`, the only card whose
   telegraph prose names the enemy (card is exclusive to this enemy's deck
   per `combat.enemy-decks.ts:81`; no shared-card collision risk).
5. `axiomancer-mechanics/src/Combat/combat.stage-profiles.ts` — the
   `impossible` stage profile's `description` field.
6. `axiomancer-mechanics/src/Combat/e2e/the-incompleteness.engine.test.ts` +
   `axiomancer-mechanics/src/Enemy/e2e/new-enemies.engine.test.ts` — the two
   test files asserting against the old display name.
7. `plan/phases/phase_44d_themes_presets_retheme.md` Follow-ups — names this
   phase and confirms the rename target verbatim.

## Scope — the one pair

| kind | old | new | ruling |
|---|---|---|---|
| enemy display name | `The Incompleteness` | `The Unfinished` | §5.7 |

Everything else in §5.7's table (`The Sophist`, `The Abortive`, `The Index`,
`The Doorwarden`, `The Frayed One`) is **KEEP** — zero action. Enemy
archetype ids are RATIFIED unchanged (§1.2) — no archetype renames.
`combat.threat-sequences.ts` is **derived, not hand-authored** (the Profane
Canon rework, 2026-08-08): it compiles `AUTHORED_THREAT_SEQUENCES` from
`ENEMY_DECKS` + `combat.enemy-cards.ts` at import time, so there is no
per-enemy phase-table content in that file to rename — the row's mention of
it is satisfied by renaming the underlying card prose in
`combat.enemy-cards.ts` (input #4 above).

## Decisions made upfront — DO NOT ASK

- **Internal identifiers, ids and calibration are untouched.** The exported
  const `TheIncompleteness`, the enemy id `enemy-the-incompleteness`, the
  registry key `'the-incompleteness'`, `enemySlugs: ['the-incompleteness']`
  in the `impossible` stage profile, and the test file's own name
  (`the-incompleteness.engine.test.ts`) all stay exactly as-is — this
  mirrors 44f's explicit "node ids do not change, display names do" ruling
  (§5.8) and 44b/44c's own precedent of renaming display text without
  touching id-keyed structures. §5.7 is explicit that the L110 calibration
  weights (0.21 / 0.232 / 0.271 / 0.326) are untouched — this phase does not
  open `baseStats`, `level`, `damageWeight`, `procUnlocks`, `loot` or
  `philosophicalAlignment`.
- **Codemod, scoped to the five files that actually name the enemy**, not a
  repo-wide sweep. `docs/retheme-map.json`'s `"applies": "44e"` pair drives
  `scripts/apply-retheme-map.mjs`; dry-run against the five files below
  found exactly 10 occurrences, all inside code comments, docstrings, an
  `actionText` telegraph string, a stage-profile description, or test
  assertions/labels — none inside an identifier (the word-boundary matcher
  requires the literal space in "The Incompleteness", which
  `TheIncompleteness`/`enemy-the-incompleteness`/`the-incompleteness` don't
  contain, so those are structurally immune). Because every one of these 10
  hits sits inside a file this phase is already touching, updating them
  together (rather than leaving stale in-file comments beside the new name)
  keeps each file internally consistent — unlike 44d's deferred comment,
  which lived in an *unrelated* file this phase had no other reason to open.
- **Docs, specs, `CHANGELOG.md`, `plan/` history and
  `axiomancer-mechanics/docs/playtest.md` are OUT of scope**, per spec 34's
  own carve-out ("Historical records ... are NOT rewritten") and 44i's row
  ("documents what 44a-44h did... LAST"). These keep saying "The
  Incompleteness" until 44i sweeps prose currency.
- **No `docs/lexicon.json` row this phase.** Registering "Incompleteness" as
  a retired term now would fail `check-lexicon.mjs` against every doc/spec
  reference this phase deliberately leaves alone (playtest.md, CHANGELOG,
  plan/tuning reports, spec 34 itself, which quotes the old name inside its
  own ruling prose). The lexicon guard is a 44i concern, once the full prose
  sweep actually retires the term everywhere.
- **`devlog/data/enemies.json` is a generated artifact** (built by
  `axiomancer-mechanics/scripts/export-catalog.ts` reading `EnemyLibrary`
  from `enemy.library.ts`) — regenerate via `npm run catalog`, never hand-edit.
- **The test file's own name and the imported identifier stay
  `the-incompleteness` / `TheIncompleteness`** — structurally immune to the
  codemod (no literal space in either token). Its `describe(...)` block
  labels (e.g. `'The Incompleteness — registry wiring'`) DO contain the
  literal phrase with a space, so the codemod renames those too — accepted,
  since it keeps the file's prose internally consistent and Vitest labels
  are free text with zero functional effect either way.

## Codemod invocation

```bash
node scripts/apply-retheme-map.mjs --applies=44e --write \
  axiomancer-mechanics/src/Enemy/enemy.library.ts \
  axiomancer-mechanics/src/Combat/combat.enemy-cards.ts \
  axiomancer-mechanics/src/Combat/combat.stage-profiles.ts \
  axiomancer-mechanics/src/Combat/e2e/the-incompleteness.engine.test.ts \
  axiomancer-mechanics/src/Enemy/e2e/new-enemies.engine.test.ts
```

Expect exactly 10 occurrences replaced across the 5 files (2 + 1 + 1 + 5 +
1). Review the diff by hand afterward — confirm no identifier, id, or
numeric calibration value moved.

## Prove (DoD)

```bash
# Codemod applied cleanly, 10/10 occurrences
node scripts/apply-retheme-map.mjs --applies=44e <same 5 paths>
# -> "found (dry-run)" should now report 0 occurrences (already replaced)

# Zero remaining old-name hits in the engine source/tests (comments/docs excluded by design)
git grep -n "The Incompleteness" -- axiomancer-mechanics/src axiomancer-mobile
# -> no output

# Identifiers/ids untouched
git grep -n "TheIncompleteness\|enemy-the-incompleteness\|'the-incompleteness'" -- axiomancer-mechanics/src
# -> same hits as before the codemod (const, id, registry key, stage-profile enemySlugs)

# Calibration untouched
git diff axiomancer-mechanics/src/Enemy/enemy.library.ts | grep -E '^[+-].*(baseStats|level:|damageWeight|philosophicalAlignment)'
# -> no output (nothing under those keys changed)

# Targeted suites green
cd axiomancer-mechanics && npx vitest run src/Combat/e2e/the-incompleteness.engine.test.ts src/Enemy/e2e/new-enemies.engine.test.ts

# Full verify gate
npm run verify

# Catalog regenerated (devlog/data/enemies.json picks up the new name)
npm run catalog
git grep -n "\"name\": \"The Unfinished\"" devlog/data/enemies.json
```

- Flip Phase 44e's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
  the commit hash.

## Follow-ups (out of scope this phase)

- `docs/playtest.md`, `CHANGELOG.md`, `plan/tuning/*`, `plan/PHASE_CANDIDATES.md`,
  spec 34 itself — prose references to "The Incompleteness" outside code;
  44i's docs sweep.
- `docs/lexicon.json` retirement row for "Incompleteness" — once 44i's sweep
  actually clears every prose reference, add the guard row then.
- Phase 44f — world/map/minigame naming.
- Phase 44g — characters/story/quests.
- Phase 44h — MORALE → GRACE, alignment cube → THE OATHS.
- Phase 44i — product shell + docs (last; sweeps the deferred prose above).
