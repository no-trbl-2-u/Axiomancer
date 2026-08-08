/**
 * Hermetic e2e — measurement-seat deck swaps (`applyDeckSwaps` + the
 * `preset:<id>+swap:<out>/<in>` selection grammar).
 *
 * The swap surface is `/deck-tuning`'s A/B lever for the sandbox swap pool:
 * a preset deck with every copy of one seat's card replaced by a candidate.
 * Loud-failure law: a swap that would silently no-op (out not in the deck,
 * in not resolvable) throws instead — a silent no-op corrupts the experiment
 * it was meant to run.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { applyDeckSwaps, resolveDeckSelection } from '../combat.deck-draft';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import { parseDeckSelectionArg } from '../combat.playtest';
import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';

afterEach(() => {
    clearSandboxCards();
    vi.restoreAllMocks();
});

/** Minimal legal sandbox spell — a swap-in candidate for the tests below. */
const swapCandidate: Card = {
    id: 'test-swap-candidate',
    name: 'Test Swap Candidate',
    philosophicalAspect: 'mind',
    description: 'A fixture. It argues nothing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
};

describe('applyDeckSwaps', () => {
    it('replaces EVERY copy of out, preserving copy count and seat order', () => {
        const deck = ['a-card', 'spoiled-poultice', 'a-card', 'other'];
        // 'out' presence is checked against the list; 'in' must resolve via
        // getCardById — use a real library id.
        const swapped = applyDeckSwaps(deck, [{ out: 'a-card', in: 'spoiled-poultice' }]);
        expect(swapped).toEqual(['spoiled-poultice', 'spoiled-poultice', 'spoiled-poultice', 'other']);
    });

    it('applies swaps in order — a later swap may target a swapped-in id', () => {
        const deck = ['x', 'y'];
        const swapped = applyDeckSwaps(deck, [
            { out: 'x', in: 'spoiled-poultice' },
            { out: 'spoiled-poultice', in: 'petty-indictment' },
        ]);
        expect(swapped).toEqual(['petty-indictment', 'y']);
    });

    it('throws when out is not in the deck (no silent no-op)', () => {
        expect(() => applyDeckSwaps(['a'], [{ out: 'missing', in: 'spoiled-poultice' }]))
            .toThrow(/'missing' is not in the resolved deck/);
    });

    it('throws when in resolves to neither library nor registered sandbox', () => {
        expect(() => applyDeckSwaps(['a'], [{ out: 'a', in: 'no-such-card' }]))
            .toThrow(/'no-such-card' is not a library card or a registered sandbox card/);
    });

    it('accepts a REGISTERED sandbox card as the swap-in', () => {
        registerSandboxCards([swapCandidate]);
        const swapped = applyDeckSwaps(['a', 'a'], [{ out: 'a', in: swapCandidate.id }]);
        expect(swapped).toEqual([swapCandidate.id, swapCandidate.id]);
    });
});

describe('parseDeckSelectionArg — the +swap: suffix', () => {
    it('parses a plain preset unchanged', () => {
        expect(parseDeckSelectionArg('preset:threadbare')).toEqual({ kind: 'preset', presetId: 'threadbare' });
    });

    it('parses one and many swap pairs', () => {
        expect(parseDeckSelectionArg('preset:threadbare+swap:a/b')).toEqual({
            kind: 'preset', presetId: 'threadbare', swaps: [{ out: 'a', in: 'b' }],
        });
        expect(parseDeckSelectionArg('preset:threadbare+swap:a/b, c/d')).toEqual({
            kind: 'preset', presetId: 'threadbare',
            swaps: [{ out: 'a', in: 'b' }, { out: 'c', in: 'd' }],
        });
    });

    it('still validates the preset id eagerly', () => {
        expect(() => parseDeckSelectionArg('preset:nope+swap:a/b')).toThrow(/Unknown deck preset 'nope'/);
    });

    it('rejects malformed pairs and an empty suffix loudly', () => {
        expect(() => parseDeckSelectionArg('preset:threadbare+swap:a')).toThrow(/Bad swap pair 'a'/);
        expect(() => parseDeckSelectionArg('preset:threadbare+swap:a/b/c')).toThrow(/Bad swap pair 'a\/b\/c'/);
        expect(() => parseDeckSelectionArg('preset:threadbare+swap:')).toThrow(/needs at least one/);
    });
});

describe('resolveDeckSelection — preset + swaps', () => {
    it('resolves to the preset deck with the seat substituted (flag-agnostic)', () => {
        registerSandboxCards([swapCandidate]);
        const base = buildPresetDeck('threadbare');
        expect(base.length).toBeGreaterThan(0);
        const out = base[0];
        const copies = base.filter(id => id === out).length;

        const resolved = resolveDeckSelection(
            { kind: 'preset', presetId: 'threadbare', swaps: [{ out, in: swapCandidate.id }] },
            undefined,
        );

        expect(resolved).toEqual(applyDeckSwaps(base, [{ out, in: swapCandidate.id }]));
        expect(resolved.filter(id => id === swapCandidate.id).length).toBe(copies);
        expect(resolved).not.toContain(out);
        expect(resolved.length).toBe(base.length);
    });

    it('swap-less preset selections stay byte-identical to buildPresetDeck', () => {
        expect(resolveDeckSelection({ kind: 'preset', presetId: 'threadbare' }, undefined))
            .toEqual(buildPresetDeck('threadbare'));
    });
});
