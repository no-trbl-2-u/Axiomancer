# Goal — character-sheet walkthrough

**Surface under test:** the new "Character" tab (Phase 26 unit 3).

**Pass conditions (the agent should verify against the state log + event stream):**

1. The session opens, the Apprentice preset is built, and the resulting
   character is logged with the expected starting fields:
   - `level: 1`
   - `baseStats: { heart: 5, body: 5, mind: 5 }`
   - `knownSkills` length = 6 (all Tier-1 skills)
   - `knownSkills` accessible in combat (Phase 99)
   - `inventory` includes `minor-healing-potion ×3`
   - `currency: 0`
2. The Character tab is opened (visible in stderr / human-log output —
   look for the `— Character Sheet —` header). State is not mutated by
   the tab itself, so the state-log file should NOT have a record
   between the `bootstrap` entry and the `cli:exit` event.
3. The session exits cleanly via the `quit` tab with a final
   `cli:exit` event in the JSON event stream (`reason: 'quit'`).

**Fail conditions:**

- The preset wasn't found (`Unknown preset: apprentice`).
- Any unexpected state mutation between bootstrap and exit.
- The CLI exited with `reason: 'error'`.
