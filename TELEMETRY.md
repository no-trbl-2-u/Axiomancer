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
| 2026-07-17T15:38:17Z | slash-prompt | /march | unknown | user/ci | /march Implement phase 36a |
| 2026-07-17T15:44:22Z | subagent | mechanics-expert | claude-opus-4-8 | main | Design opinion on alt-win-aware pricing |
| 2026-07-17T17:19:56Z | subagent | Explore | unknown | main | Map current combat dice system |
| 2026-07-17T17:22:15Z | subagent | mechanics-expert | claude-fable-5 | main | Analyze upgradeable-dice combat proposal |
| 2026-07-17T17:37:13Z | subagent | mechanics-expert | claude-fable-5 | main | Design stance alternatives sans RPS |
| 2026-07-17T19:25:17Z | subagent | mechanics-expert | claude-fable-5 | main | D1 mechanics-expert spec 33 review |
| 2026-07-17T21:14:27Z | skill | ship-a-phase | claude-fable-5 | main | - |
| 2026-07-17T21:40:09Z | slash-prompt | /fix-ci | unknown | user/ci | /fix-ci 29615233695 |
| 2026-07-17T22:07:21Z | slash-prompt | /loop | unknown | user/ci | /loop 1h /march |
| 2026-07-17T22:08:20Z | skill | march | claude-opus-4-8 | main | - |
| 2026-07-17T22:13:28Z | subagent | Explore | claude-opus-4-8 | main | Map dice sim/autoplay infra |
| 2026-07-17T23:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-17T23:14:34Z | subagent | card-expert | claude-opus-4-8 | main | Implement Phase D4 card/pricing re-authoring |
| 2026-07-18T00:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-18T00:11:40Z | subagent | Explore | claude-opus-4-8 | main | Map D5 gear/migration/encounter surface |
| 2026-07-18T00:16:00Z | subagent | general-purpose | claude-opus-4-8 | main | Implement Phase D5 die gear + blacksmith |
| 2026-07-18T01:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-18T01:12:31Z | subagent | Explore | claude-opus-4-8 | main | Scope D6 mobile combat UI surface |
| 2026-07-18T02:09:51Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
