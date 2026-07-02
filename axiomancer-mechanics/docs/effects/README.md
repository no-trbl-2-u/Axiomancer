# docs/effects — Per-Effect Deep-Dives

This directory holds one markdown file per buff (`buffs/buff_*.md`) and
debuff (`debuffs/debuff_*.md`). Each file documents a single effect's
payload, mechanics, and design intent.

The parent doc — [`../effects.md`](../effects.md) — is the live
contract for the effects engine; this directory is the long-form
companion.

---

## Important: stale `PENDING (Phase 2)` markers

Many files in this tree carry "PENDING (Phase 2)" markers next to
`statModifiers`, `defenseModifier`, `advantageModifier`,
`actionRestriction`, and similar payload fields. **Those markers are
historical — the underlying engine has shipped most of them.** Treat
them as "needs a per-file polish pass," not "the mechanic isn't
wired."

What's actually live as of 2026-05-15:

| Payload field          | Live? | Wired via                                                                    |
|------------------------|-------|------------------------------------------------------------------------------|
| `statModifiers`        | LIVE  | `getEffectiveStats` aggregates and folds into `getAttackStat` / `getDefenseStat` / `getSaveStat` (`src/Combat/stats.ts` + `src/Combat/effect-modifiers.ts`). |
| `defenseModifier`      | LIVE  | `getEffectiveStats().defenseDelta` plus the scenario-phase passive-defense path (`src/Combat/phases/scenario.ts`).                                                            |
| `rollModifier` / `rollModifierPerIntensity` | LIVE | `getActiveRollModifier` (`src/Combat/effects.ts`); applied to attack and damage rolls in the scenario phase.                                                                  |
| `reflectDamage`        | LIVE  | `getThornsReflect` (`src/Combat/effects.ts`); paid out after damage application in the scenario phase.                                                                       |
| `regeneration.healthPerRound` (positive) | LIVE | `applyRegen` (`src/Combat/effects.ts`); fires at round-start.                                                                                                                |
| `regeneration.healthPerRound` (negative — drain) | LIVE | `applyDrain` (`src/Combat/effects.ts`); fires at round-start before DoT.                                                                                                     |
| `damageOverTime`       | LIVE  | `processDamageOverTime` split by `tickPhase: 'start' \| 'end'` (Spec 01).                                                                                                    |
| `advantageModifier`    | LIVE  | `resolveEffectiveAdvantage` (`src/Combat/advantage.ts`); grants and denies fold into the matchup in the advantage phase.                                                     |
| `actionRestriction`    | LIVE  | `canAct` (`src/Combat/effect-modifiers.ts`); enforces `skipTurn` / `forcedStance` / `blockedStances` in the action-restriction phase.                                        |
| Tier 1 stance buff application | LIVE | `applyTier1CombatEffect` + `clearTier1EffectsForStance` (`src/Effects/index.ts`), called from the stance-effects phase.                                                       |
| Tier 2 / Tier 3 procs  | LIVE  | `rollForCombatEffects` + `applyProcOutcome` + `applyFumbleOutcome` (`src/Combat/combat-effects.ts`), called from the scenario phase per Spec 03.                              |
| `tier1_mind_mark` (Exposed Reasoning) | LIVE | `getStudyMarkIntensity` (`src/Combat/effects.ts`); folded into Mind-stance damage in the scenario phase.                                                                     |
| Heart-attack buff stripping / extension | LIVE | `removeRandomBuff` / `extendRandomBuffDuration` (`src/Combat/effects.ts`); called from the scenario phase on Heart-stance hits.                                              |

What's genuinely not yet wired (so the "PENDING" marker is honest):

- A few cross-effect interactions documented in individual files that
  call out specific edge cases — read the file's `## Pending` or
  `## Known caveats` section for what's still genuinely open per
  effect.

What recently moved from PENDING to LIVE:

- `critStyle` auto-selection (`double` vs `pierce` "whichever deals
  more") — Phase 32 wired this in `src/Combat/damage.ts`
  (`selectCritDamage` helper) and `src/Combat/phases/scenario.ts`
  (the scenario phase now fires `isCriticalHit(rawAttackRoll)` on
  the attack roll and emits `isCritical` + `critStyle` fields on the
  `damage-applied` event when a crit lands).

## When updating an individual buff/debuff doc

If you touch a file in this directory:

1. Remove or correct the `PENDING (Phase 2)` markers on payload fields
   that are now live (see the table above).
2. Leave the "How to Test" code samples that reference Phase 2 IDs
   alone — they're scaffolds for future test work, not assertions
   about the current suite.
3. Keep the file's tone and structure — these are reference docs,
   not changelogs.

---

## File layout

```
docs/effects/
├── README.md         (this file)
├── buffs/
│   └── buff_<id>.md  (one per buff in src/Effects/buffs.library.json)
└── debuffs/
    └── debuff_<id>.md
```

The filename's `<id>` matches the effect's `id` field in the JSON
library. Effects shipped after Spec 01 may not have a per-effect
doc yet; the parent `effects.md` is the contract.
