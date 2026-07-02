# Phase 60 — Befriendable-enemy content arc

> Closes Knowledge-Gaps Q5 (content half). Phase 36 (`276eecb`)
> shipped the friendship-victory mechanics — `outcome === 'friendship'`
> on `CombatEndReport`, half-XP grant, full loot, +1 moralMeter. This
> phase adds the per-enemy *content* that makes befriending feel like
> a real authored choice rather than just a stalemate exit.

## Outcome

Two library enemies — **MournfulGull** and **HollowEyedBeggar** —
carry a per-enemy `friendshipReward?` that grants bonus content
(items + XP + narrative) on top of the Phase 36 mechanics base when
the player resolves combat via friendship. `CombatEndReport` gains
an optional `friendshipReward` field surfacing the narrative +
side-effects to the CLI / UI. A hermetic e2e at
`src/Game/e2e/befriend.engine.test.ts` drives a MournfulGull
friendship run end-to-end and asserts the per-enemy reward.

## Source spec / candidate

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 60 row — promoted
at oversight 2026-05-20 sixth-of-day. Closes Knowledge-Gaps Q5
content half. Phase 36 brief is the mechanics-side ancestor; this
phase fills the open content half it deferred.

The candidate row's scope says "Pick 2-3 enemies … `friendshipReward?:
Reward` (or similar) field on `Enemy`, optional dialogue lines …
quest entries that branch on `outcome === 'friendship'` vs
`'victory'` for at least one quest. Example targets: MournfulGull
(befriend → unique passive), HollowEyedBeggar (befriend → moral arc
tie-in via beggar quest), one boss-tier enemy where the choice is
genuinely costly." This brief tightens the scope to **2 enemies**
(no boss-tier; deferred to follow-up) and **no quest-branch wire-in**
(also deferred to follow-up — see D3). The hermetic e2e covers one
befriend run.

## Implementation units

### Unit 1 — Type + engine: `FriendshipReward` field + `CombatEndReport` extension

**Files touched:**
- `src/Enemy/types.ts` — new `FriendshipReward` interface; new optional `friendshipReward?: FriendshipReward` on `Enemy`.
- `src/Game/store.ts` — extend `CombatEndReport` with optional `friendshipReward?` field; thread per-enemy reward through `endCombat()` for `outcome === 'friendship'` cases.
- `src/Enemy/index.ts` — re-export `FriendshipReward` from the module barrel.
- `src/index.ts` — re-export `FriendshipReward` from the top-level Enemy block.
- `scripts/public-surface.expected.json` — regenerate via `node scripts/snapshot-public-surface.mjs --write` (adds `FriendshipReward` as a new type export).

**Type sketch:**

```typescript
// src/Enemy/types.ts
import type { Item } from '../Items/types';

/**
 * Phase 60 — per-enemy content awarded when combat resolves via
 * friendship (Phase 36's `outcome === 'friendship'` path).
 *
 * Layered ON TOP OF the existing Phase 36 base: half-XP +
 * full loot + +1 moralMeter. None of the FriendshipReward fields
 * REPLACE the Phase 36 grants; they augment them.
 *
 * Authors leave undefined for enemies whose friendship path is
 * purely mechanical (no content stakes).
 */
export interface FriendshipReward {
    /** Guaranteed items added to the player's inventory on friendship.
     *  Merge-appended to the existing weighted-loot roll. */
    items?: Item[];
    /** Extra XP added on top of the Phase 36 half-XP base. Engine
     *  applies before level-up cascade so promotion can fire from
     *  the bonus. */
    xpBonus?: number;
    /** Optional flavour text the CLI / UI renders after combat-end.
     *  Engine does not interpret. */
    narrative?: string;
}

