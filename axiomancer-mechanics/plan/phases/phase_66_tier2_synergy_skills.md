# Phase 66 — Tier 2 synergy skills (5 patterns + `synergy?` clause)

> User design-pass at oversight-10 locked the engine primitive shape and
> the 5-skill content scope. This brief picks the specific stance / cost /
> effect-id mapping per skill.

## Outcome

`Skill.synergy?: SkillSynergy` optional field added. Five new Tier 2
skills authored using the new primitive. Each skill ships with
hermetic e2e coverage. `docs/skills.md` gains a "Tier 2 synergy
(Phase 66)" subsection.

## Engine primitive — `SkillSynergy` shape (D1)

```typescript
export interface SkillSynergy {
    /** Optional predicate. If absent, the synergy fires unconditionally
     *  when the skill is cast (used by Resonance Detonation). */
    predicate?: SynergyPredicate;
    /** Flat bonus damage on match. */
    bonusDamage?: number;
    /** Multiplier × matched effect's remainingDuration. */
    durationDamageMul?: number;
    /** Multiplier × matched effect's intensity. */
    intensityDamageMul?: number;
    /** Multiplier × total consumed combat-resource tokens. */
    resourceTokenDamageMul?: number;
    /** Consume (clear) the matched effect on the predicate's `on` side. */
    consumeMatched?: boolean;
    /** Consume the caster's full combat-resource pool. */
    consumeAllResources?: boolean;
    /** Clear all ActiveEffects from both combatants. */
    clearAllEffectsBothSides?: boolean;
    /** Apply an additional effect on the caster when synergy fires.
     *  Used by Bat-Swarm-Thoughtform (apply heart-typed buff). */
    applyEffectOnFire?: SkillCombatEffects;
}

export interface SynergyPredicate {
    effectId: string;
    on: 'caster' | 'target';
    intensityMin?: number;
    durationMin?: number;
}
```

