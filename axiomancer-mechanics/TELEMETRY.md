# TELEMETRY.md — skill & subagent invocation log

Appended by `.claude/hooks/telemetry.mjs` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent 400 rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

| when (UTC) | event | name | model | invoked from | detail |
|---|---|---|---|---|---|
| 2026-08-12T08:09:15Z | subagent | general-purpose | claude-sonnet-5 | main | Retheme alignment cells 1-9 to dark fantasy |
| 2026-08-12T08:10:01Z | subagent | general-purpose | claude-sonnet-5 | main | Retheme alignment cells 10-18 to dark fantasy |
| 2026-08-12T08:10:49Z | subagent | general-purpose | claude-sonnet-5 | main | Retheme alignment cells 19-27 to dark fantasy |
| 2026-09-05T15:22:42Z | subagent | content-curator | claude-sonnet-5 | main | Ship adjust-npcs pass 1 |
| 2026-09-08T02:39:13Z | subagent | card-expert | claude-sonnet-5 | main | Run adjust-cards lifecycle tick |
| 2026-09-15T22:32:00Z | subagent | mechanics-expert | claude-sonnet-5 | main | Design 3 new signature skills for equipment progression |