export interface Enemy {
    // ... existing fields ...
    /** Phase 60 — optional per-enemy reward content surfaced on
     *  `outcome === 'friendship'`. See {@link FriendshipReward}. */
    friendshipReward?: FriendshipReward;
}
```

**`CombatEndReport` extension:**

```typescript
// src/Game/store.ts
export interface CombatEndReport {
    outcome: 'victory' | 'defeat' | 'friendship' | 'flee';
    xpGained: number;
    loot: Item[];
    /** Phase 60 — per-enemy friendship-reward content. Only present
     *  on `outcome === 'friendship'` when the befriended enemy carries
     *  a `friendshipReward`. The CLI / UI renders `narrative`; the
     *  engine has already applied `items` to `loot` and `xpBonus` to
     *  `xpGained` by the time this surfaces. */
    friendshipReward?: {
        narrative?: string;
    };
}
```

**`endCombat()` thread:**

```typescript
// src/Game/store.ts — inside endCombat(), in the friendship branch
} else if (outcome === 'friendship' && pre.currentEncounter) {
    xpGained = Math.floor(totalEncounterXp(pre.currentEncounter) * 0.5);
    loot = rollEncounterLoot(pre.currentEncounter);

    // Phase 60 — per-enemy friendshipReward supplement.
    const fr = pre.combat.enemy.friendshipReward;
    if (fr) {
        if (fr.items) loot = [...loot, ...fr.items];
        if (fr.xpBonus) xpGained += fr.xpBonus;
    }
}

// ... later, after constructing the base report:
const report: CombatEndReport = { outcome, xpGained, loot };
if (outcome === 'friendship' && pre.combat?.enemy.friendshipReward?.narrative) {
    report.friendshipReward = { narrative: pre.combat.enemy.friendshipReward.narrative };
}
```

Decision D6 — items merge into the existing loot array (not replace).
Decision D5 — `xpBonus` adds on top of the half-XP base; doesn't
multiply.

**Hermetic coverage in this unit:** colocated unit-style assertion
in `src/Game/store.ts`-adjacent test (new entries in an existing
test or a small new sibling — see Unit 3 for the e2e drive).
Lightweight unit tests can land in this unit's commit if the diff is
small; otherwise fold all test work into Unit 3.

### Unit 2 — Content: author MournfulGull + HollowEyedBeggar friendship rewards

**Files touched:**
- `src/Enemy/enemy.library.ts` — add `friendshipReward` to MournfulGull (line 161) + HollowEyedBeggar (line 193).

**MournfulGull — heart-tier mournful mid-game enemy:**

```typescript
// MournfulGull — befriending "every slight it remembers" yields
// a heart-attuned remembrance gift.
friendshipReward: {
    items: [{ ...consumableLibrary.find(c => c.id === 'heart-draught')! }],
    xpBonus: 10,
    narrative: 'The gull stops circling. It settles on the rail beside you. ' +
        'For a long moment, neither of you speaks the slights you remember.',
},
```

Items: 1 × `heart-draught` (already in the loot table at 30% weight;
the friendship grant guarantees one regardless of the roll).

**HollowEyedBeggar — faith-pessimistic-relational, beggar archetype:**

```typescript
// HollowEyedBeggar — "they want what you carry, not what you are";
// befriending them reverses the demand: they offer what they carry.
friendshipReward: {
    items: [
        { ...consumableLibrary.find(c => c.id === 'healing-potion')! },
        { ...consumableLibrary.find(c => c.id === 'antidote')! },
    ],
    xpBonus: 15,
    narrative: 'They pull a folded cloth from somewhere inside the rags. ' +
        'Two phials, both still cold. "I was carrying these for someone," ' +
        'they say. "But you stopped. So."',
},
```

Decision D8 — Both enemies' rewards use **existing** library items
(no new content authoring in Items). Phase 60 stays scoped to
*combining* shipped pieces; new items are a future content phase.

### Unit 3 — Hermetic e2e + docs + Knowledge-Gaps Q5 close

**Files touched:**
- `src/Game/e2e/befriend.engine.test.ts` — new file, drives a MournfulGull friendship run end-to-end through `createGameStore` + the friendship-counter cap + `endCombat()`. Asserts:
  - `report.outcome === 'friendship'`
  - `report.xpGained === floor(totalEncounterXp * 0.5) + 10` (base + bonus)
  - `report.loot` includes a `heart-draught` item (the guaranteed friendship grant; may also include weighted-roll loot)
  - `report.friendshipReward?.narrative` matches the authored string
  - Player `moralMeter` shifted +1 (Phase 36 mechanics still fire alongside)
- `docs/enemy.md` — gain "Befriendable enemies (Phase 60)" subsection listing the 2 authored rewards + the field shape + cross-link to `docs/combat.md` Friendship Path.
- `docs/combat.md` — extend the Friendship Path section to mention `report.friendshipReward` (per-enemy bonus content) on top of the Phase 36 base.
- `docs/api.md` — Enemy section gains a `FriendshipReward` row + Game section gains the `CombatEndReport.friendshipReward` field note.
- `Knowledge-Gaps.md` — flip Q5 from "Resolved at Phase 36 (mechanics half); content half open" to "**Resolved at Phase 36 (mechanics — `276eecb`) + Phase 60 (content — this phase)**. Two authored befriendable enemies (MournfulGull + HollowEyedBeggar) with per-enemy `friendshipReward`. Boss-tier befriendable enemy + quest-branch wire-in deferred to follow-up content phases."

**Test sketch:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupMockRng, restoreMockRng } from '../../test-utils/rng';
import { createGameStore, nullAdapter } from '../store';
import { MournfulGull } from '../../Enemy/enemy.library';
import { createCharacter } from '../../Character';

describe('Phase 60 — befriendable enemy content arc', () => {
    beforeEach(() => setupMockRng(0.5));
    afterEach(() => restoreMockRng());

    it('MournfulGull friendship grants the per-enemy friendshipReward on top of Phase 36 base', () => {
        const player = createCharacter({ name: 'Player' });
        const store = createGameStore(nullAdapter, { player });
        store.startCombat(MournfulGull);
        // ... defend-defend rounds until friendshipCounter caps ...
        const report = store.endCombat();
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'heart-draught')).toBe(true);
        expect(report.friendshipReward?.narrative).toMatch(/circling/);
        expect(store.player.experience).toBeGreaterThan(0);
    });
});
```

