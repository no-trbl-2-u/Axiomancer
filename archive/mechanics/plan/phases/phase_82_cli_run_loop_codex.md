# Phase 82 — CLI run-loop + Codex integration (Phase 72 + 73 consumer surfaces)

> Wires the Phase 72 (`store.resetRun`) and Phase 73
> (`state.codex.unlockedEntries` + `Enemy.journalEntry`) engine
> surfaces into the reference CLI consumer. Closes the "engine ships
> the surface; the CLI demonstrates it" invariant.

## Outcome

`src/CLI/game.cli.ts` gains two new top-level tabs:

- **Codex tab** — `codexTab(store)` renders each unlocked entry from
  `state.codex.unlockedEntries`, looking up the source enemy's
  `journalEntry` via a walk of `EnemyLibrary` (titles + body).
- **Reset tab** ("Begin again") — `resetTab(store)` prompts for full
  reset vs keep-character, dispatches `store.resetRun(opts)`, and
  surfaces the post-reset hearth node + new runId.

Plus a new agent-graded walkthrough (`codex-unlock.{json,goal.md}`)
that exercises the codex unlock path end-to-end, and a
`docs/gameloop.md` § "game.cli.ts" fold-in note.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 82 row — promoted
at oversight-19 2026-05-24 (commit `7419142`). Original candidate
filed at expand-22 (`4826c37`) framing the CLI reference-consumer gap
for Phase 72/73.

## Sibling brief

`plan/phases/phase_67_*.md` (if any) — the last CLI-tab addition.
Otherwise the `journalTab` (read-only render at `src/CLI/game.cli.ts:371`)
is the canonical sibling for the Codex tab; `saveTab` /`loadTab`
(`:544` / `:563`) are the closest siblings for the reset prompt.

## Implementation units

### Unit 1 — Codex tab

```typescript
// Tab union additions
type Tab = ... | 'codex' | 'reset' | ...;

// EnemyLibrary import for codex lookup
import { EnemyLibrary } from '../Enemy/enemy.library';

function buildCodexLookup(): Map<string, CodexEntry> {
    const map = new Map<string, CodexEntry>();
    for (const enemy of EnemyLibrary) {
        if (enemy.journalEntry) {
            map.set(enemy.journalEntry.id, enemy.journalEntry);
        }
    }
    return map;
}

const codexLookup = buildCodexLookup();

function codexTab(store: GameStoreHandle): void {
    const { codex } = store.getState();
    log('\n— Codex —');
    if (codex.unlockedEntries.length === 0) {
        log('Your codex is empty — befriend a foe with a journal entry to start filling it.');
        return;
    }
    for (const entryId of codex.unlockedEntries) {
        const entry = codexLookup.get(entryId);
        if (!entry) {
            log(`  • ${entryId}  (unknown entry — source may have been removed from the library)`);
            continue;
        }
        log(`  • ${entry.title}`);
        log(`    ${entry.body}`);
        log('');
    }
}
```

Add to `pickTab`'s tab list (between Skills and Inventory per the
canonical journalTab → skillsTab ordering) + the main dispatch
switch.

### Unit 2 — Reset tab (Begin again)

```typescript
async function resetTab(store: GameStoreHandle): Promise<void> {
    const { mode } = await prompt<{ mode: 'full' | 'keep' | 'cancel' }>([
        {
            type: 'rawlist',
            name: 'mode',
            message: 'Begin again — how?',
            choices: [
                { name: 'Full reset — new character + new world', value: 'full' },
                { name: 'Keep character — fresh world, same character ledger', value: 'keep' },
                { name: 'Cancel — back to the main menu', value: 'cancel' },
            ],
        },
    ]);
    if (mode === 'cancel') return;
    const keepCharacter = mode === 'keep';
    const before = store.getState();
    const after = store.getState().resetRun({ keepCharacter });
    log(`\nBegan again. (keepCharacter: ${keepCharacter})`);
    log(`Run id     : ${after.runId}`);
    log(`Hearth node: ${after.world.currentMap.currentNode}`);
    logState('resetRun', before, after, { keepCharacter });
}
```