Synergy damage formula (added to the skill's existing `basePower`-based damage):
```
synergyDamage = bonusDamage
              + (matched ? matched.intensity × intensityDamageMul : 0)
              + (matched ? matched.remainingDuration × durationDamageMul : 0)
              + (consumedTokens × resourceTokenDamageMul)
```

Synergy runs in `executeSkill` AFTER `calculateSkillDamage` but BEFORE
`combatEffects` apply (so a consumed effect doesn't get the to-be-applied
effects layered on top).

## The 5 skills (D2-D6)

| ID | Stance | Cost | basePower | Predicate | Synergy fields | Cell |
|---|---|---|---|---|---|---|
| **`resonance-bleed`** (D2) | heart | `{ heart: 2, mind: 2 }` | 4 | `debuff_bleed` on target, durationMin: 2 | `bonusDamage: 5, durationDamageMul: 3` | Heart-Optimistic-Relational (Murdoch — attentive love) |
| **`intensity-feedback`** (D3) | mind | `{ mind: 2, heart: 2 }` | 5 | `buff_critical_rate_up` on caster, intensityMin: 1 | `bonusDamage: 4, intensityDamageMul: 5` | Logic-Optimistic-Individual (Nietzsche overlap) |
| **`bat-swarm-thoughtform`** (D4) | heart | `{ heart: 2, body: 2 }` | 0 (no direct damage; pure transformation) | `buff_thorns_body` on caster, durationMin: 5 (the closest existing body-defensive buff — see D-impl below) | `consumeMatched: true, applyEffectOnFire: { effectId: 'buff_critical_rate_up', appliedTo: 'self', intensity: 3, duration: 5 }` | Faith-Optimistic-Transcendent (mystical type-swap) |
| **`resonance-burst`** (D5) | mind | `{ mind: 2, heart: 1 }` | 3 | `debuff_confusion` on target, durationMin: 1 | `bonusDamage: 3, intensityDamageMul: 2, durationDamageMul: 3, consumeMatched: true` | Logic-Pessimistic-Individual |
| **`resonance-detonation`** (D6, user write-in) | heart | `{ heart: 3, body: 3, mind: 3 }` | 0 | (no predicate — unconditional on cast) | `bonusDamage: 25, resourceTokenDamageMul: 10, consumeAllResources: true, clearAllEffectsBothSides: true` | Agnostic-Pessimistic-Transcendent (the apex burn) |

**D-impl for `bat-swarm-thoughtform`**: the brief picks
`buff_thorns_body` (closest match for the braindump's "Body Thorns")
if that effect ID exists in the library; if not, the brief picks the
closest available defensive body buff (e.g. `buff_barrier`) at
implementation time. The intent is the type-swap, not a specific
effect id; this stays adjustable at unit-2 time.

All 5 are Tier 2; all carry `learningRequirement: { level: 5 }`
matching the existing Tier 2 convention.

## Implementation units

### Unit 1 — Engine primitive

**Files:**
- `src/Skills/types.ts` — `SkillSynergy` + `SynergyPredicate` interfaces; `Skill.synergy?: SkillSynergy` field.
- `src/Skills/skill.engine.ts` — `executeSkill` evaluates `skill.synergy` after `calculateSkillDamage` and before `combatEffects`. Helper: `evaluateSynergy(skill, caster, target): { fired: boolean; bonusDamage: number; sideEffects: { ... } }`.
- `src/index.ts` — re-export `SkillSynergy` + `SynergyPredicate` types.
- `scripts/public-surface.expected.json` — regenerate (+2 types: 159 → 161).

### Unit 2 — Author the 5 skills + register

**Files:**
- `src/Skills/skill.library.ts` — append 5 new skill consts + add to `skillLibrary` array.

### Unit 3 — Hermetic e2e + docs + CHANGELOG

**Files:**
- `src/Skills/e2e/synergy-skills.engine.test.ts` (new) — 5+ cases (one per skill, each with predicate-match + predicate-miss path where applicable).
- `docs/skills.md` — "Tier 2 synergy (Phase 66)" subsection with the synergy schema + the 5-skill table.
- `CHANGELOG.md` `[unreleased]` `### Added` — Phase 66 bullet.

## Decisions made upfront — DO NOT ASK

- **D1** — Unified `SkillSynergy` shape (above); single field on `Skill`. Smallest engine touch; covers all 5 patterns.
- **D2-D6** — Specific stance / cost / predicate / synergy-fields per skill (table above).
- **D7** — Synergy damage adds to base damage (doesn't replace). `consumeMatched` clears the matched ActiveEffect from the relevant side BEFORE the skill's own `combatEffects` apply.
- **D8** — `consumeAllResources` consumes ALL of `combatResources.body + mind + heart`; `consumedTokens` = sum of all stance tokens that were available pre-consume.
- **D9** — `clearAllEffectsBothSides` clears `activeEffects: []` on both caster and target. Phase 60 set-bonus passives (sourceId: 'set-bonus', remainingDuration: -1) are CLEARED by this — design intent. Future content can opt out by detecting the source-id.
- **D10** — `applyEffectOnFire` applies AFTER `consumeMatched` so the new effect replaces the matched one cleanly.
- **D11** — Three commits per the unit split; ship-row flip is the fourth.

## Verify gate

- `npm run type-check` — clean.
- `npm test` — must stay green + new cases land.
- `npm run build` — clean.
- `npm run deploy:check` — fixture refreshed in Unit 1 (159 → 161 types).

## Definition of Done

- [ ] `SkillSynergy` + `SynergyPredicate` types shipped + re-exported.
- [ ] `executeSkill` evaluates synergy per D7.
- [ ] 5 skills authored + registered in `skillLibrary`.
- [ ] Fixture regenerated (+2 types).
- [ ] Hermetic e2e covers each skill.
- [ ] `docs/skills.md` Phase 66 subsection.
- [ ] `CHANGELOG.md [unreleased]` ### Added Phase 66 bullet.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 66 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- True "rewind combat to start" semantics for resonance-detonation
  (heavy variant of D6).
- `incrementsFriendship?: number` skill payload (pair with the
  Befriending mechanic v2 candidate's option (c)).
- New body/heart Thorns-and-BatSwarm effect-library entries if the
  D-impl picks for `bat-swarm-thoughtform` show that a dedicated
  effect would author cleaner than reusing `buff_critical_rate_up`.

## Canonical sibling

Phase 44 (`87cfa7e` + `06f5ffe`) — added `Skill.sourcedFromCell?:
string` + 4 new Tier 3 fallacy skills. Phase 66 follows the same
shape: a single additive optional field on `Skill` + a content batch.
The Phase 44 commits are the closest model for the per-skill
authoring style (resourceCost / basePower / philosophicalAspect /
combatEffects in the library).
