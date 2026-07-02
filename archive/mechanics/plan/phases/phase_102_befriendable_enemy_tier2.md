# Phase 102 — Befriendable-enemy Tier-2 expansion

> **Phase 74 D2 deferred; oversight-26 2026-05-30 promotion (Q3)**

## Outcome

Expand the befriendable roster from 3 → 6-7 enemies by adding the full Phase 60/62/68/69/71/73 befriend stack to 3-4 candidates from the Phase 74 D2 list (TideflukeReaver, HushWraith, TheDisagreement, HollowSaint).

## Source spec

Builds on Spec 07 (enemy library), leveraging existing befriending infrastructure:
- Phase 60: `FriendshipReward` interface
- Phase 62: `flagSet` quest gates  
- Phase 68: `BefriendabilityConfig` predicates
- Phase 69: `alignmentDelta` shifts
- Phase 71: `pactLines` narrative
- Phase 73: `journalEntry` codex content

No open questions — all engine surfaces shipped.

## Implementation units

### Unit 1 — Per-enemy content authoring

Author `friendshipReward`, `befriendabilityConfig`, `alignmentDelta`, `pactLines`, and `journalEntry` on 3-4 enemies from the candidate set. Each enemy gets the full stack:

**TideflukeReaver** (elite / logic-pessimistic-relational / Ligotti archetype):
```typescript
befriendabilityConfig: {
    hpGate: { belowPct: 0.3 },
    requiredStances: ['heart', 'mind'], // empathy + understanding
    roundsThreshold: 4
}
friendshipReward: {
    items: ['tide-essence', 'healing-potion'],
    xpBonus: 35,
    alignmentDelta: { outlook: +2, scope: +1 }, // softens pessimism, opens to relationship
    narrative: "The salt-bound reaver's chains dissolve...",
    flagSet: 'befriended-tidefluke-reaver'
}
```

**HushWraith** (elite / mid-pessimistic-transcendent / Lovecraft archetype):
```typescript
befriendabilityConfig: {
    hpGate: { belowPct: 0.25 },
    requiredStances: ['heart'],
    roundsThreshold: 6 // longer patience for transcendent silence
}
friendshipReward: {
    items: ['mind-shard', 'antidote'],
    xpBonus: 40,
    alignmentDelta: { outlook: +1 }, // slight hope in cosmic indifference  
    narrative: "The wraith's silence breaks into whisper...",
    flagSet: 'befriended-hush-wraith'
}
```

**HollowSaint** (elite / faith-mid-transcendent / St. John archetype):
```typescript
befriendabilityConfig: {
    hpGate: { belowPct: 0.4 },
    requiredStances: ['heart'],
    requiredSkillUse: ['prayer'], // if player has prayer skill
    roundsThreshold: 3
}
friendshipReward: {
    items: ['blessed-icon', 'heart-draught', 'healing-potion'],
    xpBonus: 45,
    alignmentDelta: { scope: -2 }, // turns inward from transcendent to individual
    narrative: "The hollow saint finds purpose in witness...",
    flagSet: 'befriended-hollow-saint'
}
```

**TheDisagreement** (boss / logic-neutral-individual / Camus archetype):
```typescript
befriendabilityConfig: {
    hpGate: { belowPct: 0.2 },
    requiredStances: ['mind', 'heart', 'body'], // requires full spectrum
    roundsThreshold: 8 // boss-tier patience
}
friendshipReward: {
    items: ['paradox-shard', 'argument-token', 'healing-potion', 'mind-shard'],
    xpBonus: 80,
    alignmentDelta: { scope: +1 }, // opens to relational despite absurdism
    narrative: "The disagreement resolves into dialogue...",
    flagSet: 'befriended-the-disagreement'
}
```

Files modified:
- `src/Enemy/enemy.library.ts` — add the befriend stack to each chosen enemy

### Unit 2 — Hermetic e2e tests

Extend existing e2e coverage:
- `src/Game/e2e/befriend.engine.test.ts` — integration test cases for each new befriendable enemy (predicate pass/fail scenarios)
- `src/Enemy/e2e/aftermath-lines.engine.test.ts` — register the new `pactLines` + `journalEntry` coverage

### Unit 3 — Documentation

Update docs and changelog:
- `docs/enemy.md` befriendable table — add 3-4 new rows with befriendability config + reward details
- `docs/combat.md` friendship-path count — update "3 → 6-7 enemies"  
- `CHANGELOG.md [unreleased] ### Added` — entry for befriendable roster expansion

## Decisions made upfront — DO NOT ASK

1. **Enemy selection:** Ship all 4 candidates (TideflukeReaver, HushWraith, HollowSaint, TheDisagreement) to maximize roster expansion (3 → 7).

2. **Predicate difficulty scaling:** Elite enemies require hpGate ≤ 0.4, boss requires ≤ 0.2. Heart stance required for all (empathy gate). Boss requires full spectrum (mind/heart/body).

3. **Reward scaling:** Elite xpBonus 35-45, boss 80. Elite gets 2-3 items, boss gets 4. Items themed to enemy archetype.

4. **Alignment shifts:** Match philosophical archetype — pessimistic enemies gain outlook, transcendent enemies shift scope, etc.

5. **Flag naming:** `befriended-<enemy-kebab-case>` pattern for quest gate consistency.

6. **Narrative voice:** Each `pactLines` + `friendshipReward.narrative` extends the enemy's existing description + Phase 45 alignment archetype.

## Verify gate

```bash
npm run verify  # type-check + test + build
```

All befriend integration tests must pass. New e2e cases must verify predicate logic.

## Commit body template

```
feat(enemy): phase 102 — befriendable-enemy tier-2 expansion

- Add befriendability config + rewards to TideflukeReaver, HushWraith, HollowSaint, TheDisagreement
- Expand befriendable roster from 3 → 7 enemies across normal/elite/boss tiers
- Extend befriend.engine.test.ts + aftermath-lines.engine.test.ts e2e coverage
- Update docs/enemy.md befriendable table + docs/combat.md friendship count

Decisions:
- Ship all 4 Phase 74 D2 candidates for maximum roster expansion
- Elite tier: hpGate ≤ 0.4, heart stance required, 35-45 xpBonus
- Boss tier: hpGate ≤ 0.2, full stance spectrum, 80 xpBonus  
- Alignment deltas follow philosophical archetype (pessimistic → outlook +, transcendent → scope shift)
- Flag naming: befriended-<enemy-kebab-case> for quest gate consistency
```

## Definition of Done

- [ ] TideflukeReaver gains full befriend stack (config + reward + delta + lines + journal)
- [ ] HushWraith gains full befriend stack  
- [ ] HollowSaint gains full befriend stack
- [ ] TheDisagreement gains full befriend stack
- [ ] Integration e2e tests for all 4 new befriendable enemies
- [ ] Aftermath-lines e2e registration for new pactLines + journalEntry
- [ ] docs/enemy.md befriendable table updated with 4 new rows
- [ ] docs/combat.md friendship-path count updated (3 → 7)
- [ ] CHANGELOG.md entry for befriendable roster expansion
- [ ] `npm run verify` passes (type-check + test + build)
- [ ] Deploy check passes

## Follow-ups (out of scope)

- Quest content leveraging the new befriend flags (future phase)
- World placement optimization for new befriendable encounters (Phase 65 follow-up)
- Befriendable enemy Tier-3 expansion with remaining library (future candidate)