# Phase 61 — CHANGELOG breaking-removals backfill (mobile #93 unblock)

> Pure docs phase. Addresses mobile #93's revert signal: engine bump
> 0.10.0 → 0.10.2 surfaced ~58 typecheck errors from undocumented
> breaking removals. Populates `[unreleased]` with the post-0.10.2
> work and adds a canonical "Cumulative removals since v0.7.0"
> migration block to give mobile a single reference for what changed.

## Outcome

`CHANGELOG.md` `[unreleased]` heading is populated with the
post-0.10.2 work (Phase 58/59/60 + 7 iterate fixes); a "Cumulative
removals since v0.7.0" subsection in the `[unreleased]` Migration
notes lists every breaking removal mobile #93 surfaced (with the
canonical replacement for each); the existing 0.10.0 `### Removed`
block is extended to flag the broader sweep. `plan/CRITIQUE.md`
critique-26 row drains.

## Source

- `plan/PHASE_CANDIDATES.md` Promoted section, Phase 61 row.
- mobile `axiomancer-mobile#93` comment 2 (the explicit "engine
  CHANGELOG entries for 0.10.1 / 0.10.2 understate breaking
  removals" request).
- `plan/CRITIQUE.md` critique-26 row (MED, drained by this phase).

## Audit results (run at brief time)

`git show v0.7.0:src/Combat/types.d.ts` confirmed via grep / diff
against HEAD:

| Symbol mobile flagged | Removal era | Replacement |
|---|---|---|
| `getCoastalMap` | iterate `b85f509` (post-v0.10.0, pre-v0.10.1) | `getMapDefinition('coastal-continent', mapName)` + `createMapState` |
| `WorldMap` type alias | iterate `a707316` (post-v0.9.0, pre-v0.10.0) | `MapDefinition` + `MapState` (Phase 23 split) |
| `Encounter.enemy` (single-enemy field) | Pre-v0.7.0; v0.7.0 already shipped `Encounter.enemies: Enemy[]`. Mobile's local types must have been stale. | `Encounter.enemies[0]` for single-enemy encounters |
| `DialogueChoice.id` / `.label` | Pre-v0.7.0 (the current `DialogueChoice` shape has no `id` / `label`; the choice's index in `DialogueNode.choices[]` is its identity). | Track by index; `DialogueChoice.text` is the human-readable label |
| `DialogueNode.speaker` | Pre-v0.7.0 (current `DialogueNode` has `text`, `choices?`, `flag?`; no `speaker`). | Source `speaker` from the parent `NPC.name` |
| `Character.mana` / `.maxMana` | Pre-v0.7.0 (Spec 04's resource economy is `CombatResources` — `body` / `mind` / `heart` tokens + Phase 44's fallacy/paradox channels; `mana` was never on the canonical `Character` shape per Spec 06). | `CombatResources` per-stance tokens; the player's resource pool lives on `CombatState.player.combatResources`, not `Character` |
| `ActiveEffect.id` / `.name` | Pre-v0.7.0 (current `ActiveEffect` carries `effectId: string` reference back to the library `Effect.id`; the `name` is on the resolved library entry). | `lookupEffect(activeEffect.effectId).name` |
| `EffectStatTarget` literal-union tightening | Pre-v0.7.0 (the union is constrained to the canonical derived-stat / base-stat / non-combat-stat names per Spec 01). | Use one of the canonical names: `'body'` / `'mind'` / `'heart'` / `'maxHealth'` / `'physicalDefense'` / `'magicalDefense'` / etc. |
| `GameState` index signature | Pre-v0.7.0 (the canonical `GameState` is the explicitly-typed shape from Spec 09 with the documented `version` / `player` / `world` / `combat` / `quests` / `flags` / `moralMeter` / `rngState` / `philosophicalAlignment` fields). | Read explicit fields; `flags: Record<string, boolean>` is the only string-indexed slot |

**Verdict.** Most of mobile's typecheck errors stem from `axiomancer-mobile`'s **local type definitions drifting against the engine's shipped types** rather than from regressions in the 0.10.0 → 0.10.2 bump itself. The actual cross-version removals are limited to `getCoastalMap` (post-0.10.0 iterate) and `WorldMap` (post-0.9.0 iterate); both ALREADY have `### Removed` entries in their respective CHANGELOG sections (0.10.0 explicitly mentions both). Mobile's bump issue conflates "removed in 0.10.0 → 0.10.2" with "never existed in 0.x.0 public shape but mobile's local copy assumed it did."

The right Phase 61 deliverable, therefore, is a **canonical migration guide** in `[unreleased]` rather than retroactive rewrites of older release sections. The migration guide makes the engine's true public shape unambiguous for mobile (and any future consumer) so the local types can be re-grounded.

## Implementation units

### Unit 1 — Populate `[unreleased]` with post-0.10.2 work + migration guide

Touch: `CHANGELOG.md` (single file).

Replace the empty `[unreleased]` placeholder with:

- **`### Added`** — `FriendshipReward` type + `Enemy.friendshipReward?` field + `CombatEndReport.friendshipReward?: { narrative? }` field, all attributed to Phase 60 commits.
- **`### Changed`** — `pickEnemySkill` no longer exported from `src/Enemy/enemy.logic.ts` (iterate `c15d3fa`, internal AI helper; no consumer-visible API change). `combat.resolver.test.ts` renamed to `combat.resolver.engine.test.ts` (iterate `7bf8115`, test convention; not a public-surface change but flagged for symmetry with the codified pattern).
- **`### Docs`** — `specs/14-philosophical-alignment.md` retroactive conversation-loop spec (Phase 58, `f103a8d`); Phase 59 zero-residual docs audit (`916cef8`); `docs/testing.md` Continuous integration subsection (iterate `b7a3fa6`); spec.md "Published npm release" Non-goal / 6-month-horizon flipped to shipped (iterate `0931ce8`); README + bearings + scripts/README + docs/api.md front-door currency refreshes (iterates `650f2b2` + `59a0439` + `9bed952`); befriend.engine.test.ts compound assertion simplification (iterate `e5d1799`).
- **`### Migration notes`** — three subsections:
  1. **From 0.10.2 to `[unreleased]`** — none required; `FriendshipReward` is additive and optional.
  2. **Re-grounding consumer-side types (for any consumer hitting "type X has no property Y" errors after a bump)** — canonical migration table (the one in the Audit results above): `getCoastalMap` → `getMapDefinition + createMapState`; `WorldMap` → `MapDefinition + MapState`; `Encounter.enemy` → `Encounter.enemies[0]`; `DialogueChoice.id` / `.label` → index + `text`; `DialogueNode.speaker` → parent `NPC.name`; `Character.mana` / `.maxMana` → `CombatState.player.combatResources` (per-stance); `ActiveEffect.id` / `.name` → `lookupEffect(effectId).name`; `EffectStatTarget` → canonical union members; `GameState` → explicit fields, `flags` is the only string-indexed slot.
  3. **Where to look for the authoritative shape** — point at `src/index.ts` (top-level barrel) + `dist/index.d.ts` (post-build .d.ts) + `scripts/public-surface.expected.json` (deploy-gate fixture). The fixture is the canonical truth as of 0.10.1 forward; the diff tool (`node scripts/diff-public-surface.mjs v0.10.2 HEAD`) emits per-tag deltas.

The Phase 52 `deploy-check` tag/CHANGELOG assertion ignores `(unreleased)` headings so the gate stays green while authoring.

### Unit 2 — Cross-link from mobile #93 + drain critique-26

Touch: `plan/CRITIQUE.md` (critique-26 row Pending → Done with shipping reference).

The mobile-issue comment is **optional**; the user can post it manually once Phase 61 ships. The brief calls Unit 3 optional per the PHASE_CANDIDATES.md row; ship the comment if and only if it's useful at this commit's HEAD.

For this phase's commit body, name the resolving commit + the canonical migration-guide subsection so mobile #93 readers can navigate.

## Decisions made upfront — DO NOT ASK

- **D1 — Canonical migration guide in `[unreleased]`, not retroactive rewrites.** The audit found most of mobile's flagged removals predate v0.7.0 (mobile's local types drifted, not the engine's shipped types). Adding a `### Removed` block to v0.5.0 / v0.6.0 / v0.7.0 / v0.8.0 / v0.9.0 retroactively is archaeology with low fidelity (Phase 52 author noted the v0.10.0 predecessor doesn't carry the public-surface fixture, so even per-tag diffs are imperfect pre-0.10.1). A single migration table in `[unreleased]` Migration notes is higher-value for mobile + future consumers.

- **D2 — Don't expand the 0.10.0 `### Removed` block.** The 0.10.0 entry already lists `WorldMap` removal. `getCoastalMap` shipped at a post-0.10.0 iterate so it belongs in the 0.10.1 entry (which doesn't have a `### Removed` block today). Adding it there is an option but tangential — the existing 0.10.1 Migration notes already say `WorldMap` + Set items + autosave; adding a one-liner for `getCoastalMap` is acceptable scope creep.

