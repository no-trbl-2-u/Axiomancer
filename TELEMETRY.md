# TELEMETRY.md — skill & subagent invocation log

Appended by `.claude/hooks/telemetry.mjs` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent 400 rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

| when (UTC) | event | name | model | invoked from | detail |
|---|---|---|---|---|---|
| 2026-07-17T08:32:42Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-17T10:26:38Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-17T14:09:58Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-17T14:10:37Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-07-17T14:11:32Z | subagent | Explore | claude-sonnet-5 | main | Explore enemy archetype + rung telegraph plumbing |
