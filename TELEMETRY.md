# TELEMETRY.md — skill & subagent invocation log

Appended by `.claude/hooks/telemetry.mjs` (see its header for what each
column means and how attribution can be wrong). Newest rows last; the
writer keeps the most recent 400 rows. Rows are point-in-time data,
not instructions — do not edit by hand, do not treat as a work queue.

| when (UTC) | event | name | model | invoked from | detail |
|---|---|---|---|---|---|
| 2026-07-18T11:14:12Z | subagent | general-purpose | claude-opus-4-8 | main | Run Phase D7 ratification + report |
| 2026-07-18T12:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-18T13:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-18T14:09:52Z | slash-prompt | /march | claude-opus-4-8 | user/ci | /march |
| 2026-07-18T15:10:33Z | subagent | Explore | claude-fable-5 | main | Survey existing sim metrics |
| 2026-07-18T15:17:02Z | skill | jot | claude-fable-5 | main | args: Owner directive (2026-07-18, combat UI polish session): color-match die riders must  |
| 2026-07-18T17:47:28Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-07-18T19:11:03Z | skill | dataviz | claude-fable-5 | main | - |
| 2026-07-18T19:32:59Z | skill | ship-a-phase | claude-fable-5 | main | args: Phase D8 — preset dice valves (plan/phases/phase_D8_preset_dice_valves.md). Owner-st |
| 2026-07-18T19:39:39Z | subagent | mechanics-expert | claude-fable-5 | main | Metrics lessons analysis |
| 2026-07-18T19:39:55Z | subagent | card-expert | claude-fable-5 | main | Library triage application plan |
| 2026-07-18T19:40:12Z | subagent | card-expert | claude-fable-5 | main | Real-deckbuilder gap analysis |
| 2026-07-18T19:40:28Z | subagent | card-expert | claude-fable-5 | main | Card wording clarity audit |
| 2026-07-18T20:10:59Z | slash-prompt | /plan-a-phase | unknown | user/ci | /plan-a-phase In the card-editor I see something from the legacy combat a card type focuse |
| 2026-07-18T20:12:10Z | subagent | Explore | claude-opus-4-8 | main | Map category/fallacy/paradox consumers |
| 2026-07-19T03:24:46Z | slash-prompt | /deck-tuning | unknown | user/ci | /deck-tuning |
| 2026-07-19T03:28:30Z | subagent | card-expert | claude-fable-5 | main | Run deck-tuning swap-pool measurement pass |
| 2026-07-19T06:12:19Z | slash-prompt | /triage | unknown | user/ci | /triage 132 |
| 2026-07-19T06:12:21Z | skill | triage | unknown | main | args: 132 |
| 2026-07-19T06:16:46Z | slash-prompt | /triage | unknown | user/ci | /triage 132 |
| 2026-07-19T06:24:25Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-19T06:24:27Z | skill | digest | unknown | main | - |
| 2026-07-19T06:27:05Z | slash-prompt | /deck-tuning | unknown | user/ci | /deck-tuning --preset=erosion --runs=100 --cross-theme-swaps=false |
| 2026-07-19T06:27:07Z | skill | deck-tuning | unknown | main | args: --preset=erosion --runs=100 --cross-theme-swaps=false |
| 2026-07-19T10:15:29Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-19T10:15:32Z | skill | digest | unknown | main | - |
| 2026-07-19T13:57:32Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-19T17:06:53Z | subagent | Explore | unknown | main | Survey Axiomancer art surface |
| 2026-07-19T17:07:03Z | subagent | scout | claude-fable-5 | main | Research AI art pipeline options |
| 2026-07-19T19:36:03Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-19T05:28:08Z | skill | artifact-design | claude-fable-5 | main | - |
| 2026-07-20T00:55:03Z | subagent | card-expert | claude-fable-5 | main | Promote 8 swap-pool cards into presets |
| 2026-07-20T03:29:54Z | skill | schedule | claude-fable-5 | main | args: list my scheduled routines |
| 2026-07-20T03:46:56Z | subagent | Explore | claude-fable-5 | main | Map monorepo + existing logging |
| 2026-07-20T03:47:02Z | subagent | Explore | claude-fable-5 | main | Explore mobile app logging surface |
| 2026-07-20T03:47:09Z | subagent | Explore | claude-fable-5 | main | Explore agent tooling + conventions |
| 2026-07-20T03:52:25Z | subagent | Plan | claude-fable-5 | main | Design repo-wide logging plan |
| 2026-07-20T09:41:15Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-20T11:29:52Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-20T11:29:55Z | skill | digest | unknown | main | - |
| 2026-07-20T13:42:12Z | subagent | Explore | unknown | main | Survey cross-cutting layers |
| 2026-07-20T14:03:26Z | slash-prompt | /jot | unknown | user/ci | /jot The dice, after they're used don't have a visual indicator that they're used. I would |
| 2026-07-20T14:19:09Z | slash-prompt | /oversight | claude-opus-4-8 | user/ci | /oversight |
| 2026-07-20T14:37:58Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-20T20:03:29Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-20T20:05:03Z | subagent | Explore | claude-sonnet-5 | main | Survey juice/animation call sites and precedents |
| 2026-07-21T03:54:07Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-21T03:55:12Z | subagent | Explore | claude-sonnet-5 | main | Research GLYPHS pilot phase 33d design context |
| 2026-07-21T04:04:40Z | subagent | card-expert | claude-sonnet-5 | main | Implement GLYPHS pilot phase 33d |
| 2026-07-21T09:08:25Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-21T09:09:22Z | skill | expand | claude-sonnet-5 | main | - |
| 2026-07-21T10:51:11Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-21T10:51:13Z | skill | digest | unknown | main | - |
| 2026-07-22T03:55:19Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-22T03:55:21Z | skill | march | unknown | main | - |
| 2026-07-22T03:56:12Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-07-22T09:06:43Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-22T09:08:55Z | subagent | Explore | claude-sonnet-5 | main | Investigate top CRITIQUE.md candidates |
| 2026-07-22T10:53:22Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-22T14:31:59Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-23T03:52:53Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-23T09:05:51Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-23T10:53:21Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-23T10:53:23Z | skill | digest | unknown | main | - |
| 2026-07-23T14:39:42Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-23T14:39:44Z | skill | march | unknown | main | - |
| 2026-07-23T14:42:38Z | subagent | Explore | claude-sonnet-5 | main | Locate reward-pool spell definitions |
| 2026-07-23T14:45:05Z | subagent | Explore | claude-sonnet-5 | main | Investigate blacksmith MapEvent node gating |
| 2026-07-23T19:54:22Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-23T19:56:35Z | subagent | general-purpose | claude-sonnet-5 | main | Score pending audit/critique findings |
| 2026-07-23T20:20:29Z | subagent | Explore | claude-opus-4-8 | main | Map Upgradeable Dice flag architecture |
| 2026-07-29T14:38:49Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-29T16:41:20Z | slash-prompt | /triage | unknown | user/ci | /triage 153 |
| 2026-07-29T19:51:31Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-29T20:03:03Z | subagent | Explore | claude-sonnet-5 | main | Locate draft-scorer starvation code |
| 2026-07-30T09:11:09Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-30T10:52:41Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-30T10:52:43Z | skill | digest | unknown | main | - |
| 2026-07-30T20:00:00Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-30T20:00:47Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-07-31T03:59:16Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-31T04:03:56Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-07-31T09:23:13Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-31T11:13:32Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-07-31T11:13:34Z | skill | digest | unknown | main | - |
| 2026-07-31T14:45:40Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-31T14:45:42Z | skill | march | unknown | main | - |
| 2026-07-31T20:00:57Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-07-31T20:00:59Z | skill | march | unknown | main | - |
| 2026-08-01T03:59:21Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-01T03:59:23Z | skill | march | unknown | main | - |
| 2026-08-01T04:00:07Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-01T08:38:36Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-01T10:23:04Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-01T19:41:30Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-01T19:43:42Z | subagent | Explore | claude-sonnet-5 | main | Investigate VITAE preview mismatch bug |
| 2026-08-02T04:02:50Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-02T04:07:51Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-02T04:11:49Z | subagent | card-expert | claude-sonnet-5 | main | Fix draft scorer starving new/sandbox cards |
| 2026-08-02T08:42:41Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-02T08:42:43Z | skill | march | unknown | main | - |
| 2026-08-02T08:43:55Z | skill | expand | claude-sonnet-5 | main | - |
| 2026-08-02T09:26:08Z | slash-prompt | /consolidate | unknown | user/ci | /consolidate |
| 2026-08-02T10:21:44Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-02T10:21:46Z | skill | digest | unknown | main | - |
| 2026-08-02T14:06:15Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-02T14:07:10Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-03T10:11:56Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-03T12:03:06Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-03T12:03:09Z | skill | digest | unknown | main | - |
| 2026-08-03T15:23:57Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-03T15:25:16Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-03T20:07:50Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-03T20:10:58Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-04T09:19:10Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-04T09:24:19Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-04T11:11:07Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-04T11:11:09Z | skill | digest | unknown | main | - |
| 2026-08-04T14:58:13Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-04T14:58:16Z | skill | march | unknown | main | - |
| 2026-08-04T20:07:16Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-04T20:08:12Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-04T20:09:02Z | subagent | general-purpose | claude-sonnet-5 | main | Check DoT card face text against critique claim |
| 2026-08-05T03:42:26Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-05T03:45:23Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-05T09:16:52Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-05T11:18:07Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-05T11:18:10Z | skill | digest | unknown | main | - |
| 2026-08-05T20:03:16Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-06T03:48:22Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-06T09:19:49Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-06T09:20:58Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-06T09:23:19Z | subagent | Explore | claude-sonnet-5 | main | Scope combat kill-path legibility fix |
| 2026-08-06T11:18:59Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-06T11:19:03Z | skill | digest | unknown | main | - |
| 2026-08-06T14:43:28Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T00:22:05Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T00:23:04Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-07T03:27:10Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T03:30:10Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-07T07:50:40Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T07:51:30Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-07T07:56:32Z | subagent | card-expert | claude-sonnet-5 | main | Fix fake color-match die-bonus condition |
| 2026-08-07T09:43:57Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-07T09:44:00Z | skill | digest | unknown | main | - |
| 2026-08-07T13:46:13Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T13:46:51Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-07T19:27:07Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-07T19:27:42Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-08-08T00:38:47Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-08T02:27:40Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-08T02:27:43Z | skill | march | unknown | main | - |
| 2026-08-08T02:30:45Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-08T07:27:43Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-08T07:37:19Z | subagent | card-expert | claude-sonnet-5 | main | Implement Phase 39 curve repair + library symmetry |
| 2026-08-08T09:22:59Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-08T09:23:01Z | skill | digest | unknown | main | - |
| 2026-08-08T11:37:10Z | subagent | Explore | claude-fable-5 | main | Inventory inline SVG usage |
| 2026-08-08T11:37:15Z | subagent | Explore | claude-fable-5 | main | Distill design handoff intent |
| 2026-08-08T13:25:19Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-08T14:43:46Z | subagent | scout | claude-opus-5 | main | Scout MTG/PvE card research |
| 2026-08-08T14:49:24Z | subagent | Explore | claude-fable-5 | main | Map mobile/editor card coupling |
| 2026-08-08T19:07:21Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-08T19:09:56Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-08T21:35:47Z | subagent | general-purpose | claude-opus-5 | main | Phase 42 dark fantasy bible |
| 2026-08-08T21:36:21Z | subagent | general-purpose | claude-opus-5 | main | Phase 43 objective function v2 |
| 2026-08-08T21:36:46Z | subagent | general-purpose | claude-opus-5 | main | Phase 52a deck removal primitive |
| 2026-08-08T21:37:13Z | subagent | general-purpose | claude-opus-5 | main | Phase 52b first-class inn |
| 2026-08-08T21:37:40Z | subagent | general-purpose | claude-opus-5 | main | Phase 48 Closes-N root cause |
| 2026-08-09T02:34:43Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-09T07:29:50Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-09T07:29:52Z | skill | march | unknown | main | - |
| 2026-08-09T07:31:16Z | subagent | Explore | claude-sonnet-5 | main | Map keyword registry rename targets |
| 2026-08-09T07:40:57Z | subagent | card-expert | claude-sonnet-5 | main | Implement phase 44b keyword retheme |
| 2026-08-09T09:24:30Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-09T09:24:32Z | skill | digest | unknown | main | - |
| 2026-08-09T13:29:25Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-09T13:30:04Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-09T19:10:25Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-09T19:10:57Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-09T19:16:58Z | subagent | card-expert | claude-sonnet-5 | main | Implement phase 44c card library retheme |
| 2026-08-09T21:40:53Z | skill | story-spec | claude-opus-5 | main | args: Author S-02 for the fishing village's reachable voice: which coastal NPCs get map ho |
| 2026-08-10T02:40:23Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-10T08:12:47Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-10T08:13:23Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-10T10:03:28Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-10T10:03:30Z | skill | digest | unknown | main | - |
| 2026-08-10T13:52:03Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-10T13:52:56Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-10T15:55:43Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-10T15:55:46Z | skill | oversight | claude-sonnet-5 | main | - |
| 2026-08-10T19:28:22Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-11T02:34:01Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-11T07:45:22Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-11T09:44:52Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-11T09:44:55Z | skill | digest | unknown | main | - |
| 2026-08-11T19:33:09Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-12T07:59:05Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-12T08:01:41Z | subagent | Explore | claude-sonnet-5 | main | Map mobile morality/alignment surfaces |
| 2026-08-12T09:48:19Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-12T09:48:21Z | skill | digest | unknown | main | - |
| 2026-08-12T13:55:16Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-12T13:56:56Z | subagent | Explore | claude-sonnet-5 | main | Survey mobile shell copy and docs for phase 44i retheme |
| 2026-08-12T21:41:32Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-12T21:41:34Z | skill | oversight | claude-sonnet-5 | main | - |
| 2026-08-13T03:06:35Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-13T03:37:17Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 1 (7 findings) |
| 2026-08-13T03:37:26Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 2 (7 findings) |
| 2026-08-13T03:37:34Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 3 (7 findings) |
| 2026-08-13T03:37:42Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 4 (7 findings) |
| 2026-08-13T03:37:48Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 5 (7 findings) |
| 2026-08-13T03:37:55Z | subagent | Explore | claude-sonnet-5 | main | Verify AUDIT.md batch 6 (7 findings) |
| 2026-08-13T08:00:53Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-13T09:49:14Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-13T09:49:16Z | skill | digest | unknown | main | - |
| 2026-08-13T13:55:20Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-14T03:05:16Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-14T07:57:32Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-14T09:45:13Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-14T09:45:15Z | skill | digest | unknown | main | - |
| 2026-08-14T19:26:12Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-14T19:36:07Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-15T01:55:37Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-15T01:56:59Z | subagent | general-purpose | claude-sonnet-5 | main | Execute /expand pass end-to-end |
| 2026-08-15T01:57:01Z | skill | expand | claude-sonnet-5 | main | - |
| 2026-08-15T09:04:01Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-15T09:04:04Z | skill | digest | unknown | main | - |
| 2026-08-15T13:05:49Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-15T13:05:51Z | skill | march | unknown | main | - |
| 2026-08-15T15:49:38Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-15T18:53:46Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-15T18:53:48Z | skill | march | unknown | main | - |
| 2026-08-16T07:07:37Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-16T07:08:13Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-16T13:01:01Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-16T13:01:25Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-16T18:53:31Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-17T02:00:27Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-17T09:25:14Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-17T09:25:16Z | skill | digest | unknown | main | - |
| 2026-08-17T13:14:03Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-17T13:14:05Z | skill | march | unknown | main | - |
| 2026-08-17T13:14:34Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-17T19:06:19Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-18T01:57:26Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-18T01:57:28Z | skill | march | unknown | main | - |
| 2026-08-18T13:16:44Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-18T19:05:54Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-18T19:12:34Z | subagent | general-purpose | claude-sonnet-5 | main | Ship Phase 46a — early-game rethink design session |
| 2026-08-19T02:01:07Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-19T02:01:09Z | skill | march | unknown | main | - |
| 2026-08-19T09:19:04Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-19T09:19:06Z | skill | digest | unknown | main | - |
| 2026-08-19T13:23:55Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-19T13:23:58Z | skill | march | unknown | main | - |
| 2026-08-19T13:24:46Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-20T01:57:38Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-20T02:00:57Z | subagent | Explore | claude-sonnet-5 | main | Investigate Phase 46c quest discovery gap |
| 2026-08-20T07:15:10Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-20T13:25:22Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-20T14:18:48Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-20T14:18:52Z | skill | oversight | claude-sonnet-5 | main | - |
| 2026-08-20T16:39:14Z | subagent | scout | claude-fable-5 | main | Research Mörk Borg design signature |
| 2026-08-20T20:05:33Z | subagent | scout | claude-fable-5 | main | Research Mörk Borg design signature |
| 2026-08-21T02:05:08Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-21T07:16:00Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-21T09:20:31Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-21T09:20:33Z | skill | digest | unknown | main | - |
| 2026-08-21T13:24:38Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-21T19:05:14Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-21T19:07:47Z | subagent | Explore | claude-sonnet-5 | main | Survey mobile combat screen real estate |
| 2026-08-22T07:07:45Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-22T07:07:47Z | skill | march | unknown | main | - |
| 2026-08-22T07:10:23Z | skill | critique | claude-sonnet-5 | main | - |
| 2026-08-22T13:07:47Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-22T13:10:13Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-22T19:15:20Z | subagent | Explore | claude-fable-5 | main | Audit card content pipeline |
| 2026-08-22T19:15:27Z | subagent | Explore | claude-fable-5 | main | Audit keywords/effects pipeline |
| 2026-08-22T19:15:36Z | subagent | Explore | claude-fable-5 | main | Audit narrative content pipeline |
| 2026-08-22T19:15:42Z | subagent | Explore | claude-fable-5 | main | Audit art/asset pipeline |
| 2026-08-22T19:15:51Z | subagent | Explore | claude-fable-5 | main | Audit enemies/world/encounters pipeline |
| 2026-08-22T19:16:02Z | subagent | Explore | claude-fable-5 | main | Audit loop permissions/enforcement |
| 2026-08-23T02:08:05Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-23T02:09:37Z | subagent | Explore | claude-sonnet-5 | main | Research context for Phase 51 GLYPHS sim policy |
| 2026-08-23T07:09:35Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-23T07:11:01Z | subagent | card-expert | claude-sonnet-5 | main | Ship Phase 51 — crackAt policy + GLYPHS evidence |
| 2026-08-23T09:04:56Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-23T13:08:46Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-23T18:54:59Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-23T18:57:29Z | subagent | card-expert | claude-sonnet-5 | main | Ship Phase 40 card-text grammar pass |
| 2026-08-24T02:04:36Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-24T02:07:50Z | subagent | Explore | claude-sonnet-5 | main | Research endCombat routing for phase 54 |
| 2026-08-24T02:12:21Z | subagent | Explore | claude-sonnet-5 | main | Check Enemy/Encounter type compatibility for phase 54 |
| 2026-08-24T07:35:04Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-24T07:35:46Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-24T13:29:08Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-24T13:29:44Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-24T19:09:06Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-24T19:09:44Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-25T01:58:44Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-25T02:01:37Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-25T07:18:05Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-25T07:19:15Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-25T07:19:54Z | subagent | Explore | claude-sonnet-5 | main | Research map content placement for Phase 60 brief |
| 2026-08-25T09:21:03Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-25T09:21:05Z | skill | digest | unknown | main | - |
| 2026-08-25T13:27:21Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-25T13:27:24Z | skill | march | unknown | main | - |
| 2026-08-25T19:07:38Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-25T19:09:02Z | subagent | Explore | claude-sonnet-5 | main | Map Gathering minigame footprint |
| 2026-08-25T19:14:48Z | subagent | Explore | claude-sonnet-5 | main | Find inline no-screen-detour precedent for item grants |
| 2026-08-26T02:07:37Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-26T02:10:55Z | subagent | card-expert | claude-sonnet-5 | main | Design and ship Phase 62 — Ally cards |
| 2026-08-26T13:32:17Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-26T13:35:12Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-26T13:35:46Z | subagent | Explore | claude-sonnet-5 | main | Explore Reliquary and rest precedent for phase 63 brief |
| 2026-08-26T20:20:03Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-27T10:03:46Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-27T14:32:27Z | slash-prompt | /loop | unknown | user/ci | /loop 1h /march |
| 2026-08-27T14:32:46Z | skill | march | claude-opus-5 | main | - |
| 2026-08-27T15:32:09Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T16:32:09Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T17:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T18:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T18:50:37Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-08-27T18:56:01Z | skill | expand | claude-sonnet-5 | main | - |
| 2026-08-27T19:17:15Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-27T19:17:17Z | skill | digest | unknown | main | - |
| 2026-08-27T19:32:09Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T20:32:09Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T21:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T22:28:06Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-27T22:30:52Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-27T22:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-27T23:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-28T00:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-28T01:32:08Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-28T02:32:09Z | slash-prompt | /march | claude-opus-5 | user/ci | /march |
| 2026-08-28T06:00:00Z | subagent | Explore | claude-fable-5 | main | Inventory all owner-gate restrictions |
| 2026-08-28T06:00:12Z | subagent | Explore | claude-fable-5 | main | Map world/continents architecture |
| 2026-08-28T06:00:21Z | subagent | Explore | claude-fable-5 | main | Survey mobile UI screens + issues |
| 2026-08-28T06:01:16Z | subagent | Explore | claude-fable-5 | main | Audit decision-gate documentation |
| 2026-08-28T06:06:23Z | subagent | general-purpose | claude-fable-5 | main | Fix traced UI defects mobile |
| 2026-08-28T06:13:04Z | subagent | general-purpose | claude-fable-5 | main | Build travel system + caverns map |
| 2026-08-28T22:40:00Z | subagent | general-purpose | claude-fable-5 | main | Build Northern City + new enemies |
| 2026-08-29T01:47:47Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-29T14:01:48Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-29T14:01:51Z | skill | digest | unknown | main | - |
| 2026-08-30T05:30:56Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-30T05:30:57Z | skill | march | unknown | main | - |
| 2026-08-30T05:33:10Z | subagent | Explore | claude-sonnet-5 | main | Map glyph/icon systems for Phase V6 |
| 2026-08-30T12:00:21Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-30T12:01:03Z | skill | ship-a-phase | claude-sonnet-5 | main | - |
| 2026-08-31T05:44:27Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-31T14:01:06Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-31T14:03:35Z | subagent | Explore | claude-sonnet-5 | main | Map Northern-Continent phase W1-W3 conventions |
| 2026-08-31T16:24:40Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-08-31T16:24:42Z | skill | digest | unknown | main | - |
| 2026-08-31T22:55:18Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-08-31T22:58:08Z | subagent | general-purpose | claude-sonnet-5 | main | Lift superseded OPEN GATE wall text |
| 2026-09-01T05:17:37Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-01T05:17:40Z | skill | march | unknown | main | - |
| 2026-09-01T05:20:42Z | skill | expand | claude-sonnet-5 | main | - |
| 2026-09-01T13:43:54Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-09-01T13:43:57Z | skill | digest | unknown | main | - |
| 2026-09-01T21:07:37Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-01T21:08:26Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-09-02T00:20:03Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-02T00:20:05Z | skill | march | unknown | main | - |
| 2026-09-02T00:23:03Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-09-02T04:22:03Z | slash-prompt | /oversight | unknown | user/ci | /oversight |
| 2026-09-02T04:44:28Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-02T04:44:30Z | skill | march | unknown | main | - |
| 2026-09-02T04:45:36Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-09-02T04:46:38Z | subagent | Explore | claude-sonnet-5 | main | Investigate top iterate candidates' fix feasibility |
| 2026-09-02T12:09:57Z | slash-prompt | /consolidate | unknown | user/ci | /consolidate |
| 2026-09-02T12:09:59Z | skill | consolidate | unknown | main | - |
| 2026-09-02T16:41:14Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-03T00:22:02Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-03T00:22:03Z | skill | march | unknown | main | - |
| 2026-09-03T00:25:04Z | subagent | Explore | claude-sonnet-5 | main | Find W5 enemy roster and current portrait assets |
| 2026-09-03T00:27:01Z | subagent | scout | claude-sonnet-5 | main | Source CC art candidates: Seam Tick, Prop-Wight, Unpaid Delver |
| 2026-09-03T00:27:06Z | subagent | scout | claude-sonnet-5 | main | Source CC art candidates: Sump Maren, Toll-Sergeant, Guild Knife |
| 2026-09-03T00:27:12Z | subagent | scout | claude-sonnet-5 | main | Source CC art candidates: The Factor, Wharf Shrike, Harbormaster |
| 2026-09-03T04:41:44Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-03T04:41:46Z | skill | march | unknown | main | - |
| 2026-09-03T11:23:45Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-03T11:23:47Z | skill | march | unknown | main | - |
| 2026-09-03T11:26:40Z | skill | iterate | claude-sonnet-5 | main | - |
| 2026-09-03T13:01:42Z | slash-prompt | /digest | unknown | user/ci | /digest |
| 2026-09-03T13:01:45Z | skill | digest | unknown | main | - |
| 2026-09-04T04:45:12Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-04T04:45:14Z | skill | march | unknown | main | - |
| 2026-09-04T04:46:12Z | skill | adjust-cards | claude-sonnet-5 | main | - |
| 2026-09-04T04:46:43Z | subagent | card-expert | claude-sonnet-5 | main | Audit and adjust card pool |
| 2026-09-04T16:28:19Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-04T16:28:21Z | skill | march | unknown | main | - |
| 2026-09-04T20:50:17Z | slash-prompt | /march | unknown | user/ci | /march |
| 2026-09-04T20:50:18Z | skill | march | unknown | main | - |
| 2026-09-04T20:50:48Z | skill | critique | claude-sonnet-5 | main | - |
