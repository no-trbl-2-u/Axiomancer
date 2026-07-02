/**
 * Hermetic e2e for the Phase 43 authoring surfaces.
 *
 * Unit 1 — verifies that `alignmentDelta` on a dialogue choice and on a
 * map-event pool entry actually shifts `GameState.philosophicalAlignment`
 * via the existing resolvers (applyDialogueChoice + resolveMapEvent).
 * Unit 3 will extend with a full-store / gameReducer-driven case.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyDialogueChoice } from '../../World/dialogue.runtime';
import {
    resolveMapEvent,
    registerMapEventPool,
    setNodeEventPoolOverride,
    _clearMapEventPoolRegistry,
} from '../../World/MapEvents/resolve-map-event';
import { createNewGameState } from '../../Game/game.reducer';
import type { DialogueChoice, DialogueTree } from '../../NPCs/types';
import type { MapEventPool } from '../../World/MapEvents/types';
import { mockSequentialRng, restoreOriginalRng } from '../../test-utils/rng';

function makeTree(): DialogueTree {
    return {
        rootId: 'root',
        nodes: {
            root: { id: 'root', text: 'root', choices: [] },
        },
    };
}

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
    _clearMapEventPoolRegistry();
});

describe('Phase 43 — dialogue alignmentDelta', () => {
    it('applies a partial alignmentDelta on a dialogue choice and surfaces philosophicalShift', () => {
        const tree = makeTree();
        const choice: DialogueChoice = {
            text: 'Speak with kindness',
            effect: {
                alignmentDelta: { outlook: 10, scope: 5 },
            },
        };

        const state = createNewGameState();
        expect(state.philosophicalAlignment).toEqual({ epistemology: 0, outlook: 0, scope: 0 });

        const res = applyDialogueChoice(state, tree, choice);
        expect(res.gameState.philosophicalAlignment).toEqual({
            epistemology: 0,
            outlook: 10,
            scope: 5,
        });
        expect(res.effects.philosophicalShift).toEqual({ outlook: 10, scope: 5 });
    });

    it('does not populate philosophicalShift when the choice carries no alignmentDelta', () => {
        const tree = makeTree();
        const choice: DialogueChoice = {
            text: 'Stay silent',
            effect: { moralDelta: 1 },
        };
        const res = applyDialogueChoice(createNewGameState(), tree, choice);
        expect(res.effects.philosophicalShift).toBeUndefined();
        expect(res.gameState.philosophicalAlignment).toEqual({ epistemology: 0, outlook: 0, scope: 0 });
    });

    it('clamps alignment shifts at the [-100, +100] axis bounds', () => {
        const tree = makeTree();
        const choice: DialogueChoice = {
            text: 'Massive optimistic surge',
            effect: { alignmentDelta: { outlook: 150 } },
        };
        const start = createNewGameState();
        const seeded = { ...start, philosophicalAlignment: { epistemology: 0, outlook: 90, scope: 0 } };
        const res = applyDialogueChoice(seeded, tree, choice);
        expect(res.gameState.philosophicalAlignment.outlook).toBe(100);
    });
});

describe('Phase 46 — alignment-gated content (live authored gates)', () => {
    it('the pessimistic-only Old Marrow branch is visible only to outlook ≤ -34', async () => {
        const { getMapDefinition } = await import('../../World/map.registry');
        const { visibleChoices } = await import('../../NPCs/dialogue');
        await import('../../World/Continents/Coastal-Village/maps');

        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const tree = def.npcs!.find(n => n.name === 'Old Marrow')!.dialogueTree!;
        const offer = tree.nodes['offer'];

        const pessimistic = {
            activeQuests: new Set<string>(), completedQuests: new Set<string>(), flags: new Set<string>(),
            alignment: { epistemology: 0, outlook: -50, scope: 0 },
        };
        const optimistic = {
            activeQuests: new Set<string>(), completedQuests: new Set<string>(), flags: new Set<string>(),
            alignment: { epistemology: 0, outlook: 50, scope: 0 },
        };
        const noAlign = {
            activeQuests: new Set<string>(), completedQuests: new Set<string>(), flags: new Set<string>(),
        };

        const pessVisible = visibleChoices(offer, pessimistic);
        const optVisible = visibleChoices(offer, optimistic);
        const noAlignVisible = visibleChoices(offer, noAlign);

        const gatedText = 'You speak like someone who already lost everything.';
        expect(pessVisible.some(c => c.text === gatedText)).toBe(true);
        expect(optVisible.some(c => c.text === gatedText)).toBe(false);
        expect(noAlignVisible.some(c => c.text === gatedText)).toBe(false);
    });

    it('nirvana-fallacy is learnable only when outlook ≤ -34', async () => {
        const { getCardById } = await import('../../Cards/cards.library');
        const { meetsLearningRequirement } = await import('../../Cards/skill.engine');
        const { createCharacter } = await import('../../Character');

        const skill = getCardById('nirvana-fallacy')!;
        const ch = createCharacter({
            name: 'Tester', level: 10,
            baseStats: { heart: 6, body: 6, mind: 6 },
        });

        expect(meetsLearningRequirement(ch, skill,
            { epistemology: 0, outlook: -50, scope: 0 })).toBe(true);
        expect(meetsLearningRequirement(ch, skill,
            { epistemology: 0, outlook: 0, scope: 0 })).toBe(false);
        expect(meetsLearningRequirement(ch, skill)).toBe(false); // no alignment → gate fails
    });

    it('appeal-to-fear is learnable only when scope ≥ 34', async () => {
        const { getCardById } = await import('../../Cards/cards.library');
        const { meetsLearningRequirement } = await import('../../Cards/skill.engine');
        const { createCharacter } = await import('../../Character');

        const skill = getCardById('appeal-to-fear')!;
        const ch = createCharacter({
            name: 'Tester', level: 10,
            baseStats: { heart: 6, body: 6, mind: 6 },
        });

        expect(meetsLearningRequirement(ch, skill,
            { epistemology: 0, outlook: 0, scope: 50 })).toBe(true);
        expect(meetsLearningRequirement(ch, skill,
            { epistemology: 0, outlook: 0, scope: 0 })).toBe(false);
    });

    it('LEARN_SKILL dispatched through gameReducer respects the alignment gate', async () => {
        const { gameReducer, createNewGameState } = await import('../../Game/game.reducer');

        const state = createNewGameState();
        // Player needs level 10 + the right alignment. Boost both for the
        // positive case.
        const pessimisticAtLevel: typeof state = {
            ...state,
            player: { ...state.player, level: 10 },
            philosophicalAlignment: { epistemology: 0, outlook: -50, scope: 0 },
        };
        const optimisticAtLevel: typeof state = {
            ...state,
            player: { ...state.player, level: 10 },
            philosophicalAlignment: { epistemology: 0, outlook: 50, scope: 0 },
        };

        const learned = gameReducer(pessimisticAtLevel, {
            type: 'LEARN_SKILL',
            payload: { skillId: 'nirvana-fallacy' },
        });
        expect(learned.player.knownSkills).toContain('nirvana-fallacy');

        const refused = gameReducer(optimisticAtLevel, {
            type: 'LEARN_SKILL',
            payload: { skillId: 'nirvana-fallacy' },
        });
        expect(refused.player.knownSkills).not.toContain('nirvana-fallacy');
    });
});

describe('Phase 43 — full path through gameReducer (APPLY_DIALOGUE)', () => {
    it('APPLY_DIALOGUE on the authored Old Marrow tree shifts GameState.philosophicalAlignment', async () => {
        const { gameReducer } = await import('../../Game/game.reducer');
        const { getMapDefinition } = await import('../../World/map.registry');
        await import('../../World/Continents/Coastal-Village/maps');

        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const tree = def.npcs!.find(n => n.name === 'Old Marrow')!.dialogueTree!;
        // "Take half" requires `questCompleted: 'starting-quest'`; bypass by
        // hand-crafting an identical choice without the gate so the runtime
        // applies the authored effect.
        const authored = tree.nodes['thanks'].choices!
            .find(c => c.text.includes('Take only half'))!;
        const choice = { ...authored, requires: undefined };

        const state = createNewGameState();
        const before = state.philosophicalAlignment;
        const next = gameReducer(state, { type: 'APPLY_DIALOGUE', payload: { tree, choice } });
        // Faith-Optimistic-Relational sign-pin: every axis moved in the
        // expected direction.
        expect(next.philosophicalAlignment.epistemology).toBeLessThan(before.epistemology);
        expect(next.philosophicalAlignment.outlook).toBeGreaterThan(before.outlook);
        expect(next.philosophicalAlignment.scope).toBeGreaterThan(before.scope);
    });
});

describe('Phase 43 — content authoring (directional drift)', () => {
    it('Old Marrow "Take only half" choice carries a Faith-Optimistic-Relational pull', async () => {
        // Pull the authored tree by re-importing the maps module, which
        // registers it via getMapDefinition. Drive applyDialogueChoice
        // against the actual content rather than a synthetic stub.
        const { getMapDefinition } = await import('../../World/map.registry');
        await import('../../World/Continents/Coastal-Village/maps');
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const tree = def.npcs!.find(n => n.name === 'Old Marrow')!.dialogueTree!;
        const thanksNode = tree.nodes['thanks'];
        const halfChoice = thanksNode.choices!.find(c => c.text.includes('Take only half'))!;
        const d = halfChoice.effect?.alignmentDelta;
        expect(d).toBeDefined();
        // Direction-pinned: epistemology ↓ (Faith), outlook ↑ (Optimistic),
        // scope ↑ (Relational). Magnitudes are authoring-balance work and
        // may drift; signs must not.
        expect((d!.epistemology ?? 0)).toBeLessThan(0);
        expect((d!.outlook ?? 0)).toBeGreaterThan(0);
        expect((d!.scope ?? 0)).toBeGreaterThan(0);
    });

    it('Old Marrow "Pay double" choice carries a Logic-Pessimistic-Individual pull', async () => {
        const { getMapDefinition } = await import('../../World/map.registry');
        await import('../../World/Continents/Coastal-Village/maps');
        const def = getMapDefinition('coastal-continent', 'fishing-village');
        const tree = def.npcs!.find(n => n.name === 'Old Marrow')!.dialogueTree!;
        const doubleChoice = tree.nodes['thanks'].choices!.find(c => c.text.includes('Pay double'))!;
        const d = doubleChoice.effect?.alignmentDelta;
        expect(d).toBeDefined();
        expect((d!.epistemology ?? 0)).toBeGreaterThan(0);
        expect((d!.outlook ?? 0)).toBeLessThan(0);
        expect((d!.scope ?? 0)).toBeLessThan(0);
    });
});

describe('Phase 43 — map-event pool-entry alignmentDelta', () => {
    beforeEach(() => {
        _clearMapEventPoolRegistry();
        // Deterministic single-entry pool roll; mockSequentialRng returns the
        // same value indefinitely so createCharacter's id-gen + the pool roll
        // both succeed without exhausting a fixed sequence.
        mockSequentialRng(0);
    });

    it('shifts philosophicalAlignment when the resolved pool entry carries an alignmentDelta', () => {
        const state = createNewGameState();
        const { continent, name, currentNode } = state.world.currentMap;

        const pool: MapEventPool = {
            id: 'phase43-test-pool',
            entries: [{
                kind: 'rest',
                weight: 1,
                payload: { kind: 'rest', healFraction: 0 },
                alignmentDelta: { epistemology: -5, scope: 8 },
            }],
        };
        registerMapEventPool(pool);
        setNodeEventPoolOverride(continent, name, currentNode, pool.id);

        const result = resolveMapEvent(state);
        expect(result.event.kind).toBe('rest');
        expect(result.state.philosophicalAlignment).toEqual({
            epistemology: -5,
            outlook: 0,
            scope: 8,
        });
    });

    it('leaves philosophicalAlignment unchanged when the entry carries no alignmentDelta', () => {
        const state = createNewGameState();
        const { continent, name, currentNode } = state.world.currentMap;

        const pool: MapEventPool = {
            id: 'phase43-no-delta-pool',
            entries: [{
                kind: 'rest',
                weight: 1,
                payload: { kind: 'rest', healFraction: 0 },
            }],
        };
        registerMapEventPool(pool);
        setNodeEventPoolOverride(continent, name, currentNode, pool.id);

        const result = resolveMapEvent(state);
        expect(result.state.philosophicalAlignment).toEqual({ epistemology: 0, outlook: 0, scope: 0 });
    });
});
