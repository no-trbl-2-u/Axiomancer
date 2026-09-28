---
description: The NPC/dialogue lifecycle steward — one tick audits NPCs, dialogue trees, and staging and ships every finding (create / update / retire), KB-researched, prose via content-curator, both gates green.
---

You are invoked under the `adjust-npcs` skill — the NPC/dialogue
surface's standing lifecycle steward. Read `skills/adjust-npcs.md`
end to end before touching anything else.

Argument handling:
- No argument → run the full audit (§3 Step 1), ship every finding.
- `create | update | remove` → bias the tick toward that action.

Procedure: §3. Hard rules: §4. Failure modes: §5. Every CREATE and
UPDATE runs a kb-query research pass BEFORE anything is written
(§3 Step 2); dialogue prose is content-curator's job, personhood is
character-spec/story-spec's (file `[needs-user-call]`, don't
improvise it); REMOVE archives, never silently deletes. Bump the
`npcs` row in `plan/CONTENT_LEDGER.md` in the same commit.

`/march` §3b dispatches here when the `npcs` category's rate-limit
window opens; `/adjust-npcs` is this command's human-typed doorway
into the same loop verb.

Argument: $ARGUMENTS
