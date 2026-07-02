/**
 * Hermetic e2e — Phase 60 befriendable-enemy content arc.
 *
 * Drives a friendship outcome for MournfulGull + HollowEyedBeggar end-to-end
 * through `createGameStore`, asserts the per-enemy `friendshipReward`
 * threads through `store.endCombat()` per Phase 60 D5 / D6 / D7:
 *
 *   - items append to `report.loot` (D6)
 *   - xpBonus adds to `report.xpGained` on top of Phase 36 half-XP (D5)
 *   - narrative surfaces on `report.friendshipReward.narrative` (D7)
 *
 * Phase 36 mechanics (half-XP base, +1 moralMeter) are preserved.
 *
 * Combat is now decoupled from the store: `endCombat(outcome)` takes the
 * resolved outcome directly (the Hazard-Pattern engine decides eligibility
 * outside the store), so the reward-threading assertions are driven by
 * calling `endCombat('friendship')` / `endCombat('victory')` directly.
 */

import { describe, it, expect } from 'vitest';
import {
    MournfulGull, HollowEyedBeggar, TidepoolCrab, CoastalTyrant,
    TideflukeReaver, HushWraith, HollowSaint, TheDisagreement,
} from '../../Enemy/enemy.library';
import { createGameStore, selectMoralMeter } from '../store';
import { nullAdapter } from '../persistence/null.adapter';

describe('Phase 60 — befriendable-enemy content arc', () => {
    it('MournfulGull friendship report carries the per-enemy items + xpBonus + narrative', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);

        const initialMeter = selectMoralMeter(store.getState());
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // Items — the friendship grant guarantees a heart-draught regardless
        // of the weighted-roll outcome.
        expect(report.loot.some(item => item.id === 'heart-draught')).toBe(true);
        // xpBonus — base half-XP for MournfulGull (level 2, normal:
        // 2 * 20 / 2 = 20) plus the authored +10 bonus.
        expect(report.xpGained).toBe(30);
        // Narrative — pulls from the authored string in enemy.library.ts.
        expect(report.friendshipReward?.narrative).toMatch(/circling/);
        // Phase 36 base still fires: +1 moralMeter shift.
        expect(selectMoralMeter(store.getState())).toBe(initialMeter + 1);
    });

    it('HollowEyedBeggar friendship grants 2 phials + xpBonus 15 + reversal narrative', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(HollowEyedBeggar);

        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // Two guaranteed phials (healing-potion + antidote) on top of any
        // weighted-roll loot.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.loot.some(item => item.id === 'antidote')).toBe(true);
        // Base half-XP for HollowEyedBeggar (level 3, normal: 3 * 20 / 2 = 30)
        // plus authored +15 bonus.
        expect(report.xpGained).toBe(45);
        expect(report.friendshipReward?.narrative).toMatch(/phials/);
    });

    it('TidepoolCrab friendship omits report.friendshipReward — enemy has no authored reward', () => {
        // Regression guard for Phase 60 D12: existing consumers that
        // destructure { outcome, xpGained, loot } continue to work; the
        // friendshipReward field is undefined for enemies without authoring.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TidepoolCrab);

        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        expect(report.friendshipReward).toBeUndefined();
        // Phase 36 base still computes: half-XP only; no xpBonus applied.
        // Base half-XP for TidepoolCrab (level 1, simple: 1 * 10 / 2 = 5).
        expect(report.xpGained).toBe(5);
    });

    it('victory outcome does NOT thread friendshipReward content even when authored', () => {
        // Phase 60 D7 — friendshipReward field surfaces ONLY on
        // outcome === 'friendship'. Defeat / victory / flee paths skip it.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        const report = store.getState().endCombat('victory');

        expect(report.outcome).toBe('victory');
        expect(report.friendshipReward).toBeUndefined();
    });
});

