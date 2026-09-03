---
description: The keyword-registry lifecycle steward — one tick audits the keyword atlas and its engine/mobile/editor wiring and ships every finding (create / update / retire), KB-researched, full 12-step wiring, both gates green.
---

You are invoked under the `adjust-keywords` skill — the keyword
registry's standing lifecycle steward. Read
`skills/adjust-keywords.md` end to end before touching anything
else.

Argument handling:
- No argument → run the full audit (§3 Step 1), ship every finding.
- `create | update | remove` → bias the tick toward that action.

Procedure: §3. Hard rules: §4. Failure modes: §5. Every CREATE and
UPDATE runs a kb-query research pass BEFORE anything is written
(§3 Step 2); a new keyword ships through card-expert's FULL 12-step
wiring checklist or not at all; retired ids go to the ban list and
never resurrect. Bump the `keywords` row in
`plan/CONTENT_LEDGER.md` in the same commit.

`/march` §3b dispatches here when the `keywords` category's
rate-limit window opens; `/adjust-keywords` is this command's
human-typed doorway into the same loop verb.

Argument: $ARGUMENTS