Add to `pickTab`'s tab list (just before Save/Load — the "begin
again" mental model sits near the persistence-adjacent options) +
the main dispatch switch.

### Unit 3 — Walkthrough + docs

**`automation/scripts/walkthroughs/codex-unlock.{json,goal.md}`** —
the canonical demonstration of the codex-unlock path:
1. Apprentice preset.
2. Map → fv-11 → fv-14 → fv-15 (MournfulGull encounter — guaranteed
   via the weight-1 `fvGullCrag` pool, mirroring
   `fishing-village-exploration`).
3. In combat: 3-5 consecutive heart-stance defends. If MournfulGull
   also defends on enough of those rounds, the friendship counter
   caps at `FRIENDSHIP_COUNTER_MAX = 3` (MournfulGull has no
   `befriendabilityConfig` override per Phase 60, so the default
   Phase 36 path fires).
4. After combat ends (`outcome === 'friendship'`), navigate to the
   Codex tab.
5. Quit.

Goal: pin the codex unlock — `state.codex.unlockedEntries` should
contain `'codex-mournful-gull'` after the friendship; the codex tab
output should include the "Catalogue of Slights" title + body.
**Grades on either** friendship-fires OR script-exhausted-without-
friendship (per D3 — MournfulGull may attack rather than defend on
some rounds, breaking the both-defend pattern; non-deterministic).

**`docs/gameloop.md` § "game.cli.ts"** — extended with a paragraph
naming the two new tabs + their Phase 72/73 wire-up.

**`automation/scripts/walkthroughs/README.md`** — new inventory row
for `codex-unlock`.

**`CHANGELOG.md [unreleased] ### Added`** — entry for the CLI Codex
tab + Begin again command + walkthrough.

## Decisions made upfront — DO NOT ASK

- **D1 — Single-commit ship for code + walkthrough + docs.** All
  three units touch separate file groups (CLI source / walkthroughs /
  docs); per ship-a-phase Step 10 "one summary commit if the brief
  doesn't specify units" — the units are tightly coupled (the
  walkthrough exercises the new tabs; the docs describe them).

- **D2 — `EnemyLibrary` walk for codex lookup, not a new registry
  export.** `EnemyLibrary` is already exported from
  `src/Enemy/enemy.library.ts:705`. Building the codex lookup
  in-CLI via `buildCodexLookup()` is O(15) one-time work at module
  load — no need to push a `codexLookup` export through the public
  barrel (which would require fixture bump + Spec 12 acceptance
  edit). Future dialogue-driven codex entries (not on enemies)
  would need a registry refactor; that's a separate phase.

- **D3 — Walkthrough grades on either friendship-fires OR script-
  exhausted.** Same shape as Phase 81's `fishing-village-exploration`
  walkthrough — MournfulGull's AI may attack rather than defend on
  some rounds, breaking the friendship-counter pattern. The
  walkthrough's value is exercising the surface (codex tab
  navigation + the friendship-unlocked-codex path is documented);
  the agent grader notes which path surfaced.

- **D4 — Tab ordering: Codex between Skills and Inventory; Reset
  between Debug and Save.** Codex is a read-only knowledge tab
  (sibling to Skills); Reset is a state-mutating prompt sibling to
  Save/Load. Both placements minimise menu reshuffling for
  existing-walkthrough scripts that rely on tab number positions.

- **D5 — `resetTab` accepts both keep-character AND full-reset
  paths.** The Phase 72 `resetRun({ keepCharacter })` surface
  supports both per the contract; the CLI should demonstrate both.
  The third "cancel" option is added per CLI convention (every
  state-mutating prompt should have an escape hatch).

- **D6 — `logState('resetRun', before, after, ...)` after the
  dispatch.** Matches the canonical pattern at `mapTab:138` /
  `mapTab:149`. Ensures agent-graded walkthroughs can verify the
  reset by inspecting the state log.

- **D7 — Empty-state copy for the codex tab.** Per the candidate
  body: "Your codex is empty — befriend a foe with a journal entry
  to start filling it." Verbatim from the candidate.