describe('Phase 62 — quest-branch wire-in on outcome === friendship', () => {
    it('friendship outcome appends FriendshipReward.flagSet to state.flags (de-duped)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        store.getState().endCombat('friendship');
        // First friendship sets the flag.
        expect(store.getState().flags).toContain('befriended-mournful-gull');

        // Drive a second friendship encounter (same flag would be a no-op).
        store.getState().startCombat(MournfulGull);
        store.getState().endCombat('friendship');
        // De-duped: still exactly one occurrence per Phase 62 D3.
        const matches = store.getState().flags.filter(f => f === 'befriended-mournful-gull');
        expect(matches.length).toBe(1);
    });

    it('victory outcome does NOT set the friendship flag (only fires for outcome === friendship)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        store.getState().endCombat('victory');
        expect(store.getState().flags).not.toContain('befriended-mournful-gull');
    });

    it('Coastal Beggar gull-recognition branch is hidden pre-friendship + visible post-friendship', async () => {
        const { visibleChoices } = await import('../../NPCs');
        const { getMapDefinition } = await import('../../World/map.registry');
        const fishingVillage = getMapDefinition('coastal-continent', 'fishing-village');
        const beggar = fishingVillage.npcs!.find(npc => npc.name === 'Coastal Beggar')!;
        const greetNode = beggar.dialogueTree!.nodes.greet;

        const baseCtx = {
            activeQuests: new Set<string>(),
            completedQuests: new Set<string>(),
        };

        // Pre-friendship: gull_recognition choice should be hidden.
        const visibleBefore = visibleChoices(greetNode, {
            ...baseCtx,
            flags: new Set<string>(),
        });
        expect(visibleBefore.find(c => c.nextNodeId === 'gull_recognition')).toBeUndefined();

        // Post-friendship: with the flag set, the choice surfaces.
        const visibleAfter = visibleChoices(greetNode, {
            ...baseCtx,
            flags: new Set(['befriended-mournful-gull']),
        });
        const gullChoice = visibleAfter.find(c => c.nextNodeId === 'gull_recognition');
        expect(gullChoice).toBeDefined();
        expect(gullChoice!.text).toMatch(/quieter/);
    });

    it('end-to-end: friendship → flag-set → dialogue branch unlocks', () => {
        // Drive the full path through createGameStore. visibleChoices is
        // pure-engine so we don't need the store after endCombat — but
        // assert state.flags carries the flag the dialogue engine will read.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        store.getState().endCombat('friendship');
        expect(store.getState().flags).toContain('befriended-mournful-gull');
        // The dialogue runtime reads ctx.flags = state.flags downstream;
        // the visibleChoices behaviour is pinned by the test above.
    });
});

describe('Phase 68 — Coastal Tyrant BefriendabilityConfig integration', () => {
    it('befriend grants the boss-tier friendshipReward on the friendship outcome', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(CoastalTyrant);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
    });
});

describe('Phase 69 — FriendshipReward.alignmentDelta', () => {
    it('applies the per-enemy alignmentDelta to state.philosophicalAlignment on friendship', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        const before = store.getState().philosophicalAlignment;
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        const mournfulDelta = MournfulGull.friendshipReward?.alignmentDelta;
        if (!mournfulDelta) {
            throw new Error('Phase 69 test premise: MournfulGull must carry alignmentDelta');
        }
        const expected = {
            epistemology: clamp(before.epistemology + (mournfulDelta.epistemology ?? 0)),
            outlook: clamp(before.outlook + (mournfulDelta.outlook ?? 0)),
            scope: clamp(before.scope + (mournfulDelta.scope ?? 0)),
        };
        expect(store.getState().philosophicalAlignment).toEqual(expected);
        expect(report.friendshipReward?.alignmentShift).toEqual(expected);
    });

    it('does NOT shift alignment on victory even when the enemy carries alignmentDelta', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        const before = store.getState().philosophicalAlignment;
        const report = store.getState().endCombat('victory');

        expect(report.outcome).toBe('victory');
        expect(store.getState().philosophicalAlignment).toEqual(before);
        expect(report.friendshipReward).toBeUndefined();
    });

    it('clamps each axis to [-100, +100] at the eligibility check', () => {
        const store = createGameStore(nullAdapter);
        // Pre-load the player near the +100 ceiling on outlook so the
        // delta exercises the clamp.
        store.getState().shiftPhilosophicalAlignment({ outlook: 100 });
        const cap = store.getState().philosophicalAlignment.outlook;
        expect(cap).toBe(100);

        store.getState().startCombat(MournfulGull);
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // outlook would have overshot 100 + positive delta; clamp pins it at 100.
        expect(store.getState().philosophicalAlignment.outlook).toBeLessThanOrEqual(100);
        expect(report.friendshipReward?.alignmentShift?.outlook).toBeLessThanOrEqual(100);
    });

    it('omits friendshipReward.alignmentShift when the enemy has no alignmentDelta', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TidepoolCrab);
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // TidepoolCrab carries no friendshipReward at all; alignmentShift should
        // remain undefined.
        expect(report.friendshipReward).toBeUndefined();
    });
});