## Decisions made upfront — DO NOT ASK

- **D1 — `FriendshipReward` shape.** Three optional fields:
  `items?: Item[]`, `xpBonus?: number`, `narrative?: string`. Minimal
  viable; trivially extensible. Skip `skillId`, `flagSet`,
  `questBranch` — those want their own future-phase scope (D3).

- **D2 — Two enemies, not three.** MournfulGull + HollowEyedBeggar.
  Boss-tier befriendable enemy deferred per the candidate's
  follow-up framing. Two is enough to establish the authoring
  pattern + drive an e2e; three is a content sprint, not a
  pattern-setting phase.

- **D3 — No quest-branch wire-in this phase.** The candidate said
  "quest entries that branch on `outcome === 'friendship'` vs
  `'victory'` for at least one quest." That requires either (a) a
  new `QuestObjective` type / quest-side reaction to friendship
  outcome OR (b) a `flagSet` field on `FriendshipReward` that
  drives existing flag-gated quest entries. Both are real
  primitives that deserve their own phase scope; folding them in
  here would double the file count. Document under Follow-ups.

- **D4 — `narrative: string` rendered by CLI/UI, not engine.** The
  engine doesn't interpret the string; it surfaces it on
  `CombatEndReport.friendshipReward.narrative` for the consumer.

- **D5 — `xpBonus` adds; doesn't multiply.** Final XP for
  friendship outcome = `floor(totalEncounterXp * 0.5) + (xpBonus ?? 0)`.
  Multiplying would compound with Phase 36's half-XP factor in
  surprising ways; additive composition is the predictable choice.

- **D6 — Items append; don't replace.** Final loot array =
  `rollEncounterLoot(encounter) ++ friendshipReward.items`. The
  guaranteed items are layered ON TOP of the existing weighted
  roll, matching the Phase 36 framing that friendship grants "full
  loot" (the roll still fires).

- **D7 — `report.friendshipReward.narrative` only.** The
  `CombatEndReport.friendshipReward` field carries only the
  narrative string. `items` and `xpBonus` already flow through
  `report.loot` / `report.xpGained`; exposing them again would be
  redundant. The narrative is the only thing the report needs to
  carry that wouldn't otherwise reach the consumer.

- **D8 — Rewards use existing library items.** No new items
  authored in this phase. `consumableLibrary` already has the
  archetypes needed (`heart-draught`, `healing-potion`, `antidote`).
  New item authoring is a content-phase concern, not Phase 60's.

