/**
 * Hermetic e2e — Phase 60 befriendable-enemy content arc (2026-07-06 roster).
 *
 * Drives a friendship outcome for LittleBelle + WaterHolger end-to-end
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
    LittleBelle, WaterHolger, GraveLarva, KingOfRevenge,
    BrineHag, TheFerryman, HasshakuSama, FateSpinner,
} from '../../Enemy/enemy.library';
import { createGameStore, selectMoralMeter } from '../store';
import { nullAdapter } from '../persistence/null.adapter';

describe('Phase 60 — befriendable-enemy content arc', () => {
    it('LittleBelle friendship report carries the per-enemy items + xpBonus + narrative', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);

        const initialMeter = selectMoralMeter(store.getState());
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // Items — Tier 0 item 2 retired heart-draught (a no-op consumable);
        // LittleBelle's friendshipReward no longer guarantees an item.
        // xpBonus — base half-XP for LittleBelle (level 2, normal:
        // 2 * 20 / 2 = 20) plus the authored +10 bonus.
        expect(report.xpGained).toBe(30);
        // Narrative — pulls from the authored string in enemy.library.ts.
        expect(report.friendshipReward?.narrative).toMatch(/bell/);
        // Phase 36 base still fires: +1 moralMeter shift.
        expect(selectMoralMeter(store.getState())).toBe(initialMeter + 1);
    });

    it('WaterHolger friendship grants 2 phials + xpBonus 15 + watch-stood narrative', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(WaterHolger);

        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // Two guaranteed phials (healing-potion + antidote) on top of any
        // weighted-roll loot.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.loot.some(item => item.id === 'antidote')).toBe(true);
        // Base half-XP for WaterHolger (level 3, normal: 3 * 20 / 2 = 30)
        // plus authored +15 bonus.
        expect(report.xpGained).toBe(45);
        expect(report.friendshipReward?.narrative).toMatch(/phials/);
    });

    it('GraveLarva friendship omits report.friendshipReward — enemy has no authored reward', () => {
        // Regression guard for Phase 60 D12: existing consumers that
        // destructure { outcome, xpGained, loot } continue to work; the
        // friendshipReward field is undefined for enemies without authoring.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(GraveLarva);

        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        expect(report.friendshipReward).toBeUndefined();
        // Phase 36 base still computes: half-XP only; no xpBonus applied.
        // Base half-XP for GraveLarva (level 1, simple: 1 * 10 / 2 = 5).
        expect(report.xpGained).toBe(5);
    });

    it('victory outcome does NOT thread friendshipReward content even when authored', () => {
        // Phase 60 D7 — friendshipReward field surfaces ONLY on
        // outcome === 'friendship'. Defeat / victory / flee paths skip it.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
        const report = store.getState().endCombat('victory');

        expect(report.outcome).toBe('victory');
        expect(report.friendshipReward).toBeUndefined();
    });
});

describe('Phase 62 — quest-branch wire-in on outcome === friendship', () => {
    it('friendship outcome appends FriendshipReward.flagSet to state.flags (de-duped)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
        store.getState().endCombat('friendship');
        // First friendship sets the flag.
        expect(store.getState().flags).toContain('befriended-little-belle');

        // Drive a second friendship encounter (same flag would be a no-op).
        store.getState().startCombat(LittleBelle);
        store.getState().endCombat('friendship');
        // De-duped: still exactly one occurrence per Phase 62 D3.
        const matches = store.getState().flags.filter(f => f === 'befriended-little-belle');
        expect(matches.length).toBe(1);
    });

    it('victory outcome does NOT set the friendship flag (only fires for outcome === friendship)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
        store.getState().endCombat('victory');
        expect(store.getState().flags).not.toContain('befriended-little-belle');
    });

    it('Coastal Beggar bell-recognition branch is hidden pre-friendship + visible post-friendship', async () => {
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
            flags: new Set(['befriended-little-belle']),
        });
        const bellChoice = visibleAfter.find(c => c.nextNodeId === 'gull_recognition');
        expect(bellChoice).toBeDefined();
        expect(bellChoice!.text).toMatch(/quiet/);
    });

    it('end-to-end: friendship → flag-set → dialogue branch unlocks', () => {
        // Drive the full path through createGameStore. visibleChoices is
        // pure-engine so we don't need the store after endCombat — but
        // assert state.flags carries the flag the dialogue engine will read.
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
        store.getState().endCombat('friendship');
        expect(store.getState().flags).toContain('befriended-little-belle');
        // The dialogue runtime reads ctx.flags = state.flags downstream;
        // the visibleChoices behaviour is pinned by the test above.
    });
});

describe('Phase 68 — King of Revenge BefriendabilityConfig integration', () => {
    it('befriend grants the boss-tier friendshipReward on the friendship outcome', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(KingOfRevenge);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
    });
});

describe('Phase 69 — FriendshipReward.alignmentDelta', () => {
    it('applies the per-enemy alignmentDelta to state.philosophicalAlignment on friendship', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
        const before = store.getState().philosophicalAlignment;
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        const belleDelta = LittleBelle.friendshipReward?.alignmentDelta;
        if (!belleDelta) {
            throw new Error('Phase 69 test premise: LittleBelle must carry alignmentDelta');
        }
        const expected = {
            epistemology: clamp(before.epistemology + (belleDelta.epistemology ?? 0)),
            outlook: clamp(before.outlook + (belleDelta.outlook ?? 0)),
            scope: clamp(before.scope + (belleDelta.scope ?? 0)),
        };
        expect(store.getState().philosophicalAlignment).toEqual(expected);
        expect(report.friendshipReward?.alignmentShift).toEqual(expected);
    });

    it('does NOT shift alignment on victory even when the enemy carries alignmentDelta', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(LittleBelle);
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

        store.getState().startCombat(LittleBelle);
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // outlook would have overshot 100 + positive delta; clamp pins it at 100.
        expect(store.getState().philosophicalAlignment.outlook).toBeLessThanOrEqual(100);
        expect(report.friendshipReward?.alignmentShift?.outlook).toBeLessThanOrEqual(100);
    });

    it('omits friendshipReward.alignmentShift when the enemy has no alignmentDelta', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(GraveLarva);
        const report = store.getState().endCombat('friendship');

        expect(report.outcome).toBe('friendship');
        // GraveLarva carries no friendshipReward at all; alignmentShift should
        // remain undefined.
        expect(report.friendshipReward).toBeUndefined();
    });
});

describe('Phase 70 — King of Revenge boss-tier friendshipReward (full Phase 60+62+68+69 stack)', () => {
    it('threads items + xpBonus + narrative + alignmentShift + flagSet on the friendship path', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(KingOfRevenge);
        const beforeAlignment = store.getState().philosophicalAlignment;
        const initialMeter = selectMoralMeter(store.getState());

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');

        // Items thread — Phase 21 retired procedural equipment; the boss-tier
        // friendship reward is now consumables only. Tier 0 item 2 retired
        // heart-draught (a no-op consumable), leaving healing-potion.
        const lootIds = report.loot.map(i => i.id);
        expect(lootIds).not.toContain('paradox-loop');
        expect(lootIds).toContain('healing-potion');

        // xpBonus — +75 on top of the half-XP base for the boss tier
        // (6 * 200 / 2 = 600; +75 = 675).
        expect(report.xpGained).toBe(Math.floor(6 * 200 * 0.5) + 75);

        // narrative — the grievance's recognition + release.
        expect(report.friendshipReward?.narrative).toMatch(/grievance/);
        expect(report.friendshipReward?.narrative).toMatch(/crown/);

        // alignmentShift — { outlook: +3, scope: -2 } applied via clamp.
        const expectedAlignment = {
            epistemology: beforeAlignment.epistemology,
            outlook: beforeAlignment.outlook + 3,
            scope: beforeAlignment.scope - 2,
        };
        expect(report.friendshipReward?.alignmentShift).toEqual(expectedAlignment);
        expect(store.getState().philosophicalAlignment).toEqual(expectedAlignment);

        // flagSet — Phase 62 convention; downstream content can gate on the flag.
        expect(store.getState().flags).toContain('befriended-king-of-revenge');

        // Phase 36 baseline still fires — moral meter +1.
        expect(selectMoralMeter(store.getState())).toBe(initialMeter + 1);
    });

    it('does NOT thread the friendshipReward content on victory outcome', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(KingOfRevenge);
        const report = store.getState().endCombat('victory');
        expect(report.outcome).toBe('victory');
        expect(report.friendshipReward).toBeUndefined();
        expect(store.getState().flags).not.toContain('befriended-king-of-revenge');
    });
});

describe('Phase 102 — Befriendable-enemy Tier-2 expansion', () => {
    it('BrineHag friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        // heart-draught was a no-op consumable retired by Tier 0 item 2.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(7 * 50 * 0.5) + 35); // base half-XP (elite) + 35 bonus
        expect(report.friendshipReward?.narrative).toMatch(/hag lowers her hands/);
        expect(store.getState().flags).toContain('befriended-brine-hag');
    });

    it('TheFerryman friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TheFerryman);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(report.loot.some(item => item.id === 'clarity-serum')).toBe(true);
        expect(report.loot.some(item => item.id === 'antidote')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(8 * 50 * 0.5) + 40); // elite half-XP + 40 bonus
        expect(report.friendshipReward?.narrative).toMatch(/No charge/);
        expect(store.getState().flags).toContain('befriended-the-ferryman');
    });

    it('Hasshaku-sama friendship threads elite-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(HasshakuSama);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        // resonance-crystal and heart-draught were no-op consumables retired
        // by Tier 0 item 2.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(21 * 50 * 0.5) + 45); // elite half-XP + 45 bonus
        expect(report.friendshipReward?.narrative).toMatch(/Everyone runs/);
        expect(store.getState().flags).toContain('befriended-hasshaku-sama');
    });

    it('FateSpinner boss-tier friendship threads boss-tier reward', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(FateSpinner);

        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        // philosopher-tea and focus-vial were no-op consumables retired by
        // Tier 0 item 2.
        expect(report.loot.some(item => item.id === 'healing-potion')).toBe(true);
        expect(report.loot.some(item => item.id === 'clarity-serum')).toBe(true);
        expect(report.xpGained).toBe(Math.floor(26 * 200 * 0.5) + 80); // boss half-XP + 80 bonus
        expect(report.friendshipReward?.narrative).toMatch(/Loose thread/);
        expect(store.getState().flags).toContain('befriended-fate-spinner');
    });
});

function clamp(v: number): number {
    return Math.max(-100, Math.min(100, v));
}
