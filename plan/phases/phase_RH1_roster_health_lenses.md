# Phase RH1 — Roster-health lenses

> Agent-facing brief, plotted by T (`/plot`, 2026-10-12, from the
> `[owner]` candidate "Roster-health lenses for /iterate"). Tooling only:
> the audit reports, it never authors, re-rosters or retires content
> (D37, D88). Ship without asking; record judgment calls in the commit
> body.

## Sources

- `plan/PHASE_CANDIDATES.md` → "Roster-health lenses for /iterate: dead or
  unreachable enemies, items and NPCs as audit findings" (proposed
  2026-10-12, R11 item 6; promoted here as "briefed").
- The archived stewards' Step 1 signal tables:
  `archive-pre-revamp:plan/archive/2026-09-28-revamp-r0/skills/adjust-{enemies,equipment,npcs}.md`.
  Only their *audit* half returns; their create/retire halves contradict
  D88 and stay archived.
- Precedent in the tree: `World/narrative-reachability.ts` +
  `World/e2e/narrative-reachability.engine.test.ts` (a pure audit over
  static definitions, with a hermetic invariant test), and
  `World/encounter.test.ts`'s traversal audit shape.
- Decisions: **D88** (enemies, relics, NPCs and events are built or
  removed only from a brief T approved; this phase files, never fixes,
  roster changes), **D37** (THE CARD HOLD; cards are not a lens here),
  **D90** (a defect found while shipping is fixed in-tick), **D84** (code
  by `loop:pr` PR).
- `skills/iterate.md` §4 (audit categories; `content` rows are filed and
  never picked) and §5 Step 1 (the audit block shape);
  `plan/bearings.md` → "AUDIT category taxonomy".

## Outcome

`/iterate`'s audit sees the roster the way the retired stewards did:
every enemy, consumable, relic, NPC, dialogue node and quest reference
is checked for being dangling (points at nothing) or orphaned (nothing
points at it), from one pure engine module with a CLI and a test. A
dangling reference is a `gap` the loop fixes; an orphan is a `content`
row T decides.

## Acceptance

- **A1** `axiomancer-mechanics/src/World/roster-health.ts` exports
  `auditRosterHealth(): RosterHealthReport`, pure over the registered
  libraries and map-event pools (it calls `registerMapEventContent()`
  itself if nothing is registered, the way the reachability test does),
  returning `{ dangling: RosterFinding[], orphans: RosterFinding[] }`
  with each finding `{ lens, subject, id, where, detail }`.
- **A2** The **dangling** lenses (something names an id that does not
  exist): a map node or event pool naming an enemy slug not in
  `ENEMY_REGISTRY`; a loot table (`Enemy/loot.ts` entries on any enemy)
  or cache/shop pool naming a consumable or relic id not in
  `consumableLibrary` / `relicLibrary`; a relic `grantsSignature` not in
  the signature registry; a `DialogueChoice` whose `nextNodeId` is not a
  node of its tree, or whose `startQuest`/`progressQuest` names a quest
  no library defines, or whose `teachCard` names a card not in the
  library; a map interaction naming an NPC not on that map's roster and
  not in `unstagedNpcs` (reuse `auditNarrativeReachability`'s
  `sceneryAsPeople`).
- **A3** The **orphan** lenses (nothing reaches it): an enemy in
  `EnemyLibrary` in no `EnemiesByMap` pool and no registered encounter
  pool (`Sandbag_01` is excluded by name as the dev dummy); a consumable
  or relic that no cache tier, shop, loot table, starting loadout or
  reward pool can grant (the dev menu's GET ALL RELICS does not count as
  reachable); a rostered NPC with a `dialogueTree` no node names
  (`unreachableNpcs`); a dialogue node no choice and no entry point
  reaches; a quest no dialogue choice or map event starts.
- **A4** `axiomancer-mechanics/src/World/e2e/roster-health.engine.test.ts`
  asserts `dangling` is empty against the live tree (a hard invariant,
  like the traversal and reachability tests), and pins the current
  `orphans` list by id so a new orphan fails the test with its name (the
  test's fixture is updated in the same change that adds or removes the
  content, which is how the loop notices).
- **A5** `npm run roster-health -w axiomancer-mechanics` prints the
  report as an aligned table; `-- --json` prints the report object and
  nothing else.
- **A6** `skills/iterate.md` §4 gains category **H. Roster health**:
  run the CLI with `--json`; each `dangling` finding is a `gap` (impact
  6, ease from the fix: delete or re-point a reference, never add or
  remove a roster entity); each `orphans` finding is a `content` row
  (file only, D88) whose `next:` line says "needs a brief T approves:
  stage it, grant it, or retire it". §5 Step 1's audit block gains the
  example row. Findings are deduplicated against open AUDIT rows by
  (lens, id).
- **A7** Hard rule in the skill text and the module header: this audit
  never edits a library, pool, roster or dialogue tree; a `gap` fix
  touches only the dangling reference. Covered by `scripts/loop-pr.test.mjs`
  only if a workflow is added (none is).
