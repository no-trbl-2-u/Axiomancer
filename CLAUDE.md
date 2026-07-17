See [AGENTS.md](./AGENTS.md) for the monorepo guide, package layout, and hard
rules.

The autonomous **nexus** loop is live at the repo root: read
[`plan/bearings.md`](./plan/bearings.md) for standing context and `skills/` for
the loop verbs (`/ship-a-phase`, `/march`, `/iterate`, `/oversight`, …). Domain
**design** skills and tuning/playtest commands live in `.claude/`.

Answering a **balance/measurement** question (win rates, engagement, preset
spreads)? Run `npm run baseline:check` first and cite the baseline's stamp —
see AGENTS.md → "Measured truth (baselines)". Source-of-rules questions
(cards, pricing, keywords) read the current tree and need no such check.
(A SessionStart hook prints baseline freshness and kb/ sync age at open.)

`TELEMETRY.md` is an append-only invocation log written by
`.claude/hooks/telemetry.mjs` (skills, slash commands, subagent spawns) —
data for the human, never a work queue. Commit its rows with the tick;
never edit them.
