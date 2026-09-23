# TELEMETRY.md — skill & subagent invocation log

Appended by `.claude/hooks/telemetry.mjs` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent 1200 rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

Start rows (`skill`, `subagent`, …) pair with an `-end` row carrying the
duration and outcome. A start row with no `-end` row means the tick died
before the call returned. `-` means not known at write time, never a guess.

| when (UTC) | event | name | model | dur | detail |
|---|---|---|---|---|---|
| 2026-08-12T08:09:15Z | subagent | general-purpose | claude-sonnet-5 | - | Retheme alignment cells 1-9 to dark fantasy |
| 2026-08-12T08:10:01Z | subagent | general-purpose | claude-sonnet-5 | - | Retheme alignment cells 10-18 to dark fantasy |
| 2026-08-12T08:10:49Z | subagent | general-purpose | claude-sonnet-5 | - | Retheme alignment cells 19-27 to dark fantasy |
| 2026-08-12T21:41:32Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-08-12T21:41:34Z | skill | oversight | claude-sonnet-5 | - | - |
| 2026-08-13T03:06:35Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-13T03:37:17Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 1 (7 findings) |
| 2026-08-13T03:37:26Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 2 (7 findings) |
| 2026-08-13T03:37:34Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 3 (7 findings) |
| 2026-08-13T03:37:42Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 4 (7 findings) |
| 2026-08-13T03:37:48Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 5 (7 findings) |
| 2026-08-13T03:37:55Z | subagent | Explore | claude-sonnet-5 | - | Verify AUDIT.md batch 6 (7 findings) |
| 2026-08-13T08:00:53Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-13T09:49:14Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-13T09:49:16Z | skill | digest | unknown | - | - |
| 2026-08-13T13:55:20Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-14T03:05:16Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-14T07:57:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-14T09:45:13Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-14T09:45:15Z | skill | digest | unknown | - | - |
| 2026-08-14T19:26:12Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-14T19:36:07Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-08-15T01:55:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-15T01:56:59Z | subagent | general-purpose | claude-sonnet-5 | - | Execute /expand pass end-to-end |
| 2026-08-15T01:57:01Z | skill | expand | claude-sonnet-5 | - | - |
| 2026-08-15T09:04:01Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-15T09:04:04Z | skill | digest | unknown | - | - |
| 2026-08-15T13:05:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-15T13:05:51Z | skill | march | unknown | - | - |
| 2026-08-15T15:49:38Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-08-15T18:53:46Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-15T18:53:48Z | skill | march | unknown | - | - |
| 2026-08-16T07:07:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-16T07:08:13Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-16T13:01:01Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-16T13:01:25Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-16T18:53:31Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-17T02:00:27Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-17T09:25:14Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-17T09:25:16Z | skill | digest | unknown | - | - |
| 2026-08-17T13:14:03Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-17T13:14:05Z | skill | march | unknown | - | - |
| 2026-08-17T13:14:34Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-17T19:06:19Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-18T01:57:26Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-18T01:57:28Z | skill | march | unknown | - | - |
| 2026-08-18T13:16:44Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-18T19:05:54Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-18T19:12:34Z | subagent | general-purpose | claude-sonnet-5 | - | Ship Phase 46a — early-game rethink design session |
| 2026-08-19T02:01:07Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-19T02:01:09Z | skill | march | unknown | - | - |
| 2026-08-19T09:19:04Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-19T09:19:06Z | skill | digest | unknown | - | - |
| 2026-08-19T13:23:55Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-19T13:23:58Z | skill | march | unknown | - | - |
| 2026-08-19T13:24:46Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-20T01:57:38Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-20T02:00:57Z | subagent | Explore | claude-sonnet-5 | - | Investigate Phase 46c quest discovery gap |
| 2026-08-20T07:15:10Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-20T13:25:22Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-20T14:18:48Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-08-20T14:18:52Z | skill | oversight | claude-sonnet-5 | - | - |
| 2026-08-20T16:39:14Z | subagent | scout | claude-fable-5 | - | Research Mörk Borg design signature |
| 2026-08-20T20:05:33Z | subagent | scout | claude-fable-5 | - | Research Mörk Borg design signature |
| 2026-08-21T02:05:08Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-21T07:16:00Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-21T09:20:31Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-21T09:20:33Z | skill | digest | unknown | - | - |
| 2026-08-21T13:24:38Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-21T19:05:14Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-21T19:07:47Z | subagent | Explore | claude-sonnet-5 | - | Survey mobile combat screen real estate |
| 2026-08-22T07:07:45Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-22T07:07:47Z | skill | march | unknown | - | - |
| 2026-08-22T07:10:23Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-08-22T13:07:47Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-22T13:10:13Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-22T19:15:20Z | subagent | Explore | claude-fable-5 | - | Audit card content pipeline |
| 2026-08-22T19:15:27Z | subagent | Explore | claude-fable-5 | - | Audit keywords/effects pipeline |
| 2026-08-22T19:15:36Z | subagent | Explore | claude-fable-5 | - | Audit narrative content pipeline |
| 2026-08-22T19:15:42Z | subagent | Explore | claude-fable-5 | - | Audit art/asset pipeline |
| 2026-08-22T19:15:51Z | subagent | Explore | claude-fable-5 | - | Audit enemies/world/encounters pipeline |
| 2026-08-22T19:16:02Z | subagent | Explore | claude-fable-5 | - | Audit loop permissions/enforcement |
| 2026-08-23T02:08:05Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-23T02:09:37Z | subagent | Explore | claude-sonnet-5 | - | Research context for Phase 51 GLYPHS sim policy |
| 2026-08-23T07:09:35Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-23T07:11:01Z | subagent | card-expert | claude-sonnet-5 | - | Ship Phase 51 — crackAt policy + GLYPHS evidence |
| 2026-08-23T09:04:56Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-23T13:08:46Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-23T18:54:59Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-23T18:57:29Z | subagent | card-expert | claude-sonnet-5 | - | Ship Phase 40 card-text grammar pass |
| 2026-08-24T02:04:36Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-24T02:07:50Z | subagent | Explore | claude-sonnet-5 | - | Research endCombat routing for phase 54 |
| 2026-08-24T02:12:21Z | subagent | Explore | claude-sonnet-5 | - | Check Enemy/Encounter type compatibility for phase 54 |
| 2026-08-24T07:35:04Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-24T07:35:46Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-24T13:29:08Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-24T13:29:44Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-24T19:09:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-24T19:09:44Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-25T01:58:44Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-25T02:01:37Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-25T07:18:05Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-25T07:19:15Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-25T07:19:54Z | subagent | Explore | claude-sonnet-5 | - | Research map content placement for Phase 60 brief |
| 2026-08-25T09:21:03Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-25T09:21:05Z | skill | digest | unknown | - | - |
| 2026-08-25T13:27:21Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-25T13:27:24Z | skill | march | unknown | - | - |
| 2026-08-25T19:07:38Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-25T19:09:02Z | subagent | Explore | claude-sonnet-5 | - | Map Gathering minigame footprint |
| 2026-08-25T19:14:48Z | subagent | Explore | claude-sonnet-5 | - | Find inline no-screen-detour precedent for item grants |
| 2026-08-26T02:07:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-26T02:10:55Z | subagent | card-expert | claude-sonnet-5 | - | Design and ship Phase 62 — Ally cards |
| 2026-08-26T13:32:17Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-26T13:35:12Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-26T13:35:46Z | subagent | Explore | claude-sonnet-5 | - | Explore Reliquary and rest precedent for phase 63 brief |
| 2026-08-26T20:20:03Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-27T10:03:46Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-27T14:32:27Z | slash-prompt | /loop | unknown | - | /loop 1h /march |
| 2026-08-27T14:32:46Z | skill | march | claude-opus-5 | - | - |
| 2026-08-27T15:32:09Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T16:32:09Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T17:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T18:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T18:50:37Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-08-27T18:56:01Z | skill | expand | claude-sonnet-5 | - | - |
| 2026-08-27T19:17:15Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-27T19:17:17Z | skill | digest | unknown | - | - |
| 2026-08-27T19:32:09Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T20:32:09Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T21:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T22:28:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-27T22:30:52Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-27T22:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-27T23:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-28T00:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-28T01:32:08Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-28T02:32:09Z | slash-prompt | /march | claude-opus-5 | - | /march |
| 2026-08-28T06:00:00Z | subagent | Explore | claude-fable-5 | - | Inventory all owner-gate restrictions |
| 2026-08-28T06:00:12Z | subagent | Explore | claude-fable-5 | - | Map world/continents architecture |
| 2026-08-28T06:00:21Z | subagent | Explore | claude-fable-5 | - | Survey mobile UI screens + issues |
| 2026-08-28T06:01:16Z | subagent | Explore | claude-fable-5 | - | Audit decision-gate documentation |
| 2026-08-28T06:06:23Z | subagent | general-purpose | claude-fable-5 | - | Fix traced UI defects mobile |
| 2026-08-28T06:13:04Z | subagent | general-purpose | claude-fable-5 | - | Build travel system + caverns map |
| 2026-08-28T22:40:00Z | subagent | general-purpose | claude-fable-5 | - | Build Northern City + new enemies |
| 2026-08-29T01:47:47Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-29T14:01:48Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-29T14:01:51Z | skill | digest | unknown | - | - |
| 2026-08-30T05:30:56Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-30T05:30:57Z | skill | march | unknown | - | - |
| 2026-08-30T05:33:10Z | subagent | Explore | claude-sonnet-5 | - | Map glyph/icon systems for Phase V6 |
| 2026-08-30T12:00:21Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-30T12:01:03Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-08-31T05:44:27Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-31T14:01:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-31T14:03:35Z | subagent | Explore | claude-sonnet-5 | - | Map Northern-Continent phase W1-W3 conventions |
| 2026-08-31T16:24:40Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-08-31T16:24:42Z | skill | digest | unknown | - | - |
| 2026-08-31T22:55:18Z | slash-prompt | /march | unknown | - | /march |
| 2026-08-31T22:58:08Z | subagent | general-purpose | claude-sonnet-5 | - | Lift superseded OPEN GATE wall text |
| 2026-09-01T05:17:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-01T05:17:40Z | skill | march | unknown | - | - |
| 2026-09-01T05:20:42Z | skill | expand | claude-sonnet-5 | - | - |
| 2026-09-01T13:43:54Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-01T13:43:57Z | skill | digest | unknown | - | - |
| 2026-09-01T21:07:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-01T21:08:26Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-02T00:20:03Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-02T00:20:05Z | skill | march | unknown | - | - |
| 2026-09-02T00:23:03Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-02T04:22:03Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-09-02T04:44:28Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-02T04:44:30Z | skill | march | unknown | - | - |
| 2026-09-02T04:45:36Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-02T04:46:38Z | subagent | Explore | claude-sonnet-5 | - | Investigate top iterate candidates' fix feasibility |
| 2026-09-02T12:09:57Z | slash-prompt | /consolidate | unknown | - | /consolidate |
| 2026-09-02T12:09:59Z | skill | consolidate | unknown | - | - |
| 2026-09-02T16:41:14Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-03T00:22:02Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-03T00:22:03Z | skill | march | unknown | - | - |
| 2026-09-03T00:25:04Z | subagent | Explore | claude-sonnet-5 | - | Find W5 enemy roster and current portrait assets |
| 2026-09-03T00:27:01Z | subagent | scout | claude-sonnet-5 | - | Source CC art candidates: Seam Tick, Prop-Wight, Unpaid Delver |
| 2026-09-03T00:27:06Z | subagent | scout | claude-sonnet-5 | - | Source CC art candidates: Sump Maren, Toll-Sergeant, Guild Knife |
| 2026-09-03T00:27:12Z | subagent | scout | claude-sonnet-5 | - | Source CC art candidates: The Factor, Wharf Shrike, Harbormaster |
| 2026-09-03T04:41:44Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-03T04:41:46Z | skill | march | unknown | - | - |
| 2026-09-03T11:23:45Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-03T11:23:47Z | skill | march | unknown | - | - |
| 2026-09-03T11:26:40Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-03T13:01:42Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-03T13:01:45Z | skill | digest | unknown | - | - |
| 2026-09-04T04:45:12Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-04T04:45:14Z | skill | march | unknown | - | - |
| 2026-09-04T04:46:12Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-04T04:46:43Z | subagent | card-expert | claude-sonnet-5 | - | Audit and adjust card pool |
| 2026-09-04T16:28:19Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-04T16:28:21Z | skill | march | unknown | - | - |
| 2026-09-04T20:50:17Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-04T20:50:18Z | skill | march | unknown | - | - |
| 2026-09-04T20:50:48Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-05T00:10:41Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-05T00:10:44Z | skill | march | unknown | - | - |
| 2026-09-05T00:14:33Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies content lifecycle pass |
| 2026-09-05T00:14:36Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-05T10:43:14Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-05T10:44:07Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-05T10:46:37Z | subagent | card-expert | claude-sonnet-5 | - | Adjust-keywords audit and ship pass |
| 2026-09-05T12:07:13Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-05T12:07:17Z | skill | digest | unknown | - | - |
| 2026-09-05T15:20:22Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-05T15:21:22Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-05T15:22:42Z | subagent | content-curator | claude-sonnet-5 | - | Ship adjust-npcs pass 1 |
| 2026-09-06T01:09:11Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-06T01:09:36Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-06T05:46:10Z | subagent | Explore | claude-fable-5-1 | - | Audit remaining Debug components |
| 2026-09-06T05:46:27Z | subagent | Explore | claude-fable-5-1 | - | Map current game surface |
| 2026-09-06T10:27:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-06T10:27:51Z | skill | march | unknown | - | - |
| 2026-09-06T10:28:37Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-06T10:29:39Z | subagent | card-expert | claude-sonnet-5 | - | Adjust-cards lifecycle pass |
| 2026-09-06T14:27:07Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-06T14:27:10Z | skill | march | unknown | - | - |
| 2026-09-06T14:27:59Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-07T14:29:04Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-07T14:29:07Z | skill | digest | unknown | - | - |
| 2026-09-07T14:57:12Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-07T15:01:09Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies lifecycle pass |
| 2026-09-07T15:01:11Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-07T18:34:50Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-07T18:36:32Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-07T18:37:15Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords lifecycle pass |
| 2026-09-07T20:30:04Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-07T21:55:35Z | subagent | Explore | claude-fable-5-1 | - | Survey state-fixture tooling |
| 2026-09-07T22:28:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T02:37:28Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T02:38:08Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-08T02:39:13Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards lifecycle tick |
| 2026-09-08T04:20:11Z | skill | artifact-design | claude-fable-5-1 | - | - |
| 2026-09-08T04:34:16Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T06:45:28Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T06:48:22Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-08T06:49:09Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies pass 3 |
| 2026-09-08T12:41:40Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T12:41:44Z | skill | march | unknown | - | - |
| 2026-09-08T12:44:23Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords pass 3 end-to-end |
| 2026-09-08T20:29:45Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-08T20:33:08Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-09T01:03:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T01:07:06Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-09T04:34:43Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T04:38:31Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 4 end-to-end |
| 2026-09-09T06:46:15Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T08:36:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T08:40:37Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies content lifecycle pass |
| 2026-09-09T08:40:39Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-09T08:52:33Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-09T08:52:36Z | skill | digest | unknown | - | - |
| 2026-09-09T10:31:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T10:33:19Z | subagent | general-purpose | claude-sonnet-5 | - | Gather expand signal sources |
| 2026-09-09T12:41:38Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T12:42:43Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-09T14:32:01Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T14:34:01Z | subagent | general-purpose | claude-sonnet-5 | - | Score open CRITIQUE/AUDIT findings |
| 2026-09-09T16:33:18Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T16:36:30Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-09T20:30:13Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T20:33:59Z | subagent | card-expert | claude-sonnet-5 | - | Run full adjust-keywords lifecycle tick |
| 2026-09-09T22:28:08Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-09T22:28:55Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-10T01:02:35Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T01:06:27Z | subagent | card-expert | claude-sonnet-5 | - | Adjust-cards pass 5 audit and ship |
| 2026-09-10T02:38:11Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T02:40:49Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-10T06:45:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T06:48:36Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-10T08:38:25Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T08:39:03Z | skill | forge | claude-sonnet-5 | - | - |
| 2026-09-10T08:39:59Z | subagent | general-purpose | claude-sonnet-5 | - | Ship one forge content tick |
| 2026-09-10T10:31:15Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T14:30:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T14:31:35Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-10T14:32:37Z | subagent | Explore | claude-sonnet-5 | - | Score CRITIQUE.md pending findings |
| 2026-09-10T16:30:39Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T16:33:07Z | subagent | general-purpose | claude-sonnet-5 | - | Gather expand-pass signals for Axiomancer |
| 2026-09-10T18:33:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T18:37:02Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords tick end-to-end |
| 2026-09-10T20:28:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T20:32:49Z | subagent | content-curator | claude-sonnet-5 | - | Ship adjust-npcs pass 5 |
| 2026-09-10T22:27:02Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-10T22:28:36Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-11T01:01:53Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T01:04:09Z | subagent | Explore | claude-sonnet-5 | - | Fresh-read audit of CRITIQUE.md pending rows |
| 2026-09-11T02:38:42Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T02:42:39Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 6 end-to-end |
| 2026-09-11T04:34:48Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T06:45:00Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T06:45:03Z | skill | march | unknown | - | - |
| 2026-09-11T06:49:26Z | subagent | general-purpose | claude-sonnet-5 | - | Run /adjust-enemies pass 6 |
| 2026-09-11T06:49:29Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-11T08:37:43Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T08:37:45Z | skill | march | unknown | - | - |
| 2026-09-11T08:59:27Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-11T08:59:29Z | skill | digest | unknown | - | - |
| 2026-09-11T10:30:58Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T10:31:00Z | skill | march | unknown | - | - |
| 2026-09-11T10:31:40Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-11T10:32:24Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords lifecycle tick |
| 2026-09-11T14:32:03Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T14:36:01Z | subagent | content-curator | claude-sonnet-5 | - | Run adjust-npcs pass 6 |
| 2026-09-11T16:32:10Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T18:34:51Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T18:34:53Z | skill | march | unknown | - | - |
| 2026-09-11T18:35:59Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-11T20:30:31Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T20:30:32Z | skill | march | unknown | - | - |
| 2026-09-11T20:31:33Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-11T20:32:49Z | subagent | general-purpose | claude-sonnet-5 | - | Execute one /iterate tick end-to-end |
| 2026-09-11T22:28:30Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-11T22:33:00Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 7 end-to-end |
| 2026-09-12T02:37:53Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T02:37:54Z | skill | march | unknown | - | - |
| 2026-09-12T02:41:01Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-12T04:32:41Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T04:35:49Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-12T04:36:47Z | subagent | general-purpose | claude-sonnet-5 | - | Ship adjust-enemies pass 7 |
| 2026-09-12T04:36:50Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-12T06:41:28Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T06:42:42Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-12T08:33:36Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T08:36:12Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-12T10:27:52Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T10:30:54Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-12T14:28:50Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T14:29:21Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-12T16:29:33Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T16:30:39Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-12T18:31:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T18:31:09Z | skill | march | unknown | - | - |
| 2026-09-12T18:34:17Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-12T18:35:00Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 8 tick |
| 2026-09-12T20:10:46Z | skill | workflow-authoring | claude-fable-5-1 | - | - |
| 2026-09-12T20:30:51Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-12T20:30:53Z | skill | march | unknown | - | - |
| 2026-09-12T21:49:43Z | skill | workflow-authoring | claude-opus-5 | - | - |
| 2026-09-13T01:02:36Z | subagent | general-purpose | claude-fable-5-1 | - | Review PR #301 UI fixes diff |
| 2026-09-13T01:02:45Z | subagent | general-purpose | claude-fable-5-1 | - | Review PR #302 swarm diff |
| 2026-09-13T01:03:00Z | subagent | general-purpose | claude-fable-5-1 | - | Audit bot ticks and plan docs |
| 2026-09-13T07:36:29Z | slash-prompt | /fix-ci | unknown | - | /fix-ci 34745085584 |
| 2026-09-13T08:34:42Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T08:36:46Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies content lifecycle pass |
| 2026-09-13T08:36:48Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-13T09:01:30Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-13T09:01:33Z | skill | digest | unknown | - | - |
| 2026-09-13T12:37:11Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T12:38:45Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords pass 8 end-to-end |
| 2026-09-13T14:28:24Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T14:32:08Z | subagent | content-curator | claude-sonnet-5 | - | Run adjust-npcs pass 8 end-to-end |
| 2026-09-13T16:30:08Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T16:31:14Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-13T16:32:19Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 9 end-to-end |
| 2026-09-13T17:11:10Z | subagent | Explore | claude-opus-5 | - | Locate intro narrative screen |
| 2026-09-13T18:32:29Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T20:29:40Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T20:33:15Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-13T20:34:00Z | subagent | general-purpose | claude-sonnet-5 | - | Ship adjust-enemies pass 9 |
| 2026-09-13T20:57:01Z | slash-prompt | /fix-ci | unknown | - | /fix-ci 34781667060 |
| 2026-09-13T22:28:59Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-13T22:30:04Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-13T22:30:36Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords lifecycle pass 9 |
| 2026-09-14T01:09:39Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T01:14:06Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-14T01:17:27Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-14T02:42:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T02:45:13Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-14T04:37:42Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T04:40:43Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-14T08:42:49Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T08:42:53Z | skill | march | unknown | - | - |
| 2026-09-14T08:46:00Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-14T10:31:36Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T10:32:25Z | skill | expand | claude-sonnet-5 | - | - |
| 2026-09-14T10:32:49Z | subagent | general-purpose | claude-sonnet-5 | - | Gather expand-pass signals |
| 2026-09-14T12:43:05Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T12:43:38Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-14T12:49:11Z | subagent | card-expert | claude-sonnet-5 | - | Differentiate two shop consumable effects |
| 2026-09-14T14:33:53Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T14:34:54Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-14T16:32:00Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T18:35:10Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T18:35:56Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-14T18:37:53Z | subagent | general-purpose | claude-sonnet-5 | - | Run /iterate tick end-to-end |
| 2026-09-14T18:38:55Z | subagent | general-purpose | claude-sonnet-5 | - | Re-verify CRITIQUE.md Pending rows |
| 2026-09-14T18:39:13Z | subagent | general-purpose | claude-sonnet-5 | - | Sweep AUDIT.md non-CRITIQUE Pending rows |
| 2026-09-14T22:29:40Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-14T22:32:58Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-14T22:33:30Z | subagent | card-expert | claude-sonnet-5 | - | Adjust-keywords pass 10 audit and ship |
| 2026-09-15T00:07:23Z | slash-prompt | /oversight | unknown | - | /oversight |
| 2026-09-15T00:07:26Z | skill | oversight | unknown | - | - |
| 2026-09-15T00:08:16Z | subagent | general-purpose | claude-sonnet-5 | - | Summarize plan state files for oversight briefing |
| 2026-09-15T01:04:45Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T01:08:28Z | subagent | content-curator | claude-sonnet-5 | - | Run /adjust-npcs lifecycle tick |
| 2026-09-15T06:47:16Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T06:50:03Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-15T07:31:03Z | subagent | general-purpose | claude-sonnet-5 | - | Check top 30 phase candidates for staleness |
| 2026-09-15T08:39:30Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T08:43:01Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 11 tick |
| 2026-09-15T09:02:12Z | slash-prompt | /digest | unknown | - | /digest |
| 2026-09-15T09:02:14Z | skill | digest | unknown | - | - |
| 2026-09-15T10:32:06Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T10:32:53Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-15T12:41:27Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T12:41:56Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-15T14:31:54Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T14:32:38Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-15T14:33:47Z | subagent | Explore | claude-sonnet-5 | - | Inventory naming-cluster occurrences |
| 2026-09-15T16:32:42Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T16:33:14Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-15T18:33:32Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T20:29:37Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T20:30:06Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-15T22:29:22Z | slash-prompt | /march | unknown | - | /march |
| 2026-09-15T22:30:30Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-15T22:32:00Z | subagent | mechanics-expert | claude-sonnet-5 | - | Design 3 new signature skills for equipment progression |
| 2026-09-15T23:55:38Z | tick-end | - | claude-opus-5 | - | ok |
| 2026-09-16T00:03:50Z | tick-end | - | claude-opus-5 | - | ok |
| 2026-09-16T00:04:03Z | tick-end | - | claude-opus-5 | - | ok |
| 2026-09-16T00:05:53Z | tick-end | - | claude-opus-5 | - | ok |
| 2026-09-16T00:06:02Z | tick-end | - | claude-opus-5 | 9s | ok |
| 2026-09-16T00:06:26Z | tick-end | - | claude-opus-5 | - | ok |
| 2026-09-16T00:07:36Z | tick-end | - | claude-opus-5 | 1m10s | ok |
| 2026-09-16T00:57:19Z | tick-end | - | claude-opus-5 | 35s | ok |
| 2026-09-16T01:03:28Z | tick-end | - | claude-opus-5 | 21s | ok |
| 2026-09-16T01:05:37Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-16T01:05:37Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-16T04:35:21Z | slash-prompt | /march | - | - | /march |
| 2026-09-16T04:39:08Z | subagent | Explore | claude-sonnet-5 | - | Map encounter-table and world-gen code for Phase 87 |
| 2026-09-16T04:45:29Z | subagent-end | Explore | claude-sonnet-5 | 6m21s | ok |
| 2026-09-16T06:46:54Z | slash-prompt | /march | - | - | /march |
| 2026-09-16T06:47:54Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-16T06:47:54Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-16T08:39:23Z | slash-prompt | /march | - | - | /march |
| 2026-09-16T08:44:30Z | subagent | general-purpose | claude-sonnet-5 | - | KB enemy-archetype gap research |
| 2026-09-16T08:45:59Z | subagent-end | general-purpose | claude-sonnet-5 | 1m29s | ok |
| 2026-09-16T14:32:02Z | slash-prompt | /march | - | - | /march |
| 2026-09-16T14:35:41Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords pass 11 |
| 2026-09-16T22:28:43Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T02:38:47Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T02:42:24Z | subagent | card-expert | claude-sonnet-5 | - | adjust-cards content-lifecycle tick |
| 2026-09-17T04:35:16Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T06:47:30Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T06:52:22Z | subagent | Explore | claude-sonnet-5 | - | Verify current art-register state for combat UI |
| 2026-09-17T06:52:56Z | subagent-end | Explore | claude-sonnet-5 | 35s | ok |
| 2026-09-17T08:52:57Z | slash-prompt | /digest | - | - | /digest |
| 2026-09-17T08:53:00Z | skill | digest | - | - | - |
| 2026-09-17T08:53:00Z | skill-end | digest | - | 0s | ok |
| 2026-09-17T10:31:33Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T12:42:04Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T12:44:45Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-17T12:44:45Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-17T12:45:19Z | subagent | general-purpose | claude-sonnet-5 | - | Ship adjust-enemies pass 12 |
| 2026-09-17T12:45:21Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-17T12:45:22Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-17T14:32:54Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T14:33:56Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-17T14:33:56Z | skill-end | iterate | claude-sonnet-5 | 0s | ok |
| 2026-09-17T18:36:53Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T18:37:48Z | skill | iterate | claude-sonnet-5 | - | - |
| 2026-09-17T18:37:48Z | skill-end | iterate | claude-sonnet-5 | 0s | ok |
| 2026-09-17T18:40:46Z | slash-prompt | /oversight | - | - | /oversight |
| 2026-09-17T20:20:00Z | skill | world-spec | claude-opus-5 | - | args: The Capital (Phase 84) — what the advisor-selection payoff sets up for the player ch |
| 2026-09-17T20:20:00Z | skill-end | world-spec | claude-opus-5 | 0s | ok |
| 2026-09-17T20:31:24Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T22:28:18Z | slash-prompt | /march | - | - | /march |
| 2026-09-17T22:29:01Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-17T22:29:01Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-18T01:03:30Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T01:11:54Z | slash-prompt | /combat-playtest | claude-sonnet-5 | - | /combat-playtest |
| 2026-09-18T01:16:34Z | subagent | general-purpose | claude-sonnet-5 | - | Combat playtest — early stage qualitative pass |
| 2026-09-18T01:16:35Z | subagent-end | general-purpose | claude-sonnet-5 | 1s | ok |
| 2026-09-18T01:16:47Z | subagent | general-purpose | claude-sonnet-5 | - | Combat playtest — mid stage qualitative pass |
| 2026-09-18T01:16:48Z | subagent-end | general-purpose | claude-sonnet-5 | 1s | ok |
| 2026-09-18T01:16:59Z | subagent | general-purpose | claude-sonnet-5 | - | Combat playtest — late stage qualitative pass |
| 2026-09-18T01:17:00Z | subagent-end | general-purpose | claude-sonnet-5 | 1s | ok |
| 2026-09-18T01:17:14Z | subagent | general-purpose | claude-sonnet-5 | - | Combat playtest — impossible stage qualitative pass |
| 2026-09-18T01:17:15Z | subagent-end | general-purpose | claude-sonnet-5 | 1s | ok |
| 2026-09-18T01:17:25Z | tick-end | - | claude-sonnet-5 | 5m31s | ok |
| 2026-09-18T02:39:30Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T02:42:53Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-18T02:42:53Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-18T04:34:22Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T04:34:40Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-18T04:34:40Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-18T06:46:00Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T06:46:40Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-18T06:46:40Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-18T07:11:33Z | slash-prompt | /fix-ci | - | - | /fix-ci 35317577069 |
| 2026-09-18T08:37:46Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T08:38:05Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-18T08:38:05Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-18T10:31:02Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T16:30:37Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T16:34:54Z | subagent | card-expert | claude-sonnet-5 | - | Run full adjust-keywords steward pass |
| 2026-09-18T17:06:09Z | subagent-end | card-expert | claude-sonnet-5 | 31m15s | ok |
| 2026-09-18T20:30:03Z | slash-prompt | /march | - | - | /march |
| 2026-09-18T20:36:24Z | subagent | content-curator | claude-sonnet-5 | - | Execute adjust-npcs steward tick |
| 2026-09-18T22:28:38Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T04:33:08Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T04:37:08Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards steward tick |
| 2026-09-19T06:42:11Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T06:43:11Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-19T06:43:11Z | skill-end | adjust-equipment | claude-sonnet-5 | 0s | ok |
| 2026-09-19T06:45:40Z | subagent | general-purpose | claude-sonnet-5 | - | KB search on consumable economy prior art |
| 2026-09-19T06:46:41Z | subagent-end | general-purpose | claude-sonnet-5 | 1m00s | ok |
| 2026-09-19T08:34:15Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T08:37:08Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-19T08:37:08Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-19T08:39:23Z | subagent | general-purpose | claude-sonnet-5 | - | KB search for enemy design prior art angle |
| 2026-09-19T08:39:48Z | subagent-end | general-purpose | claude-sonnet-5 | 25s | ok |
| 2026-09-19T08:52:03Z | slash-prompt | /digest | - | - | /digest |
| 2026-09-19T08:52:04Z | skill | digest | - | - | - |
| 2026-09-19T08:52:04Z | skill-end | digest | claude-sonnet-5 | 0s | ok |
| 2026-09-19T10:28:25Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T10:28:27Z | skill | march | - | - | - |
| 2026-09-19T10:28:27Z | skill-end | march | - | 0s | ok |
| 2026-09-19T10:29:08Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-19T10:29:09Z | skill-end | adjust-keywords | claude-sonnet-5 | 0s | ok |
| 2026-09-19T10:30:12Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords pass 13 |
| 2026-09-19T12:37:26Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T12:37:28Z | skill | march | - | - | - |
| 2026-09-19T12:37:28Z | skill-end | march | - | 0s | ok |
| 2026-09-19T12:38:34Z | skill | expand | claude-sonnet-5 | - | - |
| 2026-09-19T12:38:34Z | skill-end | expand | claude-sonnet-5 | 0s | ok |
| 2026-09-19T12:42:35Z | subagent | general-purpose | claude-sonnet-5 | - | KB reception check for expand signal I |
| 2026-09-19T12:43:27Z | subagent-end | general-purpose | claude-sonnet-5 | 51s | ok |
| 2026-09-19T14:28:10Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T15:44:09Z | skill | workflow-authoring | claude-fable-5-1 | - | - |
| 2026-09-19T15:44:09Z | skill-end | workflow-authoring | claude-fable-5-1 | 0s | ok |
| 2026-09-19T15:45:36Z | tick-end | - | claude-fable-5-1 | 1m31s | ok |
| 2026-09-19T16:29:37Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T16:29:52Z | skill | triage | claude-sonnet-5 | - | - |
| 2026-09-19T16:29:52Z | skill-end | triage | claude-sonnet-5 | 0s | ok |
| 2026-09-19T20:29:17Z | slash-prompt | /march | - | - | /march |
| 2026-09-19T20:29:19Z | skill | march | - | - | - |
| 2026-09-19T20:29:19Z | skill-end | march | - | 0s | ok |
| 2026-09-19T20:29:52Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-19T20:29:52Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-19T22:27:36Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T02:38:21Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T02:38:54Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-20T02:38:54Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-20T08:35:17Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T08:37:12Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards pass 14 end-to-end |
| 2026-09-20T10:28:53Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T10:29:42Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-20T10:29:42Z | skill-end | adjust-equipment | claude-sonnet-5 | 0s | ok |
| 2026-09-20T12:37:50Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T18:32:32Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T18:33:10Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-20T18:33:10Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-20T20:29:17Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T20:32:38Z | subagent | card-expert | claude-sonnet-5 | - | Adjust-keywords pass 14 audit + ship |
| 2026-09-20T20:39:40Z | subagent-end | card-expert | claude-sonnet-5 | 7m02s | ok |
| 2026-09-20T22:27:59Z | slash-prompt | /march | - | - | /march |
| 2026-09-20T22:28:22Z | skill | ship-a-phase | claude-sonnet-5 | - | - |
| 2026-09-20T22:28:22Z | skill-end | ship-a-phase | claude-sonnet-5 | 0s | ok |
| 2026-09-21T01:08:59Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T01:09:33Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-21T01:09:33Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-21T02:42:45Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T02:45:54Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-21T02:45:54Z | skill-end | adjust-npcs | claude-sonnet-5 | 0s | ok |
| 2026-09-21T02:48:13Z | subagent | general-purpose | claude-sonnet-5 | - | KB widened check for NPC/dialogue prior art |
| 2026-09-21T02:49:08Z | subagent-end | general-purpose | claude-sonnet-5 | 56s | ok |
| 2026-09-21T04:38:33Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T04:41:12Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-21T04:41:12Z | skill-end | adjust-cards | claude-sonnet-5 | 0s | ok |
| 2026-09-21T04:41:59Z | subagent | card-expert | claude-sonnet-5 | - | Full adjust-cards audit and ship |
| 2026-09-21T04:45:59Z | subagent-end | card-expert | claude-sonnet-5 | 4m00s | ok |
| 2026-09-21T06:58:14Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T06:59:00Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-21T06:59:00Z | skill-end | adjust-equipment | claude-sonnet-5 | 0s | ok |
| 2026-09-21T08:42:00Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T08:42:02Z | skill | march | - | - | - |
| 2026-09-21T08:42:02Z | skill-end | march | - | 0s | ok |
| 2026-09-21T08:42:49Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-21T08:42:49Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-21T08:43:33Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies pass 15 |
| 2026-09-21T08:43:35Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-21T08:43:35Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-21T10:32:27Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T10:32:53Z | skill | critique | claude-sonnet-5 | - | - |
| 2026-09-21T10:32:54Z | skill-end | critique | claude-sonnet-5 | 0s | ok |
| 2026-09-21T12:40:03Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T12:42:48Z | skill | adjust-keywords | claude-sonnet-5 | - | - |
| 2026-09-21T12:42:48Z | skill-end | adjust-keywords | claude-sonnet-5 | 0s | ok |
| 2026-09-21T12:43:20Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-keywords lifecycle tick |
| 2026-09-21T15:00:43Z | subagent | Explore | claude-opus-5 | - | Recon mobile UI + map code |
| 2026-09-21T15:02:44Z | subagent-end | Explore | claude-opus-5 | 2m01s | ok |
| 2026-09-21T15:18:21Z | subagent | Explore | claude-opus-5 | - | Recon item grant + equip paths |
| 2026-09-21T15:18:22Z | subagent-end | Explore | claude-opus-5 | 1s | ok |
| 2026-09-21T16:10:05Z | skill | workflow-authoring | claude-opus-5 | - | - |
| 2026-09-21T16:10:05Z | skill-end | workflow-authoring | claude-opus-5 | 0s | ok |
| 2026-09-21T16:12:15Z | tick-end | - | claude-opus-5 | 2m22s | ok |
| 2026-09-21T18:36:22Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T18:39:11Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-21T18:39:11Z | skill-end | adjust-npcs | claude-sonnet-5 | 0s | ok |
| 2026-09-21T22:30:16Z | slash-prompt | /march | - | - | /march |
| 2026-09-21T22:33:00Z | skill | adjust-cards | claude-sonnet-5 | - | - |
| 2026-09-21T22:33:00Z | skill-end | adjust-cards | claude-sonnet-5 | 0s | ok |
| 2026-09-22T01:03:29Z | slash-prompt | /march | - | - | /march |
| 2026-09-22T01:06:18Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-22T01:06:18Z | skill-end | adjust-equipment | claude-sonnet-5 | 0s | ok |
| 2026-09-22T14:33:07Z | slash-prompt | /march | - | - | /march |
| 2026-09-22T19:31:50Z | skill | digest | claude-opus-5-5 | - | args: Cover PR #353 (UI/map overhaul: first-node Suppliant's Ring, gathering card, card te |
| 2026-09-22T19:31:50Z | skill-end | digest | claude-opus-5-5 | 0s | ok |
| 2026-09-22T20:30:12Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T01:03:01Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T01:04:08Z | skill | adjust-enemies | claude-sonnet-5 | - | - |
| 2026-09-23T01:04:08Z | skill-end | adjust-enemies | claude-sonnet-5 | 0s | ok |
| 2026-09-23T01:05:50Z | subagent | general-purpose | claude-sonnet-5 | - | Run adjust-enemies lifecycle tick |
| 2026-09-23T02:39:12Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T04:35:34Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T04:38:35Z | skill | adjust-npcs | claude-sonnet-5 | - | - |
| 2026-09-23T04:38:35Z | skill-end | adjust-npcs | claude-sonnet-5 | 0s | ok |
| 2026-09-23T06:47:35Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T06:51:36Z | subagent | card-expert | claude-sonnet-5 | - | Run adjust-cards steward tick |
| 2026-09-23T08:38:58Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T08:42:11Z | skill | adjust-equipment | claude-sonnet-5 | - | - |
| 2026-09-23T08:42:11Z | skill-end | adjust-equipment | claude-sonnet-5 | 0s | ok |
| 2026-09-23T08:54:02Z | slash-prompt | /digest | - | - | /digest |
| 2026-09-23T08:54:04Z | skill | digest | - | - | - |
| 2026-09-23T08:54:04Z | skill-end | digest | - | 0s | ok |
| 2026-09-23T10:31:59Z | slash-prompt | /march | - | - | /march |
| 2026-09-23T14:24:33Z | skill | consolidate | claude-opus-5-5 | - | - |
| 2026-09-23T14:24:33Z | skill-end | consolidate | claude-opus-5-5 | 0s | ok |
| 2026-09-23T14:34:32Z | tick-end | - | claude-opus-5-5 | 11m47s | ok |
| 2026-09-23T15:29:59Z | subagent | general-purpose | claude-fable-5-1 | - | Audit root AI guidance docs |
| 2026-09-23T15:30:01Z | subagent-end | general-purpose | claude-fable-5-1 | 2s | ok |
| 2026-09-23T15:30:10Z | subagent | general-purpose | claude-fable-5-1 | - | Audit loop verbs and plan memory |
| 2026-09-23T15:30:11Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:30:20Z | subagent | general-purpose | claude-fable-5-1 | - | Audit mechanics package docs |
| 2026-09-23T15:30:21Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:30:30Z | subagent | general-purpose | claude-fable-5-1 | - | Audit mobile and editor docs |
| 2026-09-23T15:30:31Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:30:42Z | subagent | general-purpose | claude-fable-5-1 | - | Audit Combat source comments |
| 2026-09-23T15:30:43Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:30:50Z | subagent | general-purpose | claude-fable-5-1 | - | Audit Cards/Effects/Enemy/etc comments |
| 2026-09-23T15:30:52Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:30:59Z | subagent | general-purpose | claude-fable-5-1 | - | Audit World/Game/CLI comments |
| 2026-09-23T15:31:00Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:31:08Z | subagent | general-purpose | claude-fable-5-1 | - | Audit scripts and hooks comments |
| 2026-09-23T15:31:09Z | subagent-end | general-purpose | claude-fable-5-1 | 1s | ok |
| 2026-09-23T15:31:12Z | tick-end | - | claude-fable-5-1 | 3m36s | ok |