- **D8 — No public-surface change.** No new exports. `EnemyLibrary`
  + `CodexEntry` already on the public barrel. The fixture stays
  237 runtime + 167 types; `GAME_STATE_VERSION` unchanged.

- **D9 — `docs/gameloop.md` § "game.cli.ts"** is the canonical
  doc surface; no separate CLI README is required.

- **D10 — Walkthrough authoring follows Phase 81's pattern.** Same
  agent-graded harness conventions; same `.json + .goal.md` pair;
  same README inventory row format.

## Verify gate

`npm run verify` (type-check + test + build). The only TypeScript
change is to `src/CLI/game.cli.ts`; no hermetic e2e covers the CLI
file directly (per `docs/testing.md` "What CANNOT be tested
hermetically — the TTY-driven `npm run game` path"). Verify should
stay green automatically. The new walkthrough is content-only.

## Commit body template

```
feat(cli): Phase 82 shipped — CLI run-loop + Codex integration (Phase 72/73 consumer surfaces)

- src/CLI/game.cli.ts:
  - Tab union extended with 'codex' + 'reset'
  - codexTab(store) renders state.codex.unlockedEntries; looks up
    each entry via in-CLI buildCodexLookup() walk of EnemyLibrary
  - Empty-state copy: "Your codex is empty — befriend a foe with a
    journal entry to start filling it." (verbatim from candidate)
  - resetTab(store) prompts full / keep / cancel, dispatches
    store.resetRun({ keepCharacter }), surfaces post-reset runId +
    hearth node, logState('resetRun', ...) for walkthrough visibility
  - Tab ordering per D4: Codex between Skills and Inventory; Reset
    between Debug and Save
- automation/scripts/walkthroughs/codex-unlock.{json,goal.md}:
  Apprentice → fv-11 → fv-14 → fv-15 (MournfulGull) → heart-defends
  → friendship-or-exhausted → codex tab → quit. Grades on either
  outcome per D3.
- automation/scripts/walkthroughs/README.md inventory: 1 new row
- docs/gameloop.md § "game.cli.ts" extended with Codex/Reset fold-in
- CHANGELOG.md [unreleased] ### Added entry
- plan/steps/01_build_plan.md Phase 82 row flipped [ ] → [x]

Decisions:
- D1: single-commit ship
- D2: EnemyLibrary walk for codex lookup (no new public export)
- D3: walkthrough grades on friendship-fires OR script-exhausted
- D4: tab ordering (Codex between Skills+Inventory; Reset between
  Debug+Save)
- D5: resetTab accepts full / keep / cancel
- D6: logState('resetRun', ...) after dispatch
- D7: empty-state copy verbatim from candidate
- D8: no public-surface change (fixture stays 237 runtime + 167 types)
- D9: docs/gameloop.md is the canonical doc surface
- D10: walkthrough follows Phase 81 pattern

713/713 tests stay green; verify + deploy:check clean.
Brief committed at <this-commit>.
```

## Definition of Done

- [ ] `src/CLI/game.cli.ts` Tab union extended; `codexTab` +
      `resetTab` added; main dispatch switch + `pickTab` list
      updated.
- [ ] `automation/scripts/walkthroughs/codex-unlock.json` +
      `.goal.md` ship.
- [ ] `automation/scripts/walkthroughs/README.md` inventory gains
      1 new row.
- [ ] `docs/gameloop.md` § "game.cli.ts" fold-in note.
- [ ] `CHANGELOG.md [unreleased] ### Added` entry.
- [ ] `plan/steps/01_build_plan.md` Phase 82 row flipped `[ ]` →
      `[x]`.
- [ ] `npm run verify` passes.
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- Future codex-content sources (dialogue trees, map events) would
  need a centralised `codexRegistry` export on the public barrel;
  the current EnemyLibrary walk in-CLI is correct for the
  Phase-73-only origin.
- Phase 87 (per-module quickstart pages) would gain a `docs/quickstart-gameloop.md`
  that includes the Codex + Reset tabs.
- Agent-grader run of `codex-unlock` happens on a separate
  cron/user trigger; not run in this ship per Phase 81 D9.