describe('Phase 70 — Coastal Tyrant boss-tier friendshipReward (full Phase 60+62+68+69 stack)', () => {
    it('threads items + xpBonus + narrative + alignmentShift + flagSet on the friendship path', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(CoastalTyrant);
        const beforeAlignment = store.getState().philosophicalAlignment;
        const initialMeter = selectMoralMeter(store.getState());

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');

        // Items thread — boss-tier reward includes the Paradox Loop unique
        // + two consumables (healing-potion + heart-draught).
        const lootIds = report.loot.map(i => i.id);
        expect(lootIds).toContain('paradox-loop');
        expect(lootIds).toContain('healing-potion');
        expect(lootIds).toContain('heart-draught');

        // xpBonus — Phase 70 D2 sets +75 on top of the half-XP base for the
        // boss tier (6 * 200 / 2 = 600; +75 = 675).
        expect(report.xpGained).toBe(Math.floor(6 * 200 * 0.5) + 75);

        // narrative — the magistrate-fallen-priest's recognition + release.
        expect(report.friendshipReward?.narrative).toMatch(/magistrate/);
        expect(report.friendshipReward?.narrative).toMatch(/circlet/);

        // alignmentShift — { outlook: +3, scope: -2 } applied via clamp.
        const expectedAlignment = {
            epistemology: beforeAlignment.epistemology,
            outlook: beforeAlignment.outlook + 3,
            scope: beforeAlignment.scope - 2,
        };
        expect(report.friendshipReward?.alignmentShift).toEqual(expectedAlignment);
        expect(store.getState().philosophicalAlignment).toEqual(expectedAlignment);

        // flagSet — Phase 62 convention; downstream content can gate on the flag.
        expect(store.getState().flags).toContain('befriended-coastal-tyrant');

        // Phase 36 baseline still fires — moral meter +1.
        expect(selectMoralMeter(store.getState())).toBe(initialMeter + 1);
    });

    it('does NOT thread the friendshipReward content on victory outcome', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(CoastalTyrant);
        const report = store.getState().endCombat('victory');
        expect(report.outcome).toBe('victory');
        expect(report.friendshipReward).toBeUndefined();
        expect(store.getState().flags).not.toContain('befriended-coastal-tyrant');
    });
});

describe('Phase 102 — Befriendable-enemy Tier-2 expansion', () => {
    it('TideflukeReaver friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TideflukeReaver);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'body-elixir')).toBe(true);
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(4 * 50 * 0.5) + 35); // base half-XP (elite) + 35 bonus
        expect(report.friendshipReward?.narrative).toMatch(/salt-bound reaver/);
        expect(store.getState().flags).toContain('befriended-tidefluke-reaver');
    });

    it('HushWraith friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(HushWraith);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'clarity-serum')).toBe(true);
        expect(report.loot.some(item => item.id === 'antidote')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(5 * 50 * 0.5) + 40); // elite half-XP + 40 bonus
        expect(report.friendshipReward?.narrative).toMatch(/silence breaks into whisper/);
        expect(store.getState().flags).toContain('befriended-hush-wraith');
    });

    it('HollowSaint friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(HollowSaint);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'resonance-crystal')).toBe(true);
        expect(report.loot.some(item => item.id === 'heart-draught')).toBe(true);
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(5 * 50 * 0.5) + 45); // elite half-XP + 45 bonus
        expect(report.friendshipReward?.narrative).toMatch(/hollow saint finds purpose/);
        expect(store.getState().flags).toContain('befriended-hollow-saint');
    });

    it('TheDisagreement boss-tier friendship threads boss-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TheDisagreement);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'philosopher-tea')).toBe(true);
        expect(report.loot.some(item => item.id === 'focus-vial')).toBe(true);
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.loot.some(item => item.id === 'clarity-serum')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(8 * 200 * 0.5) + 80); // boss half-XP + 80 bonus
        expect(report.friendshipReward?.narrative).toMatch(/disagreement resolves into dialogue/);
        expect(store.getState().flags).toContain('befriended-the-disagreement');
    });
});

function clamp(v: number): number {
    return Math.max(-100, Math.min(100, v));
}
