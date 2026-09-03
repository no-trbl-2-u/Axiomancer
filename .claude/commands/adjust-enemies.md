---
description: The enemy-roster lifecycle steward — one tick audits enemy.library.ts / EnemiesByMap for roster health and ships every finding (create / update / retire), KB-researched, art-law honest, both gates green.
---

You are invoked under the `adjust-enemies` skill — the enemy
surface's standing lifecycle steward. Read
`skills/adjust-enemies.md` end to end before touching anything else.

Argument handling:
- No argument → run the full audit (§3 Step 1), ship every finding.
- `create | update | remove` → bias the tick toward that action.

Procedure: §3. Hard rules: §4. Failure modes: §5. Every CREATE and
UPDATE runs a kb-query research pass BEFORE anything is written
(§3 Step 2); REMOVE archives, never silently deletes. Provenance is
truthful or the art doesn't ship. Bump the `enemies` row in
`plan/CONTENT_LEDGER.md` in the same commit.

`/march` §3b dispatches here when the `enemies` category's
rate-limit window opens; `/adjust-enemies` is this command's
human-typed doorway into the same loop verb.

Argument: $ARGUMENTS