- **D9 — `setupMockRng(0.5)` for the e2e.** Mid-value to make
  weighted loot rolls deterministic without picking either
  extreme. Phase 60 doesn't care about specific weighted-loot
  outcomes; it cares about the friendshipReward grant being
  unconditional.

- **D10 — Knowledge-Gaps Q5 closes at this phase.** The "content
  half" the Phase 36 close note left open is satisfied by 2
  authored befriendable enemies. The deeper question "which
  enemies *should* be befriended" remains a living content design
  call, but the engine pattern + first content batch is enough to
  declare Q5 resolved with the standard
  "Resolved at Phase 36 + Phase 60" framing.

- **D11 — Public-surface fixture refresh.** Unit 1 adds
  `FriendshipReward` to the type exports; the
  `scripts/public-surface.expected.json` fixture grows by 1 type.
  Refresh via `node scripts/snapshot-public-surface.mjs --write`
  and include the regen in Unit 1's commit so deploy:check stays
  green per Phase 53.

- **D12 — `CombatEndReport.friendshipReward` is an additive,
  optional extension.** Existing consumers that destructure
  `{ outcome, xpGained, loot }` continue to work; only consumers
  that opt in to `report.friendshipReward?.narrative` see the new
  field. Mobile (`asyncStorageAdapter` consumer) is unaffected
  since the field is engine-output, not engine-input.

- **D13 — Three commits, not four.** Unit 1 (type + engine + barrel
  + fixture) is one commit; Unit 2 (content authoring) is one
  commit; Unit 3 (e2e + docs + KG flip) is one commit. The
  ship-row flip is the fourth.

## Verify gate

- `npm run type-check` — must pass; `FriendshipReward` field is
  additive, no existing consumer should break.
- `npm test` — must pass; new hermetic e2e adds ≥1 case. Expected
  count: 625 + N (where N is the new case count).
- `npm run build` — must pass; no build-graph change.
- `npm run deploy:check` — must pass; public-surface fixture
  regenerated in Unit 1 with `FriendshipReward` added; tag /
  CHANGELOG alignment unchanged (the bump is post-ship, user-
  triggered per RELEASING.md).

## Commit body template (per unit)

### Unit 1 commit

```
feat(enemy): Phase 60 unit 1 — FriendshipReward type + CombatEndReport extension

- Add FriendshipReward interface to src/Enemy/types.ts ({ items?,
  xpBonus?, narrative? } per D1).
- Extend Enemy with optional `friendshipReward?: FriendshipReward`.
- Extend CombatEndReport with optional `friendshipReward?: { narrative? }`
  (D7 — narrative only; items + xpBonus flow through existing
  report.loot / report.xpGained).
- Thread per-enemy friendshipReward through store.endCombat()'s
  outcome === 'friendship' branch: items append to loot (D6),
  xpBonus adds to xpGained (D5).
- Re-export FriendshipReward through src/Enemy/index.ts + src/index.ts
  Enemy block.
- Refresh scripts/public-surface.expected.json — +1 type export
  (D11).

Decisions:
- D1 — minimal three-field shape; trivially extensible.
- D5/D6 — additive composition (xpBonus adds, items append).
- D7 — narrative is the only new field on the report; items + xp
  already reach the consumer through existing fields.
- D11 — fixture refresh in this commit so deploy:check stays green.
```

### Unit 2 commit

```
feat(content): Phase 60 unit 2 — author MournfulGull + HollowEyedBeggar friendship rewards

- MournfulGull (line 161, src/Enemy/enemy.library.ts) — heart-tier
  remembrance gift: 1 × heart-draught + 10 xpBonus + narrative
  pulling the "every slight it remembers" voice (perches on the
  rail, neither speaks the slights).
- HollowEyedBeggar (line 193) — faith-pessimistic-relational reversal
  of the begging dynamic: 2 phials (healing-potion + antidote) +
  15 xpBonus + narrative pulling the "they want what you carry,
  not what you are" voice (they offer what they carry, in turn).

Decisions:
- D2 — 2 enemies, not 3; boss-tier deferred per the candidate's
  follow-up framing.
- D8 — rewards use existing library items only; no new content
  authoring.
```

### Unit 3 commit

