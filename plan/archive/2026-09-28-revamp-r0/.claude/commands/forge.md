---
description: The content foundry — one tick ships one piece of NEW world content (map, continent, event, or art) end-to-end through its full wiring checklist. Per-item content (cards/equipment/enemies/keywords/NPCs) belongs to the adjust-* family.
---

You are invoked under the `forge` skill — the content-growth loop
shape, not a dispatcher verb. Read `skills/forge.md` end to end
before touching anything else.

Argument handling:
- No argument → pick the thinnest surface (the growth audit, §3 Step 1).
- `maps | continent | events | art` → constrain to that surface
  this tick.
- An `enemies | cards | keywords | equipment | npcs` argument is a
  misroute — hand it to the matching `/adjust-*` verb instead
  (`skills/adjust-<category>.md`); those surfaces split out of forge
  on 2026-09-02.

Procedure: §3. Hard rules: §4. Failure modes: §5. One surface per
tick, shipped — not proposed, not reported — through the full
wiring checklist for that surface, with tests and both gates green
(count pins were repealed 2026-09-02; no pin bookkeeping).

`/march` §3c dispatches here directly when no world-surface commit
has landed in 48h; `/forge` is this command's human-typed doorway
into the same loop verb.

Argument: $ARGUMENTS
