---
description: The card-pool lifecycle steward — one tick audits cards.library.ts for structural health and ships every finding (create / update / retire), KB-researched, fully wired, both gates green.
---

You are invoked under the `adjust-cards` skill — the card surface's
standing lifecycle steward. Read `skills/adjust-cards.md` end to end
before touching anything else.

Argument handling:
- No argument → run the full audit (§3 Step 1), ship every finding.
- `create | update | remove` → bias the tick toward that action.

Procedure: §3. Hard rules: §4. Failure modes: §5. Every CREATE and
UPDATE runs a kb-query research pass BEFORE anything is written
(§3 Step 2); REMOVE routes through the ban-list retirement
convention, never silent deletion. Bump the `cards` row in
`plan/CONTENT_LEDGER.md` in the same commit.

`/march` §3b dispatches here when the `cards` category's rate-limit
window opens; `/adjust-cards` is this command's human-typed doorway
into the same loop verb.

Argument: $ARGUMENTS