```
test(combat): Phase 60 unit 3 — hermetic e2e + docs + KG Q5 close

- src/Game/e2e/befriend.engine.test.ts — N hermetic cases driving
  a MournfulGull friendship run end-to-end. Asserts outcome
  string, items contain heart-draught, friendshipReward.narrative
  matches, xpGained = base + bonus, moralMeter shifted +1.
- docs/enemy.md — "Befriendable enemies (Phase 60)" subsection
  with the 2 authored rewards + the field-shape table + cross-link
  to docs/combat.md.
- docs/combat.md — Friendship Path section extended to mention
  report.friendshipReward (per-enemy bonus content).
- docs/api.md — Enemy + Game sections gain the new field rows.
- Knowledge-Gaps.md — Q5 flips to "**Resolved at Phase 36 + Phase
  60**" with both shipping references; boss-tier + quest-branch
  noted as follow-up.

Decisions:
- D9 — setupMockRng(0.5) for deterministic weighted-loot rolls.
- D10 — Q5 closes; deeper "which enemies should be befriended"
  remains a content-design question that's intentionally open.
```

## Definition of Done

- [ ] `FriendshipReward` interface exists in `src/Enemy/types.ts` and
      is re-exported through `src/Enemy/index.ts` + top-level barrel.
- [ ] `Enemy.friendshipReward?: FriendshipReward` added.
- [ ] `CombatEndReport.friendshipReward?: { narrative? }` added.
- [ ] `store.endCombat()` threads per-enemy `friendshipReward` for
      `outcome === 'friendship'` paths per D5 / D6 / D7.
- [ ] MournfulGull + HollowEyedBeggar carry authored
      `friendshipReward` content per Unit 2.
- [ ] `scripts/public-surface.expected.json` regenerated (+1 type).
- [ ] `src/Game/e2e/befriend.engine.test.ts` ships with ≥1 hermetic
      case covering the MournfulGull friendship path.
- [ ] `docs/enemy.md` "Befriendable enemies (Phase 60)" subsection.
- [ ] `docs/combat.md` Friendship Path section mentions
      `report.friendshipReward`.
- [ ] `docs/api.md` Enemy + Game rows extended.
- [ ] `Knowledge-Gaps.md` Q5 closed with the standard "Resolved at
      …" framing pointing at both Phase 36 + Phase 60.
- [ ] `npm run verify` is green.
- [ ] `npm run deploy:check` is green.
- [ ] `plan/steps/01_build_plan.md` Phase 60 row flips `[ ]` → `[x]`
      with commit hashes per unit.

## Follow-ups (out of scope)

- **Boss-tier befriendable enemy.** The candidate's third example
  ("one boss-tier enemy where the choice is genuinely costly") wants
  its own phase scope — boss-tier rewards likely want bigger payloads
  (unique items, alignment shifts, named NPC follow-up) than the
  authored rewards in this phase.
- **Quest-branch wire-in on `outcome === 'friendship'`.** Deferred per
  D3. Future phase adds either `FriendshipReward.flagSet?: string`
  + a flag-gated quest entry, OR a `QuestObjective.completedOn?:
  'friendship' | 'victory'` slot.
- **Skill-as-friendship-reward.** `skillId` field on
  `FriendshipReward` + a `LEARN_SKILL` dispatch after `END_COMBAT`.
  Clean primitive; reserved for a content phase that has the
  authored skill content to back it.
- **More authored rewards.** The 14 remaining authored enemies
  (post the 2 in this phase) are candidates for future content
  passes; pacing should match the player's traversal of the
  fishing-village / northern-forest content.
- **Per-cell alignment-cued befriendable hint.** Future UI work
  could surface a "this enemy can be befriended" indicator gated
  on `enemy.friendshipReward !== undefined`; engine just needs the
  field, which this phase ships.

## Canonical sibling

`plan/phases/phase_57_enemy_rotation_content_sweep.md` is the most
recent enemy-library content phase; its commit shape (per-enemy
authoring in `enemy.library.ts`, hermetic test at the rotation
level, docs/enemy.md table update) is the model for Unit 2 + 3.
Phase 36 brief (`plan/phases/phase_36_friendship_victory_reward.md`)
is the mechanics-side ancestor and supplies the `endCombat()`
threading pattern (the `outcome === 'friendship'` branch already
populated by Phase 36 is the insertion point for the new
`friendshipReward` thread).
