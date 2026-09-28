---
description: The equipment/item lifecycle steward — one tick audits the signet relics, consumables, and shop/reward pools and ships every finding (create / update / retire), KB-researched, both gates green.
---

You are invoked under the `adjust-equipment` skill — the item
surface's standing lifecycle steward. Read
`skills/adjust-equipment.md` end to end before touching anything
else.

Argument handling:
- No argument → run the full audit (§3 Step 1), ship every finding.
- `create | update | remove` → bias the tick toward that action.

Procedure: §3. Hard rules: §4. Failure modes: §5. Every CREATE and
UPDATE runs a kb-query research pass BEFORE anything is written
(§3 Step 2); REMOVE archives, never silently deletes. The lean
signet-relic shape stands — resurrecting rarity/affixes is a
`[loop-call]` filing, not a tick decision. Bump the `equipment` row
in `plan/CONTENT_LEDGER.md` in the same commit.

`/march` §3b dispatches here when the `equipment` category's
rate-limit window opens; `/adjust-equipment` is this command's
human-typed doorway into the same loop verb.

Argument: $ARGUMENTS