- **A8** `docs/game-model.md` gains one line under its content section
  pointing at the CLI as the way to answer "is X reachable in play".

**Measure:** `npm run verify -w axiomancer-mechanics && npm test` green,
and `npm run roster-health -w axiomancer-mechanics -- --json` prints a
report whose `dangling` array is empty and whose `orphans` array matches
the pinned fixture.

## Scope

| File | Workspace | Role |
|---|---|---|
| `axiomancer-mechanics/src/World/roster-health.ts` | mechanics | The pure audit (A1–A3). One function per lens, composed by `auditRosterHealth`. |
| `axiomancer-mechanics/src/World/e2e/roster-health.engine.test.ts` | mechanics | A4. Plus unit cases per lens using small synthetic definitions (a tree with a bad `nextNodeId`, a loot table with an unknown id) so each lens is proven to fire. |
| `axiomancer-mechanics/src/CLI/roster-health.cli.ts` | mechanics | A5. UI only. |
| `axiomancer-mechanics/package.json` | mechanics | `"roster-health": "ts-node src/CLI/roster-health.cli.ts"`. |
| `axiomancer-mechanics/src/index.ts` | mechanics | Export `auditRosterHealth` and the report types. |
| `skills/iterate.md` | root | A6, A7. |
| `docs/game-model.md` | root | A8. |
| `plan/PHASE_CANDIDATES.md` | root | The candidate moves to Promoted when this ships (the `/plot` commit already marks it briefed). |

Nothing is deleted. No content file changes.

## Consumers to update

- `axiomancer-mechanics/src/index.ts` (export).
- `skills/iterate.md` (the new category and block example).
- No mobile change; the module is engine-only and the CLI is dev-side.

## Save / schema contracts

None.

## Carrier sweep

Not an R-phase. No glossary or glyph changes.

## Decisions made upfront — DO NOT ASK

1. **Dangling is a test failure; orphan is a report.** A dangling
   reference is a bug by any reading and the loop may fix it (delete or
   re-point the reference, D90). An orphan is a design state: staging,
   granting or retiring it changes what the game offers, which is
   content under D88, so it is filed `content` and waits for T.
2. **Orphans are pinned, not forbidden.** A4 pins the current list so the
   test stays green today and a *change* in orphans is what fails. If the
   first run finds orphans, record them in the fixture and file one
   `content` AUDIT row per orphan in the shipping PR; do not fix any.
3. **Cards and keywords are not lenses** (D37). A `teachCard` pointing at
   a missing card is a dangling *dialogue* reference (A2); the card
   library itself is not audited here.
4. **The dev dummy `Sandbag_01` and the dev-menu grants are excluded**
   from reachability. They exist for the dev menu, not for play.
5. **Signature registry** is whatever `Combat/combat.signature.ts`
   exports as the id set; if there is no exported set, add a
   `SIGNATURE_SKILL_IDS` constant beside the definitions (additive).
6. **Category mapping in `/iterate`**: `gap` for dangling (impact 6 flat;
   ease 8 for a one-line delete, 5 for a re-point that needs a test
   edit), `content` for orphans (impact 4, ease irrelevant, never picked).
   A `debt` reading was considered for orphans and rejected: debt implies
   the loop may clear it.
7. **No workflow, no cron.** The test runs in the mechanics verify gate on
   every PR; the CLI is for `/iterate`'s audit and humans.
8. **Shops**: audit whatever `shop.reducer.ts` / `shop.types.ts` expose as
   stock; if Act 1 has no shop stock table yet, the shop lens reports
   nothing and says so in the module comment, rather than inventing one.

## Tests matrix

| Suite | Subject |
|---|---|
| `World/e2e/roster-health.engine.test.ts` (new) | live tree: dangling empty, orphans pinned; synthetic cases: each lens fires on a planted fault |
| `World/e2e/narrative-reachability.engine.test.ts` (existing) | untouched; roster-health composes its audit, does not replace it |
| root `npm test` | no new root suite; `check-lexicon` / `check-prose` pass on the skill and doc edits |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm test
npm run roster-health -w axiomancer-mechanics -- --json
```

Run `npm run typecheck -w axiomancer-mobile` once for the additive export.

## Commit body template

```
loop: phase RH1 — roster-health lenses

auditRosterHealth over enemies, items, NPCs, dialogue and quests:
dangling references fail the engine test, orphans are pinned and filed
as [content] AUDIT rows for T (D88). /iterate §4 gains category H.
Nothing staged, granted or retired.

Acceptance: A1-A8.
Judgment calls: <orphans found on first run, by id; any lens with no
surface to audit yet>.
```

## DoD

A1–A8 ticked in the PR body.

## Follow-ups (out of scope)

- A B2 enemy brief (owner-led) can cite the orphan list as its starting
  inventory.
- Running the CLI nightly in `/digest` as a "roster" line, once the
  report has been seen to change at least once.
