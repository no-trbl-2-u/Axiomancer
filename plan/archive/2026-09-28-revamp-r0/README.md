# R0 archive — the retired loop machinery (2026-09-28)

Archived in Phase R0 of THE REVAMP (`plan/revamp/loop.md`, decision D58).
Everything here is verbatim as it stood at `254f786e`. None of it is live
guidance.

| Archived | Why |
|---|---|
| `skills/adjust-{cards,keywords,enemies,equipment,npcs}.md` + their `.claude/commands/` doorways | The loop creates no content during the revamp (D58). Card and keyword growth also contradicts THE CARD HOLD (D37). |
| `skills/forge.md` + doorway | Used once. Maps are hand-authored; events are restricted by THE BLANK PAGE. |
| `CONTENT_LEDGER.md` | The stewards' pass ledger. Nothing reads it any more. |
| `.claude/agents/card-expert.md` | Teaches pricing, presets and the six themes. B6 writes a fresh card agent. |
| `.claude/agents/mechanics-expert.md` | Built on the retired Heart/Body/Mind and fallacy doctrine. |
| `.claude/agents/reader.md` | A website auditor. There is no site (`Auth: none`). |
| `.claude/agents/content-curator.md` | Writes content the loop may no longer create. `scripts/check-prose.mjs` still cites its voice constitution from here. |
| `.claude/skills/{brainstorm-mechanics,character-spec,story-spec,world-spec,kb-query}/` | The RPS / fallacy / moral-meter identity, mostly shared text, wrong output paths. The `kb-query` MCP tools stay callable directly. |

Folded out before archiving: the 12-step keyword wiring checklist now lives in
`axiomancer-mechanics/docs/keyword-atlas.md` ("Wiring a keyword"); the map
wiring contract in `axiomancer-mechanics/docs/world.md` ("Map Registry" and
"Map shape").

Owner action outside the repo: remove the globally installed
`anthropic-skills:rpg-mechanics-brainstorm` duplicate.
