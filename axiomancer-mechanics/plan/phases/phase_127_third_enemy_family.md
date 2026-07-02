# Phase 127 — Third enemy class family (undead/construct/elemental)

## Outcome

5 new enemies in the `ancient-ruins` family (undead/construct/elemental theme) spanning normal/elite/boss tiers, with full befriendability configs, alignment distributions, skill loadouts, journal entries, and aftermath content following the Phase 114 pattern.

## Source spec

`specs/07-enemy-content-and-ai.md` § "Phase 114 Extension" + build plan Phase 127 directive. This is a direct follow-up to Phase 114's northern-forest family expansion, establishing the third major enemy archetype.

## Implementation units

### Unit 1: Core enemy type definitions
**Files:** `src/Enemy/enemy.library.ts`
- Add 5 new enemies (2 normal, 2 elite, 1 boss) with `mapName: 'ancient-ruins'`
- Theme: undead/construct/elemental archetypes
- Distribution: 2 body-focused, 2 mind-focused, 1 heart-focused for stance variety
- Each enemy gets: baseStats, logic pattern, tier1Overrides, loot tables, philosophicalAlignment

### Unit 2: Befriendability configuration
**Files:** `src/Enemy/enemy.library.ts`
- All elite/boss enemies get custom `befriendabilityConfig` per Phase 68 pattern
- Normal enemies use default friendship mechanics
- Boss tier gets complex multi-axis requirements (roundsThreshold + hpGate + stance requirements)

### Unit 3: Skill rotation content
**Files:** `src/Enemy/enemy.library.ts`
- Elite and boss enemies get authored `skills: [skill('<id>')]` per Phase 57 pattern
- Pick Tier 3 skills matching each enemy's philosophicalAlignment archetype
- Normal enemies may get basic skill rotations

### Unit 4: Friendship reward content
**Files:** `src/Enemy/enemy.library.ts`
- All enemies get `friendshipReward` with items, xpBonus, narrative, alignmentDelta, flagSet
- Boss tier gets high-value unique rewards (±75 xpBonus, multi-axis alignment shift)
- Follow Phase 70 reward structure precedent

### Unit 5: Aftermath narrative content
**Files:** `src/Enemy/enemy.library.ts`
- All enemies get `finalBlowLines`, `pactLines`, `causeLines` per Phase 71 pattern
- Content reflects undead/construct/elemental themes and philosophical positions

### Unit 6: Journal entries
**Files:** `src/Enemy/enemy.library.ts`
- All enemies get `journalEntry` per Phase 73 pattern
- Entries explore ancient-ruins lore, undead nature, construct purpose, elemental essence

## Decisions made upfront — DO NOT ASK

1. **Third family theme:** Ancient ruins with undead/construct/elemental enemies. Maps to existing `ancient-ruins` map reference.
2. **Enemy distribution:** 2 normal, 2 elite, 1 boss (5 total) to balance against existing families.
3. **Stance distribution:** 2 body-focused, 2 mind-focused, 1 heart-focused for encounter variety.
4. **Naming convention:** Classical/mystical names reflecting ancient/magical themes (vs coastal/forest naturalism).
5. **Alignment positioning:** Spread across philosophical cube to cover archetypal positions not well-represented in existing families.
6. **Skill selection:** Pull from Tier 3 skill library, matching alignment archetypes per Phase 57 precedent.

## Verify gate

- `npm run verify` (type-check + test + build)
- Enemy e2e tests pass for all 5 new enemies
- Befriendability registration works for elite/boss tiers
- All skill rotations execute without errors
- Journal entry unlocking works on friendship outcomes

## Commit body template

```
feat(enemy): phase 127 — third enemy family (ancient-ruins)

- 5 new undead/construct/elemental enemies spanning normal/elite/boss
- Full befriendability configs with multi-axis requirements for elite/boss
- Authored skill rotations using Tier 3 skills matched to alignment
- Complete friendship reward content with unique items and narrative
- Aftermath prose (finalBlowLines/pactLines/causeLines) for all enemies  
- Journal entries exploring ancient-ruins lore and philosophical themes

Decisions:
- Ancient-ruins theme chosen for third family archetype
- 2 normal, 2 elite, 1 boss distribution matches Phase 114 precedent
- Stance distribution: 2 body, 2 mind, 1 heart for encounter variety
- Alignment spread covers underrepresented philosophical cube positions

Extends enemy library from 25 to 30 total production enemies.
```

## Definition of Done

- [ ] 5 new enemies added to `enemy.library.ts` with `mapName: 'ancient-ruins'`
- [ ] All enemies have complete befriendability configs appropriate to tier
- [ ] Elite/boss enemies have authored skill rotations from Tier 3 library
- [ ] All enemies have friendship rewards with items, narrative, alignment shifts
- [ ] Complete aftermath narrative content (3 line variants each) for all enemies
- [ ] Journal entries authored for all enemies with ancient-ruins themes
- [ ] Philosophical alignment distribution covers diverse cube positions
- [ ] Loot tables follow established weighted drop patterns
- [ ] Enemy e2e tests verify all new enemies function correctly
- [ ] `docs/enemy.md` updated with third family overview
- [ ] `npm run verify` passes

## Follow-ups (out of scope)

- Spawn pool integration for ancient-ruins encounters (deferred to encounter system work)
- Multi-enemy combat featuring mixed family encounters  
- Procedural enemy generation using established patterns as templates