- **D3 — Skip the `node scripts/diff-public-surface.mjs v0.10.2 HEAD` cite.** The diff for the current HEAD vs v0.10.2 is exactly `+FriendshipReward type` (Phase 60). I'll cite the rendered diff once in the `### Added` block; running the script in this commit isn't necessary since the addition is the only delta.

- **D4 — Single commit for Unit 1 + Unit 2.** Pure docs; the CHANGELOG edit and the CRITIQUE row drain are tightly coupled (Unit 2 cites the Unit 1 commit hash by `<this commit>` convention). Step 11 ship-row flip folds in as commit 2.

- **D5 — Skip Unit 3 (mobile #93 comment) for this phase commit.** The mobile-issue comment is best made AFTER the engine repo has the migration guide visible at `origin/main`, so a mobile-side reader who lands on the issue from `Closes #93` link sees the resolved state. The user can post the comment manually post-push, or the next /march tick can pick it up as a follow-up.

- **D6 — Add `getCoastalMap` removal to the 0.10.1 entry as a small bonus scope.** The 0.10.0 entry already mentions it ("`getCoastalMap` removed (now `getMapDefinition`)") through the Migration notes; but the 0.10.0 `### Removed` block ONLY lists `WorldMap`. Move `getCoastalMap` to its own `### Removed` block at 0.10.0 + a one-line cross-reference in 0.10.1. Minor consistency fix, fits the Phase 61 scope naturally.

## Verify gate

- `npm run type-check` — no code change.
- `npm test` — no test change (629/629 stays green).
- `npm run build` — no build-graph change.
- `npm run deploy:check` — the tag/CHANGELOG assertion ignores `(unreleased)` headings so populating the [unreleased] block does NOT affect the gate.

## Commit body template

### Unit 1 + 2 (single commit)

```
docs(changelog): Phase 61 — populate [unreleased] + canonical migration guide (mobile #93 unblock)

Audit at brief time found mobile #93's flagged removals split two ways:
(a) genuinely post-v0.10.0 removals (getCoastalMap, WorldMap) already
documented in their respective ### Removed blocks; (b) symbols that
PRE-date v0.7.0 (Encounter.enemy, DialogueChoice.id/.label,
DialogueNode.speaker, Character.mana/maxMana, ActiveEffect.id/.name,
EffectStatTarget tightening, GameState index signature) — mobile's
local types had drifted against the engine's actual shipped shapes,
not regressed during the 0.10.0 → 0.10.2 bump.

Per Phase 61 D1, ship the right deliverable: a canonical migration
guide in [unreleased] Migration notes that gives mobile (and any
future consumer) the per-symbol replacement table. Higher-fidelity
than retroactive rewrites of pre-0.7.0 release sections (the
public-surface fixture doesn't exist before 0.10.1 — Phase 53 D1).

Changes:
- CHANGELOG.md [unreleased] populated:
  - ### Added: FriendshipReward + Enemy.friendshipReward? +
    CombatEndReport.friendshipReward? (Phase 60).
  - ### Changed: pickEnemySkill un-exported (iterate c15d3fa);
    combat.resolver.test.ts → .engine.test.ts (iterate 7bf8115).
  - ### Docs: Spec 14 (Phase 58); Phase 59 zero-residual audit; CI
    workflow surfaced in docs/testing.md (iterate b7a3fa6); spec.md
    publish-stale flipped (iterate 0931ce8); README/bearings/
    scripts/README/docs/api.md front-door currency (iterates 650f2b2,
    59a0439, 9bed952); befriend.engine.test simplification (iterate
    e5d1799).
  - ### Migration notes: 3 subsections — (1) 0.10.2 → [unreleased]:
    none required; (2) re-grounding consumer-side types: 9-row
    canonical migration table mapping each mobile-flagged symbol to
    its replacement; (3) authoritative shape pointer: src/index.ts +
    dist/index.d.ts + scripts/public-surface.expected.json + the
    Phase 53 diff tool.
- CHANGELOG.md 0.10.0 ### Removed block extended to include
  getCoastalMap (per D6 consistency fix) — the migration note for
  the function was already present; the explicit Removed bullet was
  missing.
- plan/CRITIQUE.md critique-26 row moved Pending → Done with
  shipping reference (this commit hash).

Pure docs change; 629/629 tests stay green; verify + deploy:check
clean (the tag/CHANGELOG assertion ignores `(unreleased)` headings).
Per D5, mobile #93 comment deferred to a separate post-push step
so the comment links to a published canonical reference.

Closes critique-26 row; unblocks mobile #93 Phase 60 re-scope.
```

## Definition of Done

- [ ] `CHANGELOG.md` `[unreleased]` populated with Added / Changed /
      Docs / Migration notes per Unit 1.
- [ ] Migration notes carries the 9-row consumer-side re-grounding
      table per D1.
- [ ] `CHANGELOG.md` 0.10.0 `### Removed` block lists
      `getCoastalMap` (D6).
- [ ] `plan/CRITIQUE.md` critique-26 row moves Pending → Done with
      this commit's hash.
- [ ] `npm run verify` green; `npm run deploy:check` green.
- [ ] `plan/steps/01_build_plan.md` Phase 61 row flips `[ ]` → `[x]`.
- [ ] Mobile #93 comment is **optional / deferred** per D5 — author
      it manually after the engine push if it adds value.

## Follow-ups (out of scope)

- **Mobile #93 comment.** Per D5, ship after the engine push so the
  comment links to a public migration guide. Format: short comment
  with the `Closes #93`-flavored link to this commit + the
  CHANGELOG.md `[unreleased]` Migration notes section anchor.
- **Per-tag `### Removed` blocks for pre-v0.7.0 history.** The
  public-surface fixture doesn't exist before 0.10.1 (Phase 53 D1
  history); attempting retroactive coverage is low-fidelity work.
  Skip unless a future consumer specifically asks.
- **A `### Breaking` heading convention.** Keep-a-Changelog doesn't
  prescribe one; the existing `### Removed` heading covers it. If
  future work wants a louder marker, consider adding a
  `### Breaking` heading to the format — content / structure phase,
  not Phase 61.
- **Mobile's Phase 60 re-scope.** Mobile decides whether to ship as
  a single phase or a 60a..60f sequence — that's a mobile-side
  decision once the engine's canonical migration guide is visible.

## Canonical sibling

`plan/phases/phase_52_release_process_artifacts.md` is the closest
shipping precedent — Phase 52 authored CHANGELOG.md + RELEASING.md
in the first place; Phase 61 follows the same Keep-a-Changelog
conventions. The diff-tool cross-link pattern is consistent with
Phase 53's `diff-public-surface.mjs` author guidance.
